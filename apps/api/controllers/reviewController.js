const { validationResult } = require('express-validator');
const db = require('../config/database');

exports.submitReview = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                ok: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { order_id, rating, comment, service_id } = req.body;
        const userId = req.user.id;

        // Verify order belongs to user and is completed
        const { data: orderData, error: orderError } = await db
            .from('orders')
            .select('id, status')
            .eq('id', order_id)
            .eq('user_id', userId)
            .single();

        if (orderError || !orderData) {
            return res.status(404).json({
                ok: false,
                error: 'Order not found or access denied'
            });
        }

        if (orderData.status !== 'SELESAI') {
            return res.status(400).json({
                ok: false,
                error: 'Can only review completed orders'
            });
        }

        // Check if review already exists
        const { data: existing, error: existingError } = await db
            .from('reviews')
            .select('id')
            .eq('order_id', order_id)
            .eq('user_id', userId)
            .single();

        if (existing && !existingError) {
            // Update existing review
            const { data: updatedReview, error: updateError } = await db
                .from('reviews')
                .update({
                    rating,
                    comment: comment || null,
                    service_id: service_id || null
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (updateError) throw updateError;

            res.json({
                ok: true,
                message: 'Review updated successfully',
                data: {
                    review: updatedReview
                }
            });
        } else {
            // Create new review
            const { data: newReview, error: insertError } = await db
                .from('reviews')
                .insert({
                    order_id,
                    user_id: userId,
                    service_id: service_id || null,
                    rating,
                    comment: comment || null
                })
                .select()
                .single();

            if (insertError) throw insertError;

            res.status(201).json({
                ok: true,
                message: 'Review submitted successfully',
                data: {
                    review: newReview
                }
            });
        }

    } catch (error) {
        console.error('Submit review error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to submit review'
        });
    }
};

exports.getOrderReviews = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        const { data: reviews, error: reviewsError } = await db
            .from('reviews')
            .select('id, order_id, rating, comment, created_at, updated_at, user_id, service_id')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;

        // Get user and service details for each review
        const reviewsWithDetails = await Promise.all(
            (reviews || []).map(async (review) => {
                const { data: userData, error: userErr } = await db
                    .from('users')
                    .select('name')
                    .eq('id', review.user_id)
                    .single();

                if (userErr) throw userErr;

                let service_name = null;
                if (review.service_id) {
                    const { data: serviceData, error: serviceErr } = await db
                        .from('services')
                        .select('name')
                        .eq('id', review.service_id)
                        .single();

                    if (!serviceErr && serviceData) {
                        service_name = serviceData.name;
                    }
                }

                return {
                    id: review.id,
                    order_id: review.order_id,
                    rating: review.rating,
                    comment: review.comment,
                    created_at: review.created_at,
                    updated_at: review.updated_at,
                    user_name: userData.name,
                    service_name
                };
            })
        );

        res.json({
            ok: true,
            data: {
                reviews: reviewsWithDetails
            }
        });

    } catch (error) {
        console.error('Get order reviews error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch reviews'
        });
    }
};

