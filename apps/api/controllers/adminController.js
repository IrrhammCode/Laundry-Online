const { validationResult } = require('express-validator');
const db = require('../config/database');
const nodemailer = require('nodemailer');

// Email transporter setup
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

exports.getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (page - 1) * limit;

        // Build query for orders
        let ordersQuery = db
            .from('orders')
            .select('id, pickup_method, status, price_total, created_at, updated_at, user_id, admin_approved, delivery_required, pickup_fee')
            .order('status', { ascending: true })
            .order('created_at', { ascending: true });

        if (status) {
            ordersQuery = ordersQuery.eq('status', status);
        }

        // Get orders with pagination
        const { data: ordersData, error: ordersError } = await ordersQuery
            .range(offset, offset + parseInt(limit) - 1);

        if (ordersError) throw ordersError;

        // Get user details and item counts for each order
        const ordersWithDetails = await Promise.all(
            (ordersData || []).map(async (order) => {
                // Get user details
                const { data: userData, error: userError } = await db
                    .from('users')
                    .select('name, phone, email')
                    .eq('id', order.user_id)
                    .single();

                if (userError) throw userError;

                // Get item count
                const { count, error: countError } = await db
                    .from('order_items')
                    .select('*', { count: 'exact', head: true })
                    .eq('order_id', order.id);

                if (countError) throw countError;

                // Apply search filter if provided
                if (search) {
                    const searchLower = search.toLowerCase();
                    const matchesSearch =
                        userData.name.toLowerCase().includes(searchLower) ||
                        userData.email.toLowerCase().includes(searchLower) ||
                        order.id.toString().includes(search);

                    if (!matchesSearch) return null;
                }

                return {
                    id: order.id,
                    pickup_method: order.pickup_method,
                    status: order.status,
                    price_total: order.price_total,
                    pickup_fee: order.pickup_fee || 0,
                    admin_approved: order.admin_approved || false,
                    delivery_required: order.delivery_required,
                    created_at: order.created_at,
                    updated_at: order.updated_at,
                    customer_name: userData.name,
                    phone: userData.phone,
                    email: userData.email,
                    items_count: count || 0
                };
            })
        );

        // Filter out null values (from search filter)
        const filteredOrders = ordersWithDetails.filter(o => o !== null);

        // Get total count (with filters)
        let countQuery = db
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (status) {
            countQuery = countQuery.eq('status', status);
        }

        const { count: total, error: countError } = await countQuery;
        if (countError) throw countError;

        res.json({
            ok: true,
            data: {
                orders: filteredOrders,
                pagination: {
                    page: parseInt(page),
                    current_page: parseInt(page),
                    limit: parseInt(limit),
                    total: total || 0,
                    total_pages: Math.ceil((total || 0) / limit),
                    pages: Math.ceil((total || 0) / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get admin orders error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch orders'
        });
    }
};

exports.getOrderDetail = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Get order details
        const { data: orderData, error: orderError } = await db
            .from('orders')
            .select('id, pickup_method, status, price_total, notes, created_at, updated_at, user_id, admin_approved, delivery_required, pickup_fee')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            return res.status(404).json({
                ok: false,
                error: 'Order not found'
            });
        }

        // Get user details
        const { data: userData, error: userError } = await db
            .from('users')
            .select('name, phone, email, address')
            .eq('id', orderData.user_id)
            .single();

        if (userError) throw userError;

        // Get order items with service details
        const { data: orderItems, error: itemsError } = await db
            .from('order_items')
            .select('id, qty, unit_price, subtotal, service_id')
            .eq('order_id', orderId);

        if (itemsError) throw itemsError;

        // Get service details for each item
        const itemsWithServices = await Promise.all(
            (orderItems || []).map(async (item) => {
                const { data: serviceData, error: serviceErr } = await db
                    .from('services')
                    .select('name, unit')
                    .eq('id', item.service_id)
                    .single();

                if (serviceErr) throw serviceErr;

                return {
                    id: item.id,
                    qty: item.qty,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal,
                    service_name: serviceData.name,
                    unit: serviceData.unit
                };
            })
        );

        // Get payment info
        const { data: payments, error: paymentsError } = await db
            .from('payments')
            .select('id, method, amount, status, paid_at, created_at')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });

        if (paymentsError) throw paymentsError;

        // Get chat messages
        const { data: messagesData, error: messagesError } = await db
            .from('messages')
            .select('id, body, created_at, sender_id')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Get sender details for each message
        const messagesWithSenders = await Promise.all(
            (messagesData || []).map(async (msg) => {
                const { data: senderData, error: senderErr } = await db
                    .from('users')
                    .select('name, role')
                    .eq('id', msg.sender_id)
                    .single();

                if (senderErr) throw senderErr;

                return {
                    id: msg.id,
                    body: msg.body,
                    created_at: msg.created_at,
                    sender_name: senderData.name,
                    sender_role: senderData.role
                };
            })
        );

        res.json({
            ok: true,
            data: {
                order: {
                    ...orderData,
                    customer_name: userData.name,
                    phone: userData.phone,
                    email: userData.email,
                    address: userData.address,
                    items: itemsWithServices,
                    payments: payments || [],
                    messages: messagesWithSenders
                }
            }
        });

    } catch (error) {
        console.error('Get admin order detail error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch order details'
        });
    }
};

