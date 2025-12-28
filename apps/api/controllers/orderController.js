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

exports.getServices = async (req, res) => {
    try {
        console.log('GET /api/orders/services - Request received');

        // Check if database is connected
        if (!db) {
            console.error('Database connection not available');
            return res.status(500).json({
                ok: false,
                error: 'Database connection not available'
            });
        }

        const { data: services, error } = await db
            .from('services')
            .select('id, name, base_price, unit, description')
            .order('name');

        if (error) {
            console.error('Database error:', error);
            throw error;
        }

        console.log('Services fetched successfully:', services?.length || 0);

        res.json({
            ok: true,
            data: { services: services || [] }
        });
    } catch (error) {
        console.error('Get services error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch services',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('Order validation errors:', errors.array());
            console.error('Request body:', JSON.stringify(req.body, null, 2));
            return res.status(400).json({
                ok: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { pickup_method, items, notes, notification_email } = req.body;
        const userId = req.user.id;

        // Get user data (email, name, phone, address) for notification and order details
        const { data: userData, error: userError } = await db
            .from('users')
            .select('email, name, phone, address')
            .eq('id', userId)
            .single();

        if (userError) throw userError;

        // Determine notification email: use custom if provided and not empty, otherwise use registered email
        const emailForNotification = (notification_email && notification_email.trim()) ? notification_email.trim() : userData.email;

        // Calculate total price
        let servicesTotal = 0;
        const orderItems = [];

        for (const item of items) {
            // Get service details
            const { data: services, error: serviceError } = await db
                .from('services')
                .select('id, name, base_price')
                .eq('id', item.service_id)
                .single();

            if (serviceError || !services) {
                throw new Error(`Service with ID ${item.service_id} not found`);
            }

            const service = services;
            const subtotal = parseFloat(service.base_price) * item.qty;
            servicesTotal += subtotal;

            orderItems.push({
                service_id: item.service_id,
                qty: item.qty,
                unit_price: service.base_price,
                subtotal
            });
        }

        // Calculate pickup fee (PICKUP = +Rp 5,000, SELF = free)
        const pickupFee = pickup_method === 'PICKUP' ? 5000 : 0;
        const totalPrice = servicesTotal + pickupFee;

        // Create order
        const { data: newOrder, error: orderError } = await db
            .from('orders')
            .insert({
                user_id: userId,
                pickup_method,
                status: 'DIPESAN',
                price_total: totalPrice,
                pickup_fee: pickupFee,
                admin_approved: pickup_method === 'SELF' ? true : false, // SELF langsung approved, PICKUP perlu approval
                notes: notes || null,
                notification_email: emailForNotification || null
            })
            .select()
            .single();

        if (orderError) throw orderError;

        const orderId = newOrder.id;

        // Create order items
        const orderItemsToInsert = orderItems.map(item => ({
            order_id: orderId,
            service_id: item.service_id,
            qty: item.qty,
            unit_price: item.unit_price,
            subtotal: item.subtotal
        }));

        const { error: itemsError } = await db
            .from('order_items')
            .insert(orderItemsToInsert);

        if (itemsError) throw itemsError;

        // Query #8 DPPL: Insert Pembayaran
        const { error: paymentError } = await db
            .from('payments')
            .insert({
                order_id: orderId,
                method: 'QRIS',
                amount: totalPrice,
                status: 'PENDING' // Status PENDING setara dengan 'Menunggu Verifikasi'
            });

        if (paymentError) throw paymentError;

        // Get complete order details
        const { data: orderData, error: orderDetailError } = await db
            .from('orders')
            .select('id, pickup_method, status, price_total, notes, created_at, user_id, pickup_fee, admin_approved, delivery_required')
            .eq('id', orderId)
            .single();

        if (orderDetailError) throw orderDetailError;

        // Get order items with service details
        const { data: orderItemsData, error: itemsDataError } = await db
            .from('order_items')
            .select('id, qty, unit_price, subtotal, service_id')
            .eq('order_id', orderId);

        if (itemsDataError) throw itemsDataError;

        // Get service details for each item
        const itemsWithServices = await Promise.all(
            orderItemsData.map(async (item) => {
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

        // Format response
        const orderResponse = {
            ...orderData,
            customer_name: userData.name,
            phone: userData.phone,
            address: userData.address,
            items: itemsWithServices
        };

        // Send email notification for new order
        try {
            const transporter = createTransporter();
            const itemsList = itemsWithServices.map(item =>
                `- ${item.service_name} (${item.qty} ${item.unit}): Rp ${parseFloat(item.subtotal).toLocaleString('id-ID')}`
            ).join('<br>');

            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: emailForNotification,
                subject: `Order Confirmation - Order #${orderId}`,
                html: `
            <h2>Order Confirmation</h2>
            <p>Hello ${userData.name},</p>
            <p>Thank you for your order! Your order has been received and is being processed.</p>
            <h3>Order Details:</h3>
            <p><strong>Order ID:</strong> #${orderId}</p>
            <p><strong>Pickup Method:</strong> ${pickup_method === 'PICKUP' ? 'Pickup Service (+Rp 5,000)' : 'Self Service (Free)'}</p>
            <p><strong>Items:</strong></p>
            <ul>
              ${itemsList}
            </ul>
            <p><strong>Services Total:</strong> Rp ${servicesTotal.toLocaleString('id-ID')}</p>
            ${pickupFee > 0 ? `<p><strong>Pickup Fee:</strong> Rp ${pickupFee.toLocaleString('id-ID')}</p>` : ''}
            <p><strong>Total:</strong> Rp ${totalPrice.toLocaleString('id-ID')}</p>
            <p><strong>Status:</strong> ${orderData.status}</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            <p>We will notify you when your order status is updated.</p>
            <p>Thank you for using our laundry service!</p>
          `
            });
        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            // Don't fail the order creation if email fails
        }

        res.status(201).json({
            ok: true,
            data: {
                order: orderResponse
            }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            ok: false,
            error: error.message || 'Failed to create order'
        });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        // Build query
        let query = db
            .from('orders')
            .select('id, pickup_method, status, price_total, created_at')
            .eq('user_id', userId);

        if (status) {
            query = query.eq('status', status);
        }

        // Get orders with pagination
        const { data: orders, error: ordersError } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (ordersError) throw ordersError;

        // Get item count for each order
        const ordersWithItemCount = await Promise.all(
            (orders || []).map(async (order) => {
                const { count, error: countError } = await db
                    .from('order_items')
                    .select('*', { count: 'exact', head: true })
                    .eq('order_id', order.id);

                if (countError) throw countError;

                return {
                    ...order,
                    item_count: count || 0
                };
            })
        );

        // Get total count
        let countQuery = db
            .from('orders')
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
                orders: ordersWithItemCount,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total || 0,
                    pages: Math.ceil((total || 0) / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch orders'
        });
    }
};

exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user's completed orders
        const { data: userOrdersData, error: userOrdersError } = await db
            .from('orders')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'SELESAI');

        if (userOrdersError) throw userOrdersError;

        const userOrderIds = (userOrdersData || []).map(o => o.id);

        // Get user's order items
        let userOrderItems = [];
        if (userOrderIds.length > 0) {
            const { data: items, error: itemsError } = await db
                .from('order_items')
                .select('service_id, qty, order_id')
                .in('order_id', userOrderIds);

            if (itemsError) throw itemsError;
            userOrderItems = items || [];
        }

        // Process user orders to get top services
        const userServiceMap = {};
        userOrderItems.forEach(item => {
            if (!userServiceMap[item.service_id]) {
                userServiceMap[item.service_id] = { total_qty: 0, order_count: new Set() };
            }
            userServiceMap[item.service_id].total_qty += item.qty;
            userServiceMap[item.service_id].order_count.add(item.order_id);
        });

        const userOrders = Object.entries(userServiceMap)
            .map(([service_id, data]) => ({
                service_id: parseInt(service_id),
                total_qty: data.total_qty,
                order_count: data.order_count.size
            }))
            .sort((a, b) => b.total_qty - a.total_qty || b.order_count - a.order_count)
            .slice(0, 3);

        // Get all completed orders
        const { data: allCompletedOrders, error: allCompletedError } = await db
            .from('orders')
            .select('id')
            .eq('status', 'SELESAI');

        if (allCompletedError) throw allCompletedError;

        const allCompletedOrderIds = (allCompletedOrders || []).map(o => o.id);

        // Get all order items from completed orders
        let allOrderItems = [];
        if (allCompletedOrderIds.length > 0) {
            const { data: allItems, error: allItemsError } = await db
                .from('order_items')
                .select('service_id, qty, order_id')
                .in('order_id', allCompletedOrderIds);

            if (allItemsError) throw allItemsError;
            allOrderItems = allItems || [];
        }

        // Process all orders to get popular services
        const popularServiceMap = {};
        allOrderItems.forEach(item => {
            if (!popularServiceMap[item.service_id]) {
                popularServiceMap[item.service_id] = { total_qty: 0, order_count: new Set() };
            }
            popularServiceMap[item.service_id].total_qty += item.qty;
            popularServiceMap[item.service_id].order_count.add(item.order_id);
        });

        const popularServices = Object.entries(popularServiceMap)
            .map(([service_id, data]) => ({
                service_id: parseInt(service_id),
                total_qty: data.total_qty,
                order_count: data.order_count.size
            }))
            .sort((a, b) => b.total_qty - a.total_qty || b.order_count - a.order_count)
            .slice(0, 5);

        // Get all services with their details
        const { data: allServices, error: servicesError } = await db
            .from('services')
            .select('id, name, base_price, unit, description')
            .order('name');

        if (servicesError) throw servicesError;

        // Create recommended packages
        const recommendedPackages = [];

        // Package 1: Based on user history
        if (userOrders.length > 0) {
            const userServiceIds = userOrders.map(o => o.service_id);
            const userServices = allServices.filter(s => userServiceIds.includes(s.id));
            if (userServices.length > 0) {
                const totalPrice = userServices.reduce((sum, s) => sum + parseFloat(s.base_price), 0);
                recommendedPackages.push({
                    id: 'user_history',
                    name: 'Your Favorites',
                    description: 'Based on your previous orders',
                    services: userServices.slice(0, 3),
                    original_price: totalPrice,
                    discount: 0,
                    final_price: totalPrice,
                    badge: 'Personalized'
                });
            }
        }

        // Package 2: Most Popular
        if (popularServices.length > 0) {
            const popularServiceIds = popularServices.map(s => s.service_id);
            const popularServicesList = allServices.filter(s => popularServiceIds.includes(s.id));
            if (popularServicesList.length > 0) {
                const totalPrice = popularServicesList.slice(0, 3).reduce((sum, s) => sum + parseFloat(s.base_price), 0);
                const discount = totalPrice * 0.05;
                recommendedPackages.push({
                    id: 'popular',
                    name: 'Most Popular',
                    description: 'Most ordered by customers',
                    services: popularServicesList.slice(0, 3),
                    original_price: totalPrice,
                    discount: 5,
                    final_price: totalPrice - discount,
                    badge: 'Popular'
                });
            }
        }

        // Package 3: Best Value (services with good price/quality ratio)
        const bestValueServices = allServices
            .filter(s => parseFloat(s.base_price) <= 10000) // Affordable services
            .slice(0, 3);
        if (bestValueServices.length > 0) {
            const totalPrice = bestValueServices.reduce((sum, s) => sum + parseFloat(s.base_price), 0);
            recommendedPackages.push({
                id: 'best_value',
                name: 'Best Value',
                description: 'Great quality at affordable prices',
                services: bestValueServices,
                original_price: totalPrice,
                discount: 0,
                final_price: totalPrice,
                badge: 'Best Value'
            });
        }

        // Package 4: Complete Care (all-in-one package)
        if (allServices.length >= 3) {
            const completeServices = allServices.slice(0, 4);
            const totalPrice = completeServices.reduce((sum, s) => sum + parseFloat(s.base_price), 0);
            const discount = totalPrice * 0.10;
            recommendedPackages.push({
                id: 'complete_care',
                name: 'Complete Care Package',
                description: 'Full service package for comprehensive care',
                services: completeServices,
                original_price: totalPrice,
                discount: 10,
                final_price: totalPrice - discount,
                badge: 'Bundle'
            });
        }

        res.json({
            ok: true,
            data: {
                packages: recommendedPackages
            }
        });

    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch recommendations'
        });
    }
};

