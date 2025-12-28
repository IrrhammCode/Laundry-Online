const { validationResult } = require('express-validator');
const db = require('../config/database');

exports.submitComplaint = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                ok: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { subject, message, order_id } = req.body;
        const userId = req.user.id;

        // Verify order belongs to user if order_id provided
        if (order_id) {
            const { data: orderData, error: orderError } = await db
                .from('orders')
                .select('id')
                .eq('id', order_id)
                .eq('user_id', userId)
                .single();

            if (orderError || !orderData) {
                return res.status(404).json({
                    ok: false,
                    error: 'Order not found or access denied'
                });
            }
        }

        // Create complaint
        const { data: newComplaint, error: insertError } = await db
            .from('complaints')
            .insert({
                order_id: order_id || null,
                user_id: userId,
                subject,
                message
            })
            .select()
            .single();

        if (insertError) throw insertError;

        res.status(201).json({
            ok: true,
            data: {
                complaint: newComplaint
            }
        });

    } catch (error) {
        console.error('Submit complaint error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to submit complaint'
        });
    }
};

exports.getUserComplaints = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        let complaintsQuery = db
            .from('complaints')
            .select('id, order_id, subject, message, status, admin_response, created_at, updated_at')
            .eq('user_id', userId);

        if (status) {
            complaintsQuery = complaintsQuery.eq('status', status);
        }

        const { data: complaints, error: complaintsError } = await complaintsQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (complaintsError) throw complaintsError;

        // Get order numbers for complaints with order_id
        const complaintsWithOrders = await Promise.all(
            (complaints || []).map(async (complaint) => {
                if (complaint.order_id) {
                    const { data: orderData, error: orderErr } = await db
                        .from('orders')
                        .select('id')
                        .eq('id', complaint.order_id)
                        .single();

                    if (!orderErr && orderData) {
                        return {
                            ...complaint,
                            order_number: orderData.id
                        };
                    }
                }
                return {
                    ...complaint,
                    order_number: null
                };
            })
        );

        // Get total count
        let countQuery = db
            .from('complaints')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (status) {
            countQuery = countQuery.eq('status', status);
        }

        const { count: total, error: countError } = await countQuery;
        if (countError) throw countError;

        res.json({
            ok: true,
            data: {
                complaints: complaintsWithOrders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total || 0,
                    total_pages: Math.ceil((total || 0) / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get complaints error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch complaints'
        });
    }
};

exports.getComplaintDetail = async (req, res) => {
    try {
        const complaintId = req.params.id;
        const userId = req.user.id;

        const { data: complaint, error: complaintError } = await db
            .from('complaints')
            .select('id, order_id, subject, message, status, admin_response, created_at, updated_at')
            .eq('id', complaintId)
            .eq('user_id', userId)
            .single();

        if (complaintError || !complaint) {
            return res.status(404).json({
                ok: false,
                error: 'Complaint not found'
            });
        }

        // Get order number if order_id exists
        let order_number = null;
        if (complaint.order_id) {
            const { data: orderData, error: orderErr } = await db
                .from('orders')
                .select('id')
                .eq('id', complaint.order_id)
                .single();

            if (!orderErr && orderData) {
                order_number = orderData.id;
            }
        }

        res.json({
            ok: true,
            data: {
                complaint: {
                    ...complaint,
                    order_number
                }
            }
        });

    } catch (error) {
        console.error('Get complaint detail error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch complaint'
        });
    }
};

exports.getAllComplaints = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (page - 1) * limit;

        let complaintsQuery = db
            .from('complaints')
            .select('id, order_id, subject, message, status, admin_response, created_at, updated_at, user_id');

        if (status) {
            complaintsQuery = complaintsQuery.eq('status', status);
        }

        const { data: complaints, error: complaintsError } = await complaintsQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (complaintsError) throw complaintsError;

        // Get user details and order numbers
        const complaintsWithDetails = await Promise.all(
            (complaints || []).map(async (complaint) => {
                const { data: userData, error: userErr } = await db
                    .from('users')
                    .select('name, email')
                    .eq('id', complaint.user_id)
                    .single();

                if (userErr) throw userErr;

                let order_number = null;
                if (complaint.order_id) {
                    const { data: orderData, error: orderErr } = await db
                        .from('orders')
                        .select('id')
                        .eq('id', complaint.order_id)
                        .single();

                    if (!orderErr && orderData) {
                        order_number = orderData.id;
                    }
                }

                // Apply search filter if provided
                if (search) {
                    const searchLower = search.toLowerCase();
                    const matchesSearch =
                        complaint.subject.toLowerCase().includes(searchLower) ||
                        complaint.message.toLowerCase().includes(searchLower) ||
                        userData.name.toLowerCase().includes(searchLower);

                    if (!matchesSearch) return null;
                }

                return {
                    ...complaint,
                    user_name: userData.name,
                    user_email: userData.email,
                    order_number
                };
            })
        );

        // Filter out null values (from search filter)
        const filteredComplaints = complaintsWithDetails.filter(c => c !== null);

        // Get total count
        let countQuery = db
            .from('complaints')
            .select('*', { count: 'exact', head: true });

        if (status) {
            countQuery = countQuery.eq('status', status);
        }

        const { count: total, error: countError } = await countQuery;
        if (countError) throw countError;

        res.json({
            ok: true,
            data: {
                complaints: filteredComplaints,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total || 0,
                    total_pages: Math.ceil((total || 0) / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get admin complaints error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch complaints'
        });
    }
};

exports.updateComplaintStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                ok: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const complaintId = req.params.id;
        const { status, admin_response } = req.body;

        const { error: updateError } = await db
            .from('complaints')
            .update({
                status,
                admin_response: admin_response || null
            })
            .eq('id', complaintId);

        if (updateError) throw updateError;

        res.json({
            ok: true,
            message: 'Complaint status updated successfully'
        });

    } catch (error) {
        console.error('Update complaint status error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to update complaint status'
        });
    }
};