exports.approveOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        // Get current order
        const { data: orderData, error: orderError } = await db
            .from('orders')
            .select('id, status, pickup_method, admin_approved, user_id')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            return res.status(404).json({
                ok: false,
                error: 'Order not found'
            });
        }

        // Only approve PICKUP orders that are not yet approved
        if (orderData.pickup_method !== 'PICKUP') {
            return res.status(400).json({
                ok: false,
                error: 'Only PICKUP orders need approval'
            });
        }

        if (orderData.admin_approved) {
            return res.status(400).json({
                ok: false,
                error: 'Order already approved'
            });
        }

        if (orderData.status !== 'DIPESAN') {
            return res.status(400).json({
                ok: false,
                error: 'Can only approve orders with status DIPESAN'
            });
        }

        // Approve order - now it will appear in courier dashboard
        const { error: updateError } = await db
            .from('orders')
            .update({ admin_approved: true })
            .eq('id', orderId);

        if (updateError) throw updateError;

        // Create notification
        const { error: notifError } = await db
            .from('notifications')
            .insert({
                order_id: orderId,
                user_id: orderData.user_id,
                type: 'order_approved',
                payload_json: {
                    isi_pesan: `Order #${orderId} telah disetujui dan akan segera dijemput oleh kurir`
                },
                channel: 'EMAIL'
            });

        if (notifError) throw notifError;

        res.json({
            ok: true,
            message: 'Order approved successfully. Courier can now pick it up.'
        });

    } catch (error) {
        console.error('Approve order error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to approve order'
        });
    }
};