exports.getOrderDetail = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;

        // Get order details
        const { data: orderData, error: orderError } = await db
            .from('orders')
            .select('id, pickup_method, status, price_total, notes, created_at, updated_at, user_id, pickup_fee, admin_approved, delivery_required')
            .eq('id', orderId)
            .eq('user_id', userId)
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
            .select('name, phone, address')
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

        res.json({
            ok: true,
            data: {
                order: {
                    ...orderData,
                    customer_name: userData.name,
                    phone: userData.phone,
                    address: userData.address,
                    items: itemsWithServices,
                    payments: payments || []
                }
            }
        });

    } catch (error) {
        console.error('Get order detail error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to fetch order details'
        });
    }
};

exports.confirmPayment = async (req, res) => {
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
        const { method, amount } = req.body;
        const userId = req.user.id;

        // Verify order belongs to user
        const { data: orderData, error: orderError } = await db
            .from('orders')
            .select('id, price_total')
            .eq('id', orderId)
            .eq('user_id', userId)
            .single();

        if (orderError || !orderData) {
            return res.status(404).json({
                ok: false,
                error: 'Order not found'
            });
        }

        // Verify amount matches order total
        if (parseFloat(amount) !== parseFloat(orderData.price_total)) {
            return res.status(400).json({
                ok: false,
                error: 'Payment amount does not match order total'
            });
        }

        // Query #8 DPPL: Update Pembayaran setelah konfirmasi
        // Mengubah status dari 'PENDING' (Menunggu Verifikasi) menjadi 'PAID' (Terbayar)
        const { error: updateError } = await db
            .from('payments')
            .update({
                method,
                amount: parseFloat(amount),
                status: 'PAID',
                paid_at: new Date().toISOString()
            })
            .eq('order_id', orderId);

        if (updateError) throw updateError;

        res.json({
            ok: true,
            message: 'Payment confirmed successfully'
        });

    } catch (error) {
        console.error('Confirm payment error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to confirm payment'
        });
    }
};