exports.getServiceReviews = async (req, res) => {
    try {
        const serviceId = req.params.serviceId;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { data: reviews, error: reviewsError } = await db
            .from('reviews')
            .select('id, order_id, rating, comment, created_at, user_id')
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (reviewsError) throw reviewsError;

        // Get user details for each review
        const reviewsWithUsers = await Promise.all(
            (reviews || []).map(async (review) => {
                const { data: userData, error: userErr } = await db
                    .from('users')
                    .select('name')
                    .eq('id', review.user_id)
                    .single();

                if (userErr) throw userErr;

                return {
                    id: review.id,
                    order_id: review.order_id,
                    rating: review.rating,
                    comment: review.comment,
                    created_at: review.created_at,
                    user_name: userData.name
                };
            })
        );

        // Get all reviews for statistics
        const { data: allReviews, error: allReviewsError } = await db
            .from('reviews')
            .select('rating')
            .eq('service_id', serviceId);

        if (allReviewsError) throw allReviewsError;

        const totalReviews = allReviews?.length || 0;
        const avgRating = totalReviews > 0
            ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
            : '0.0';

        // Get total count
        const { count: total, error: countError } = await db
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('service_id', serviceId);

        if (countError) throw countError;

        res.json({
            ok: true,
            data: {
                reviews: reviewsWithUsers,
                statistics: {
                    average_rating: avgRating,
                    total_reviews: total || 0
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total || 0,
                    total_pages: Math.ceil((total || 0) / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get service reviews error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch reviews'
        });
    }
};

exports.getUserReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { data: reviews, error: reviewsError } = await db
            .from('reviews')
            .select('id, order_id, rating, comment, created_at, updated_at, service_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (reviewsError) throw reviewsError;

        // Get order and service details for each review
        const reviewsWithDetails = await Promise.all(
            (reviews || []).map(async (review) => {
                const { data: orderData, error: orderErr } = await db
                    .from('orders')
                    .select('id, status')
                    .eq('id', review.order_id)
                    .single();

                if (orderErr) throw orderErr;

                let service_name = null;
                if (review.service_id) {
                    const { data: serviceData, error: serviceErr } = await db
                        .from('services')
                        .select('name')
                        .eq('id', review.service_id)
                        .single();

                    if (!serviceErr && serviceData) {
                        service_name = serviceData.name;
                    }
                }

                return {
                    id: review.id,
                    order_id: review.order_id,
                    rating: review.rating,
                    comment: review.comment,
                    created_at: review.created_at,
                    updated_at: review.updated_at,
                    order_number: orderData.id,
                    order_status: orderData.status,
                    service_name
                };
            })
        );

        // Get total count
        const { count: total, error: countError } = await db
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (countError) throw countError;

        res.json({
            ok: true,
            data: {
                reviews: reviewsWithDetails,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total || 0,
                    total_pages: Math.ceil((total || 0) / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get user reviews error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch reviews'
        });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10, service_id, min_rating } = req.query;
        const offset = (page - 1) * limit;

        let reviewsQuery = db
            .from('reviews')
            .select('id, order_id, rating, comment, created_at, updated_at, user_id, service_id');

        if (service_id) {
            reviewsQuery = reviewsQuery.eq('service_id', service_id);
        }

        if (min_rating) {
            reviewsQuery = reviewsQuery.gte('rating', parseInt(min_rating));
        }

        const { data: reviews, error: reviewsError } = await reviewsQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (reviewsError) throw reviewsError;

        // Get user, order, and service details for each review
        const reviewsWithDetails = await Promise.all(
            (reviews || []).map(async (review) => {
                const { data: userData, error: userErr } = await db
                    .from('users')
                    .select('name, email')
                    .eq('id', review.user_id)
                    .single();

                if (userErr) throw userErr;

                const { data: orderData, error: orderErr } = await db
                    .from('orders')
                    .select('id')
                    .eq('id', review.order_id)
                    .single();

                if (orderErr) throw orderErr;

                let service_name = null;
                if (review.service_id) {
                    const { data: serviceData, error: serviceErr } = await db
                        .from('services')
                        .select('name')
                        .eq('id', review.service_id)
                        .single();

                    if (!serviceErr && serviceData) {
                        service_name = serviceData.name;
                    }
                }

                return {
                    id: review.id,
                    order_id: review.order_id,
                    rating: review.rating,
                    comment: review.comment,
                    created_at: review.created_at,
                    updated_at: review.updated_at,
                    user_name: userData.name,
                    user_email: userData.email,
                    order_number: orderData.id,
                    service_name
                };
            })
        );

        // Get total count
        let countQuery = db
            .from('reviews')
            .select('*', { count: 'exact', head: true });

        if (service_id) {
            countQuery = countQuery.eq('service_id', service_id);
        }

        if (min_rating) {
            countQuery = countQuery.gte('rating', parseInt(min_rating));
        }

        const { count: total, error: countError } = await countQuery;
        if (countError) throw countError;

        res.json({
            ok: true,
            data: {
                reviews: reviewsWithDetails,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total || 0,
                    total_pages: Math.ceil((total || 0) / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get admin reviews error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch reviews'
        });
    }
};