exports.confirmDelivery = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                ok: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const orderId = req.params.id;
        const { notes } = req.body;

        // Get current order
        const { data: orderData, error: orderError } = await db
            .from('orders')
            .select('id, status, pickup_method, user_id, price_total')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            return res.status(404).json({
                ok: false,
                error: 'Order not found'
            });
        }

        // Only confirm delivery for orders that are being washed
        if (orderData.status !== 'DICUCI') {
            return res.status(400).json({
                ok: false,
                error: 'Can only confirm delivery for orders with status DICUCI'
            });
        }

        // Update status to MENUNGGU_KONFIRMASI_DELIVERY (user harus pilih ambil sendiri atau dianter)
        const { error: updateError } = await db
            .from('orders')
            .update({
                status: 'MENUNGGU_KONFIRMASI_DELIVERY',
                delivery_required: null // Reset, user akan pilih
            })
            .eq('id', orderId);

        if (updateError) throw updateError;

        // Create notification untuk user
        const { error: notifError } = await db
            .from('notifications')
            .insert({
                order_id: orderId,
                user_id: orderData.user_id,
                type: 'delivery_confirmation_required',
                payload_json: {
                    isi_pesan: `Order #${orderId} selesai dicuci. Silakan pilih metode pengambilan: ambil sendiri atau dianter.`
                },
                channel: 'EMAIL'
            });

        if (notifError) throw notifError;

        // Send email notification
        try {
            // Get order notification email (custom or registered)
            const { data: orderDataForEmail, error: orderErr } = await db
                .from('orders')
                .select('notification_email, user_id')
                .eq('id', orderId)
                .single();

            if (orderErr) throw orderErr;

            const { data: userData, error: userErr } = await db
                .from('users')
                .select('name, email')
                .eq('id', orderDataForEmail.user_id)
                .single();

            if (!userErr && userData) {
                const transporter = createTransporter();

                // Use notification_email if available, otherwise use registered email
                const emailToSend = orderDataForEmail.notification_email || userData.email;

                await transporter.sendMail({
                    from: process.env.SMTP_FROM,
                    to: emailToSend,
                    subject: `Order Ready - Order #${orderId}`,
                    html: `
            <h2>Order Status Update</h2>
            <p>Hello ${userData.name},</p>
            <p>Your order #${orderId} has been processed and is ready!</p>
            <p>Please choose your delivery method:</p>
            <ul>
              <li><strong>Pick Up Yourself:</strong> Free - Come to our location</li>
              <li><strong>Delivery Service:</strong> Additional fee required - We will deliver to your address</li>
            </ul>
            <p>Please visit your order history to make your selection.</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            <p>Thank you for using our laundry service!</p>
          `
                });
            }
        } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
        }

        res.json({
            ok: true,
            message: 'Delivery confirmation triggered. User will be notified to choose delivery method.',
            data: {
                status: 'MENUNGGU_KONFIRMASI_DELIVERY'
            }
        });

    } catch (error) {
        console.error('Confirm delivery error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to confirm delivery'
        });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                ok: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const orderId = req.params.id;
        const { status, notes, estimated_arrival } = req.body;

        // Get current order
        const { data: orderData, error: orderError } = await db
            .from('orders')
            .select('id, status, user_id, pickup_method, admin_approved, delivery_required')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            return res.status(404).json({
                ok: false,
                error: 'Order not found'
            });
        }

        // Validate status transition
        const validTransitions = {
            'DIPESAN': ['PESANAN_DIJEMPUT', 'DICUCI'],
            'PESANAN_DIJEMPUT': ['DIAMBIL'],
            'DIAMBIL': ['DICUCI'],
            'DICUCI': [], // Use confirm-delivery endpoint instead
            'MENUNGGU_KONFIRMASI_DELIVERY': [], // User harus pilih delivery method
            'MENUNGGU_PEMBAYARAN_DELIVERY': ['DIKIRIM'],
            'MENUNGGU_AMBIL_SENDIRI': ['SELESAI'],
            'DIKIRIM': ['SELESAI'],
            'SELESAI': []
        };

        // Additional validation for PICKUP vs SELF
        if (status === 'PESANAN_DIJEMPUT' && orderData.pickup_method !== 'PICKUP') {
            return res.status(400).json({
                ok: false,
                error: 'PESANAN_DIJEMPUT hanya untuk order dengan pickup_method PICKUP'
            });
        }

        if (status === 'DIAMBIL' && orderData.pickup_method !== 'PICKUP') {
            return res.status(400).json({
                ok: false,
                error: 'DIAMBIL hanya untuk order dengan pickup_method PICKUP'
            });
        }

        if (status === 'PESANAN_DIJEMPUT' && !orderData.admin_approved) {
            return res.status(400).json({
                ok: false,
                error: 'Order harus di-approve terlebih dahulu sebelum dijemput'
            });
        }

        if (!validTransitions[orderData.status].includes(status)) {
            return res.status(400).json({
                ok: false,
                error: `Cannot transition from ${orderData.status} to ${status}`
            });
        }

        const updateData = { status };
        if (estimated_arrival && status === 'PESANAN_DIJEMPUT') {
            updateData.estimated_arrival = estimated_arrival;
        }

        const { error: updateError } = await db
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (updateError) throw updateError;

        // Create notification
        const { error: notifError } = await db
            .from('notifications')
            .insert({
                order_id: orderId,
                user_id: orderData.user_id,
                type: 'status_update',
                payload_json: { status, notes, isi_pesan: `Status order berubah menjadi ${status}` },
                channel: 'EMAIL'
            });

        if (notifError) throw notifError;

        // Send email notification
        try {
            const { data: orderDataForEmail, error: orderErr } = await db
                .from('orders')
                .select('notification_email, user_id')
                .eq('id', orderId)
                .single();

            if (orderErr) throw orderErr;

            const { data: userData, error: userErr } = await db
                .from('users')
                .select('name, email')
                .eq('id', orderDataForEmail.user_id)
                .single();

            if (!userErr && userData) {
                const transporter = createTransporter();

                const emailToSend = orderDataForEmail.notification_email || userData.email;

                const statusMessages = {
                    'PESANAN_DIJEMPUT': estimated_arrival
                        ? `Pesanan sedang dijemput. Perkiraan sampai: ${new Date(estimated_arrival).toLocaleString('id-ID')}`
                        : 'Pesanan sedang dijemput.',
                    'DIAMBIL': 'Pesanan Anda telah diambil dan sedang dibawa ke lokasi.',
                    'DICUCI': 'Pesanan sedang dicuci dan diproses.',
                    'MENUNGGU_AMBIL_SENDIRI': 'Pesanan siap diambil di lokasi. Silakan datang untuk mengambil pesanan Anda.',
                    'DIKIRIM': 'Pesanan sedang dikirim ke alamat Anda.',
                    'SELESAI': 'Pesanan telah selesai. Terima kasih!'
                };

                await transporter.sendMail({
                    from: process.env.SMTP_FROM,
                    to: emailToSend,
                    subject: `Order Status Update - Order #${orderId}`,
                    html: `
            <h2>Order Status Update</h2>
            <p>Hello ${userData.name},</p>
            <p>Your order #${orderId} status has been updated to: <strong>${status}</strong></p>
            <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            <p>Thank you for using our laundry service!</p>
          `
                });
            }
        } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
        }

        // Emit socket event
        if (global.io) {
            global.io.to(`order:${orderId}`).emit('order.status.updated', {
                orderId,
                status,
                notes,
                timestamp: new Date()
            });
        }

        res.json({
            ok: true,
            message: 'Order status updated successfully'
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to update order status'
        });
    }
};