exports.chooseDeliveryMethod = async (req, res) => {
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
        const userId = req.user.id;
        const { delivery_method } = req.body;

        // Get current order
        const { data: orderData, error: orderError } = await db
            .from('orders')
            .select('id, status, user_id, price_total')
            .eq('id', orderId)
            .single();

        if (orderError || !orderData) {
            return res.status(404).json({
                ok: false,
                error: 'Order not found'
            });
        }

        // Check ownership
        if (orderData.user_id !== userId) {
            return res.status(403).json({
                ok: false,
                error: 'Unauthorized'
            });
        }

        // Only allow for orders waiting for delivery confirmation
        if (orderData.status !== 'MENUNGGU_KONFIRMASI_DELIVERY') {
            return res.status(400).json({
                ok: false,
                error: 'Order is not waiting for delivery confirmation'
            });
        }

        if (delivery_method === 'SELF_PICKUP') {
            // User pilih ambil sendiri - langsung set status
            const { error: updateError } = await db
                .from('orders')
                .update({
                    status: 'MENUNGGU_AMBIL_SENDIRI',
                    delivery_required: false
                })
                .eq('id', orderId);

            if (updateError) throw updateError;

            // Create notification
            await db
                .from('notifications')
                .insert({
                    order_id: orderId,
                    user_id: userId,
                    type: 'delivery_method_selected',
                    payload_json: {
                        delivery_method: 'SELF_PICKUP',
                        isi_pesan: `Order #${orderId} siap diambil di lokasi kami.`
                    },
                    channel: 'EMAIL'
                });

            res.json({
                ok: true,
                message: 'Delivery method selected. Order ready for pickup.',
                data: {
                    status: 'MENUNGGU_AMBIL_SENDIRI',
                    delivery_method: 'SELF_PICKUP'
                }
            });

        } else if (delivery_method === 'DELIVERY') {
            // User pilih dianter - perlu bayar dulu
            const deliveryFee = 10000; // Delivery fee
            // logic terusannya ada di file original
            const { error: updateError } = await db
                .from('orders')
                .update({
                    status: 'MENUNGGU_PEMBAYARAN_DELIVERY',
                    delivery_required: true,
                    price_total: parseFloat(orderData.price_total) + deliveryFee // Update total price with delivery fee
                })
                .eq('id', orderId);

            if (updateError) throw updateError;

            // Create new payment record for delivery fee
            await db
                .from('payments')
                .insert({
                    order_id: orderId,
                    method: 'QRIS',
                    amount: deliveryFee,
                    status: 'PENDING'
                });

            // Create notification
            await db
                .from('notifications')
                .insert({
                    order_id: orderId,
                    user_id: userId,
                    type: 'delivery_method_selected',
                    payload_json: {
                        delivery_method: 'DELIVERY',
                        isi_pesan: `Silakan lakukan pembayaran ongkos kirim (Rp ${deliveryFee.toLocaleString('id-ID')}) agar pesanan dapat dikirim.`
                    },
                    channel: 'EMAIL'
                });

            res.json({
                ok: true,
                message: 'Delivery method selected. Please pay delivery fee.',
                data: {
                    status: 'MENUNGGU_PEMBAYARAN_DELIVERY',
                    delivery_method: 'DELIVERY',
                    additional_fee: deliveryFee
                }
            });
        }
    } catch (error) {
        console.error('Choose delivery method error:', error);
        res.status(500).json({
            ok: false,
            error: 'Failed to choose delivery method'
        });
    }
};