exports.getServices = async (req, res) => {
    try {
        const { data: services, error } = await db
            .from('services')
            .select('id, name, base_price, unit, description, created_at')
            .order('name');

        if (error) throw error;

        res.json({
            ok: true,
            data: { services: services || [] }
        });
    } catch (error) {
        console.error('Get admin services error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch services'
        });
    }
};

exports.createService = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                ok: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { name, base_price, unit, description } = req.body;

        const { data: newService, error } = await db
            .from('services')
            .insert({
                name,
                base_price: parseFloat(base_price),
                unit,
                description: description || null
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            ok: true,
            data: {
                service: newService
            }
        });

    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to create service'
        });
    }
};

exports.updateService = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                ok: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const serviceId = req.params.id;
        const { name, base_price, unit, description } = req.body;

        const { data: updatedService, error } = await db
            .from('services')
            .update({
                name,
                base_price: parseFloat(base_price),
                unit,
                description: description || null
            })
            .eq('id', serviceId)
            .select()
            .single();

        if (error || !updatedService) {
            return res.status(404).json({
                ok: false,
                error: 'Service not found'
            });
        }

        res.json({
            ok: true,
            message: 'Service updated successfully'
        });

    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to update service'
        });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const serviceId = req.params.id;

        // Check if service is used in any orders
        const { count, error: countError } = await db
            .from('order_items')
            .select('*', { count: 'exact', head: true })
            .eq('service_id', serviceId);

        if (countError) throw countError;

        if (count > 0) {
            return res.status(400).json({
                ok: false,
                error: 'Cannot delete service that is used in orders'
            });
        }

        const { error: deleteError } = await db
            .from('services')
            .delete()
            .eq('id', serviceId);

        if (deleteError) {
            return res.status(404).json({
                ok: false,
                error: 'Service not found'
            });
        }

        res.json({
            ok: true,
            message: 'Service deleted successfully'
        });

    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to delete service'
        });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        // Get total orders in last 30 days
        const { count: totalOrders30d, error: orders30dError } = await db
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', thirtyDaysAgoISO);

        if (orders30dError) throw orders30dError;

        // Get completed orders and revenue in last 30 days
        const { data: completedOrders, error: completedError } = await db
            .from('orders')
            .select('price_total')
            .eq('status', 'SELESAI')
            .gte('created_at', thirtyDaysAgoISO);

        if (completedError) throw completedError;

        const totalRevenue30d = (completedOrders || []).reduce((sum, order) =>
            sum + parseFloat(order.price_total || 0), 0);

        // Get recent orders (last 5)
        const { data: recentOrdersData, error: recentError } = await db
            .from('orders')
            .select('id, status, price_total, created_at, updated_at, user_id')
            .order('created_at', { ascending: false })
            .limit(5);

        if (recentError) throw recentError;

        // Get user details and item counts for recent orders
        const recentOrders = await Promise.all(
            (recentOrdersData || []).map(async (order) => {
                const { data: userData, error: userErr } = await db
                    .from('users')
                    .select('name, phone')
                    .eq('id', order.user_id)
                    .single();

                if (userErr) throw userErr;

                const { count, error: countErr } = await db
                    .from('order_items')
                    .select('*', { count: 'exact', head: true })
                    .eq('order_id', order.id);

                if (countErr) throw countErr;

                return {
                    id: order.id,
                    status: order.status,
                    price_total: order.price_total,
                    created_at: order.created_at,
                    updated_at: order.updated_at,
                    customer_name: userData.name,
                    phone: userData.phone,
                    items_count: count || 0
                };
            })
        );

        // Get order counts by status (for detailed breakdown)
        const { data: allOrders30d, error: allOrdersError } = await db
            .from('orders')
            .select('status')
            .gte('created_at', thirtyDaysAgoISO);

        if (allOrdersError) throw allOrdersError;

        const orderStatsMap = {};
        (allOrders30d || []).forEach(order => {
            orderStatsMap[order.status] = (orderStatsMap[order.status] || 0) + 1;
        });

        const orderStats = Object.entries(orderStatsMap).map(([status, count]) => ({
            status,
            count
        }));

        res.json({
            ok: true,
            data: {
                orderStats,
                revenue: {
                    total_revenue: totalRevenue30d,
                    total_orders: totalOrders30d || 0
                },
                recentOrders
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch dashboard stats'
        });
    }
};

exports.getSalesReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let startDate, endDate;
        if (start_date && end_date) {
            startDate = new Date(start_date);
            endDate = new Date(end_date);
        } else {
            // Default to last 30 days
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
        }

        // Get all orders in date range
        let ordersQuery = db
            .from('orders')
            .select('id, price_total, status, created_at, user_id')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString());

        const { data: orders, error: ordersError } = await ordersQuery;
        if (ordersError) throw ordersError;

        // Process sales by date
        const salesByDateMap = {};
        (orders || []).forEach(order => {
            const date = new Date(order.created_at).toISOString().split('T')[0];
            if (!salesByDateMap[date]) {
                salesByDateMap[date] = {
                    date,
                    order_count: 0,
                    total_revenue: 0,
                    unique_customers: new Set()
                };
            }
            salesByDateMap[date].order_count++;
            salesByDateMap[date].total_revenue += parseFloat(order.price_total || 0);
            salesByDateMap[date].unique_customers.add(order.user_id);
        });

        const salesByDate = Object.values(salesByDateMap).map(item => ({
            date: item.date,
            order_count: item.order_count,
            total_revenue: item.total_revenue,
            unique_customers: item.unique_customers.size
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Get order items for sales by service
        const orderIds = (orders || []).map(o => o.id);
        let orderItems = [];
        if (orderIds.length > 0) {
            const { data: items, error: itemsError } = await db
                .from('order_items')
                .select('service_id, qty, subtotal, order_id')
                .in('order_id', orderIds);

            if (itemsError) throw itemsError;
            orderItems = items || [];
        }

        // Process sales by service
        const salesByServiceMap = {};
        orderItems.forEach(item => {
            if (!salesByServiceMap[item.service_id]) {
                salesByServiceMap[item.service_id] = {
                    service_id: item.service_id,
                    total_quantity: 0,
                    total_revenue: 0,
                    order_count: new Set()
                };
            }
            salesByServiceMap[item.service_id].total_quantity += item.qty;
            salesByServiceMap[item.service_id].total_revenue += parseFloat(item.subtotal || 0);
            salesByServiceMap[item.service_id].order_count.add(item.order_id);
        });

        // Get service names
        const serviceIds = Object.keys(salesByServiceMap);
        let services = [];
        if (serviceIds.length > 0) {
            const { data: servicesData, error: servicesError } = await db
                .from('services')
                .select('id, name')
                .in('id', serviceIds);

            if (servicesError) throw servicesError;
            services = servicesData || [];
        }

        const salesByService = Object.values(salesByServiceMap)
            .map(item => {
                const service = services.find(s => s.id === item.service_id);
                return {
                    id: item.service_id,
                    name: service?.name || 'Unknown',
                    total_quantity: item.total_quantity,
                    total_revenue: item.total_revenue,
                    order_count: item.order_count.size
                };
            })
            .sort((a, b) => b.total_revenue - a.total_revenue);

        // Process sales by status
        const salesByStatusMap = {};
        (orders || []).forEach(order => {
            if (!salesByStatusMap[order.status]) {
                salesByStatusMap[order.status] = {
                    status: order.status,
                    count: 0,
                    total_revenue: 0
                };
            }
            salesByStatusMap[order.status].count++;
            salesByStatusMap[order.status].total_revenue += parseFloat(order.price_total || 0);
        });

        const salesByStatus = Object.values(salesByStatusMap)
            .sort((a, b) => b.count - a.count);

        res.json({
            ok: true,
            data: {
                sales_by_date: salesByDate,
                sales_by_service: salesByService,
                sales_by_status: salesByStatus,
                period: {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0]
                }
            }
        });

    } catch (error) {
        console.error('Get sales report error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch sales report'
        });
    }
};

exports.getCustomersReport = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Get all customers
        const { data: customers, error: customersError } = await db
            .from('users')
            .select('id, name, email, phone')
            .eq('role', 'CUSTOMER');

        if (customersError) throw customersError;

        // Get all orders
        const { data: allOrders, error: ordersError } = await db
            .from('orders')
            .select('id, price_total, created_at, user_id');

        if (ordersError) throw ordersError;

        // Process top customers
        const customerStatsMap = {};
        (customers || []).forEach(customer => {
            customerStatsMap[customer.id] = {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                order_count: 0,
                total_spent: 0,
                last_order_date: null
            };
        });

        (allOrders || []).forEach(order => {
            if (customerStatsMap[order.user_id]) {
                customerStatsMap[order.user_id].order_count++;
                customerStatsMap[order.user_id].total_spent += parseFloat(order.price_total || 0);
                const orderDate = new Date(order.created_at);
                if (!customerStatsMap[order.user_id].last_order_date ||
                    orderDate > new Date(customerStatsMap[order.user_id].last_order_date)) {
                    customerStatsMap[order.user_id].last_order_date = order.created_at;
                }
            }
        });

        const topCustomers = Object.values(customerStatsMap)
            .filter(c => c.order_count > 0)
            .sort((a, b) => b.total_spent - a.total_spent)
            .slice(0, parseInt(limit));

        // Customer growth (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: newCustomers, error: newCustomersError } = await db
            .from('users')
            .select('created_at')
            .eq('role', 'CUSTOMER')
            .gte('created_at', thirtyDaysAgo.toISOString());

        if (newCustomersError) throw newCustomersError;

        const customerGrowthMap = {};
        (newCustomers || []).forEach(customer => {
            const date = new Date(customer.created_at).toISOString().split('T')[0];
            customerGrowthMap[date] = (customerGrowthMap[date] || 0) + 1;
        });

        const customerGrowth = Object.entries(customerGrowthMap)
            .map(([date, new_customers]) => ({ date, new_customers }))
            .sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            ok: true,
            data: {
                top_customers: topCustomers,
                customer_growth: customerGrowth
            }
        });

    } catch (error) {
        console.error('Get customers report error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch customers report'
        });
    }
};

exports.getRevenueReport = async (req, res) => {
    try {
        const { period = 'month' } = req.query;

        let startDate = new Date();
        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 12 * 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 12);
        } else {
            startDate.setDate(startDate.getDate() - 30);
        }

        // Get completed orders
        const { data: orders, error: ordersError } = await db
            .from('orders')
            .select('id, price_total, created_at, user_id')
            .eq('status', 'SELESAI')
            .gte('created_at', startDate.toISOString());

        if (ordersError) throw ordersError;

        // Process revenue by period
        const revenueMap = {};
        const uniqueCustomers = new Set();
        let totalRevenue = 0;
        let totalOrders = 0;

        (orders || []).forEach(order => {
            let periodKey;
            const orderDate = new Date(order.created_at);

            if (period === 'week') {
                const year = orderDate.getFullYear();
                const week = getWeekNumber(orderDate);
                periodKey = `${year}-W${week.toString().padStart(2, '0')}`;
            } else if (period === 'month') {
                periodKey = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1).toString().padStart(2, '0')}`;
            } else {
                periodKey = orderDate.toISOString().split('T')[0];
            }

            if (!revenueMap[periodKey]) {
                revenueMap[periodKey] = {
                    period: periodKey,
                    order_count: 0,
                    total_revenue: 0,
                    order_values: []
                };
            }

            revenueMap[periodKey].order_count++;
            const orderValue = parseFloat(order.price_total || 0);
            revenueMap[periodKey].total_revenue += orderValue;
            revenueMap[periodKey].order_values.push(orderValue);
            uniqueCustomers.add(order.user_id);
            totalRevenue += orderValue;
            totalOrders++;
        });

        const revenue = Object.values(revenueMap).map(item => ({
            period: item.period,
            order_count: item.order_count,
            total_revenue: item.total_revenue,
            avg_order_value: item.total_revenue / item.order_count
        })).sort((a, b) => a.period.localeCompare(b.period));

        const summary = {
            total_orders: totalOrders,
            total_revenue: totalRevenue,
            avg_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            total_customers: uniqueCustomers.size
        };

        res.json({
            ok: true,
            data: {
                revenue_trend: revenue,
                summary
            }
        });

    } catch (error) {
        console.error('Get revenue report error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch revenue report'
        });
    }
};

exports.getOrderMessages = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Verify order exists (admin can access any order)
        const { data: orderData, error: orderError } = await db
            .from('orders')
            .select('id')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            return res.status(404).json({
                ok: false,
                error: 'Order not found'
            });
        }

        // Get messages
        const { data: messagesData, error: messagesError } = await db
            .from('messages')
            .select('id, body, created_at, sender_id')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Get sender details for each message
        const messages = await Promise.all(
            (messagesData || []).map(async (msg) => {
                const { data: senderData, error: senderErr } = await db
                    .from('users')
                    .select('name, role')
                    .eq('id', msg.sender_id)
                    .single();

                if (senderErr) throw senderErr;

                return {
                    id: msg.id,
                    body: msg.body,
                    created_at: msg.created_at,
                    sender_id: msg.sender_id,
                    sender_name: senderData.name,
                    sender_role: senderData.role
                };
            })
        );

        res.json({
            ok: true,
            data: { messages }
        });

    } catch (error) {
        console.error('Get chat messages error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch messages'
        });
    }
};

exports.sendOrderMessage = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                ok: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const orderId = req.params.orderId;
        const adminId = req.user.id;
        const { message } = req.body;

        // Verify order exists
        const { data: orderData, error: orderError } = await db
            .from('orders')
            .select('id')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            return res.status(404).json({
                ok: false,
                error: 'Order not found'
            });
        }

        // Save message
        const { data: newMessage, error: insertError } = await db
            .from('messages')
            .insert({
                order_id: orderId,
                sender_id: adminId,
                body: message
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // Get sender info
        const { data: userData, error: userError } = await db
            .from('users')
            .select('name, role')
            .eq('id', adminId)
            .single();

        if (userError) throw userError;

        const messageData = {
            id: newMessage.id,
            orderId,
            senderId: adminId,
            senderName: userData.name,
            senderRole: userData.role,
            message,
            timestamp: new Date(newMessage.created_at)
        };

        // Emit to all users in the order room
        if (global.io) {
            global.io.to(`order:${orderId}`).emit('message:new', messageData);
        }

        res.status(201).json({
            ok: true,
            data: { message: messageData }
        });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to send message'
        });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Get notifications for admin (all notifications)
        const { data: notifications, error: notifError } = await db
            .from('notifications')
            .select('id, type, payload_json, sent_at, channel, created_at, order_id, user_id')
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (notifError) throw notifError;

        // Get total count
        const { count, error: countError } = await db
            .from('notifications')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        res.json({
            ok: true,
            data: {
                notifications: notifications || [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get admin notifications error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch notifications'
        });
    }
};

exports.getUnreadNotificationsCount = async (req, res) => {
    try {
        const { count, error: countError } = await db
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .is('sent_at', null);

        if (countError) throw countError;

        res.json({
            ok: true,
            data: {
                unread_count: count || 0
            }
        });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch unread count'
        });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const notificationId = req.params.id;

        const { error: updateError } = await db
            .from('notifications')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', notificationId);

        if (updateError) throw updateError;

        res.json({
            ok: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to mark notification as read'
        });
    }
};
