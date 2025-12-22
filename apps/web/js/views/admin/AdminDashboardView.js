// Admin Dashboard View - MVC Pattern
import { UI } from '../../utils/ui.js';

export class AdminDashboardView {
    constructor() {
        this.ui = new UI();
        this.statsGrid = document.getElementById('statsGrid');
        this.recentOrders = document.getElementById('recentOrders');
        this.orderDetailContent = document.getElementById('orderDetailContent');
        this.statusSelect = document.getElementById('newStatus');
    }

    renderStats(data) {
        if (!this.statsGrid) return;

        const orderStats = data.orderStats || [];
        const revenue = data.revenue || { total_revenue: 0, total_orders: 0 };
        
        const statsCards = [
            {
                title: 'Total Orders (30 days)',
                value: orderStats.reduce((sum, stat) => sum + (stat.count || 0), 0),
                icon: 'fas fa-shopping-cart',
                color: '#007bff'
            },
            {
                title: 'Total Revenue (30 days)',
                value: `Rp ${parseFloat(revenue.total_revenue || 0).toLocaleString('id-ID')}`,
                icon: 'fas fa-dollar-sign',
                color: '#28a745'
            },
            {
                title: 'Completed Orders',
                value: orderStats.find(s => s.status === 'SELESAI')?.count || 0,
                icon: 'fas fa-check-circle',
                color: '#28a745'
            },
            {
                title: 'Pending Orders',
                value: orderStats.find(s => s.status === 'DIPESAN')?.count || 0,
                icon: 'fas fa-clock',
                color: '#ffc107'
            }
        ];

        // Clear loading and render stats
        this.statsGrid.innerHTML = statsCards.map(card => `
            <div class="stat-card">
                <div class="stat-icon" style="color: ${card.color}">
                    <i class="${card.icon}"></i>
                </div>
                <div class="stat-content">
                    <h3>${card.value}</h3>
                    <p>${card.title}</p>
                </div>
            </div>
        `).join('');
    }

    showStatsError(message) {
        if (!this.statsGrid) return;
        // Clear loading and show error
        this.statsGrid.innerHTML = `
            <div class="error-message" style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: #dc3545;">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="btn btn-outline btn-sm" onclick="window.adminDashboardController.loadDashboardData()" style="margin-top: 1rem;">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
    }

    renderRecentOrders(orders) {
        if (!this.recentOrders) return;

        // Clear loading state
        if (!orders || orders.length === 0) {
            this.recentOrders.innerHTML = `
                <div class="empty-message" style="padding: 2rem; text-align: center; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No recent orders</p>
                    <small>Orders will appear here when customers create new orders</small>
                </div>
            `;
            return;
        }

        this.recentOrders.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">#${order.id}</div>
                    <div class="order-date">${new Date(order.created_at).toLocaleDateString('id-ID')}</div>
                </div>
                <div class="order-details">
                    <div class="order-detail">
                        <div class="order-detail-label">Customer</div>
                        <div class="order-detail-value">${order.customer_name || 'N/A'}</div>
                    </div>
                    <div class="order-detail">
                        <div class="order-detail-label">Status</div>
                        <div class="order-detail-value">
                            <span class="status-badge status-${(order.status || '').toLowerCase()}">
                                ${this.formatOrderStatus(order.status || 'DIPESAN')}
                            </span>
                        </div>
                    </div>
                    <div class="order-detail">
                        <div class="order-detail-label">Total</div>
                        <div class="order-detail-value">Rp ${parseFloat(order.price_total || 0).toLocaleString('id-ID')}</div>
                    </div>
                    ${order.items_count ? `
                    <div class="order-detail">
                        <div class="order-detail-label">Items</div>
                        <div class="order-detail-value">${order.items_count} items</div>
                    </div>
                    ` : ''}
                </div>
                <div class="order-actions">
                    <button class="btn btn-outline btn-sm" onclick="window.adminDashboardController.viewOrder(${order.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="window.adminDashboardController.openChat(${order.id})" title="Chat with Customer">
                        <i class="fas fa-comments"></i> Chat
                    </button>
                    ${order.status === 'DIPESAN' && order.pickup_method === 'PICKUP' && !order.admin_approved ? `
                    <button class="btn btn-success btn-sm" onclick="window.adminDashboardController.approveOrder(${order.id})" title="Approve Order">
                        <i class="fas fa-check-circle"></i> Approve
                    </button>
                    ` : ''}
                    ${order.status === 'DICUCI' ? `
                    <button class="btn btn-info btn-sm" onclick="window.adminDashboardController.confirmDelivery(${order.id})" title="Confirm Delivery">
                        <i class="fas fa-truck"></i> Confirm Delivery
                    </button>
                    ` : ''}
                    <button class="btn btn-primary btn-sm" onclick="window.adminDashboardController.updateOrderStatus(${order.id})">
                        <i class="fas fa-edit"></i> Update Status
                    </button>
                </div>
            </div>
        `).join('');
    }

    showRecentOrdersError(message) {
        if (!this.recentOrders) return;
        // Clear loading and show error
        this.recentOrders.innerHTML = `
            <div class="error-message" style="padding: 2rem; text-align: center; color: #dc3545;">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="btn btn-outline btn-sm" onclick="window.adminDashboardController.loadDashboardData()" style="margin-top: 1rem;">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        `;
    }

    formatOrderStatus(status) {
        const statusMap = {
            'DIPESAN': 'Dipesan',
            'PESANAN_DIJEMPUT': 'Pesanan Dijemput',
            'DIAMBIL': 'Diambil',
            'DICUCI': 'Dicuci',
            'MENUNGGU_KONFIRMASI_DELIVERY': 'Menunggu Konfirmasi Delivery',
            'MENUNGGU_PEMBAYARAN_DELIVERY': 'Menunggu Pembayaran Delivery',
            'MENUNGGU_AMBIL_SENDIRI': 'Menunggu Ambil Sendiri',
            'DIKIRIM': 'Dikirim',
            'SELESAI': 'Selesai'
        };
        return statusMap[status] || status;
    }

    renderOrderDetail(order) {
        if (!this.orderDetailContent) return;
        this.orderDetailContent.innerHTML = this.ui.renderOrderDetail(order);
    }

    showOrderDetailModal(order) {
        this.renderOrderDetail(order);
        this.ui.showModal('orderDetailModal');
    }

    hideOrderDetailModal() {
        this.ui.hideModal('orderDetailModal');
    }

    showStatusModal(orderId) {
        this.ui.showModal('updateStatusModal');
    }

    hideStatusModal() {
        this.ui.hideModal('updateStatusModal');
    }

    showChatModal() {
        this.ui.showModal('chatModal');
    }

    hideChatModal() {
        this.ui.hideModal('chatModal');
    }

    renderChat(messages, currentUserId) {
        const chatMessages = document.getElementById('adminChatMessages');
        if (!chatMessages) return;

        if (messages.length === 0) {
            chatMessages.innerHTML = '<p class="empty-message">No messages yet. Start a conversation!</p>';
            return;
        }

        chatMessages.innerHTML = messages.map(msg => {
            const isAdmin = msg.sender_role === 'ADMIN';
            const isCurrentUser = msg.sender_id === currentUserId;
            const messageClass = isCurrentUser ? 'sent' : 'received';
            
            return `
                <div class="chat-message ${messageClass}">
                    <div class="message-header">
                        <strong>${msg.sender_name} ${isAdmin ? '(Admin)' : ''}</strong>
                        <span class="message-time">${new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div class="message-body">${msg.body}</div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    populateStatusSelect(currentStatus, orderData = null) {
        if (!this.statusSelect) return;
        
        this.statusSelect.innerHTML = '';
        
        // Get order info for conditional logic
        const pickupMethod = orderData?.pickup_method || 'SELF';
        const adminApproved = orderData?.admin_approved || false;
        
        // Store order data for approve button
        this.currentOrderData = orderData;
        
        const validTransitions = {
            'DIPESAN': pickupMethod === 'PICKUP' 
                ? (adminApproved ? ['PESANAN_DIJEMPUT'] : []) 
                : ['DICUCI'],
            'PESANAN_DIJEMPUT': ['DIAMBIL'],
            'DIAMBIL': ['DICUCI'],
            'DICUCI': [], // Use confirm-delivery endpoint instead
            'MENUNGGU_KONFIRMASI_DELIVERY': [], // User harus pilih delivery method
            'MENUNGGU_PEMBAYARAN_DELIVERY': ['DIKIRIM'], // Setelah user bayar, admin bisa update ke DIKIRIM
            'MENUNGGU_AMBIL_SENDIRI': ['SELESAI'],
            'DIKIRIM': ['SELESAI'],
            'SELESAI': []
        };
        
        const statusLabels = {
            'PESANAN_DIJEMPUT': 'Pesanan Dijemput',
            'DIAMBIL': 'Diambil',
            'DICUCI': 'Dicuci',
            'MENUNGGU_AMBIL_SENDIRI': 'Menunggu Ambil Sendiri',
            'DIKIRIM': 'Dikirim',
            'SELESAI': 'Selesai'
        };
        
        const nextStatuses = validTransitions[currentStatus] || [];
        
        // Show/hide approve button
        this.toggleApproveButton(currentStatus, pickupMethod, adminApproved);
        
        if (nextStatuses.length === 0) {
            if (currentStatus === 'DIPESAN' && pickupMethod === 'PICKUP' && !adminApproved) {
                this.statusSelect.innerHTML = '<option value="">Order perlu di-approve terlebih dahulu</option>';
            } else if (currentStatus === 'DICUCI') {
                this.statusSelect.innerHTML = '<option value="">Gunakan tombol "Confirm Delivery" untuk melanjutkan</option>';
            } else if (currentStatus === 'SELESAI') {
                this.statusSelect.innerHTML = '<option value="">Order already completed</option>';
            } else {
                this.statusSelect.innerHTML = '<option value="">No valid transitions</option>';
            }
            this.statusSelect.disabled = true;
        } else {
            nextStatuses.forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = statusLabels[status];
                this.statusSelect.appendChild(option);
            });
            this.statusSelect.disabled = false;
        }
        
        // Show/hide estimated_arrival field based on selected status
        this.toggleEstimatedArrivalField();
        if (this.statusSelect) {
            this.statusSelect.addEventListener('change', () => this.toggleEstimatedArrivalField());
        }
    }
    
    toggleApproveButton(currentStatus, pickupMethod, adminApproved) {
        const approveButtonGroup = document.getElementById('approveButtonGroup');
        if (!approveButtonGroup) return;
        
        // Show approve button only for PICKUP orders with DIPESAN status that are not approved
        if (currentStatus === 'DIPESAN' && pickupMethod === 'PICKUP' && !adminApproved) {
            approveButtonGroup.style.display = 'block';
        } else {
            approveButtonGroup.style.display = 'none';
        }
    }
    
    toggleEstimatedArrivalField() {
        const estimatedArrivalGroup = document.getElementById('estimatedArrivalGroup');
        const statusSelect = this.statusSelect;
        
        if (estimatedArrivalGroup && statusSelect) {
            if (statusSelect.value === 'PESANAN_DIJEMPUT') {
                estimatedArrivalGroup.style.display = 'block';
            } else {
                estimatedArrivalGroup.style.display = 'none';
            }
        }
    }

    getStatusFormData() {
        const form = document.getElementById('updateStatusForm');
        if (!form) return null;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Handle estimated_arrival datetime-local input
        if (data.estimated_arrival) {
            // Convert datetime-local to ISO string
            data.estimated_arrival = new Date(data.estimated_arrival).toISOString();
        } else {
            delete data.estimated_arrival;
        }
        
        return data;
    }

    showAlert(message, type = 'info') {
        this.ui.showAlert(message, type);
    }

    showLoading() {
        this.ui.showLoading();
    }

    hideLoading() {
        this.ui.hideLoading();
    }

    showUserNav(user) {
        this.ui.showUserNav(user);
    }

    setupEventListeners(callbacks) {
        // Logout button - use multiple approaches to ensure it works
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && callbacks.onLogout) {
            // Remove any existing listeners by cloning
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            // Add click listener with multiple event types
            const handleLogout = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Logout button clicked');
                if (callbacks.onLogout) {
                    callbacks.onLogout();
                }
            };
            
            newLogoutBtn.addEventListener('click', handleLogout);
            newLogoutBtn.addEventListener('mousedown', handleLogout);
            
            // Also use onclick as fallback
            newLogoutBtn.onclick = handleLogout;
            
            // Make sure button is clickable
            newLogoutBtn.style.cursor = 'pointer';
            newLogoutBtn.style.pointerEvents = 'auto';
        }

        const orderDetailModalClose = document.getElementById('orderDetailModalClose');
        if (orderDetailModalClose) {
            orderDetailModalClose.addEventListener('click', () => this.hideOrderDetailModal());
        }

        const updateStatusModalClose = document.getElementById('updateStatusModalClose');
        if (updateStatusModalClose) {
            updateStatusModalClose.addEventListener('click', () => this.hideStatusModal());
        }

        const cancelStatusUpdate = document.getElementById('cancelStatusUpdate');
        if (cancelStatusUpdate) {
            cancelStatusUpdate.addEventListener('click', () => this.hideStatusModal());
        }

        const updateStatusForm = document.getElementById('updateStatusForm');
        if (updateStatusForm && callbacks.onStatusUpdate) {
            updateStatusForm.addEventListener('submit', callbacks.onStatusUpdate);
        }

        const approveOrderBtn = document.getElementById('approveOrderBtn');
        if (approveOrderBtn && callbacks.onApproveOrder) {
            // Remove existing listeners by cloning
            const newApproveBtn = approveOrderBtn.cloneNode(true);
            approveOrderBtn.parentNode.replaceChild(newApproveBtn, approveOrderBtn);
            
            newApproveBtn.addEventListener('click', () => {
                // Get order ID from currentOrderId (set by controller)
                const controller = window.adminDashboardController;
                if (controller && controller.currentOrderId) {
                    callbacks.onApproveOrder(controller.currentOrderId);
                } else {
                    console.error('Order ID not found');
                    this.showAlert('Order ID not found', 'error');
                }
            });
        }

        const chatModalClose = document.getElementById('chatModalClose');
        if (chatModalClose && callbacks.onChatModalClose) {
            chatModalClose.addEventListener('click', callbacks.onChatModalClose);
        }
    }

    redirect(url) {
        window.location.href = url;
    }

    renderAdminNotifications(notifications) {
        const list = document.getElementById('adminNotificationList');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = '<div class="notification-empty">No notifications</div>';
            return;
        }

        list.innerHTML = notifications.map(notif => {
            // Handle payload_json - could be string or object
            let payload = {};
            try {
                if (notif.payload_json) {
                    payload = typeof notif.payload_json === 'string' 
                        ? JSON.parse(notif.payload_json) 
                        : notif.payload_json;
                }
            } catch (e) {
                console.error('Failed to parse payload_json:', e);
                payload = {};
            }
            const isRead = notif.sent_at !== null;
            const orderId = notif.order_id || payload.orderId || '';
            
            return `
                <div class="notification-item ${isRead ? 'read' : 'unread'}" data-id="${notif.id}">
                    <div class="notification-icon">
                        <i class="fas fa-${this.getNotificationIcon(notif.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${this.getNotificationTitle(notif.type, payload)}</div>
                        <div class="notification-message">${this.getNotificationMessage(notif.type, payload)}</div>
                        <div class="notification-time">${this.formatNotificationTime(notif.created_at)}</div>
                    </div>
                    ${orderId ? `<a href="orders.html" class="notification-link">View Order</a>` : ''}
                </div>
            `;
        }).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            'status_update': 'sync-alt',
            'payment_confirmed': 'check-circle',
            'delivery_choice': 'truck',
            'order_created': 'shopping-cart',
            'chat_message': 'comments'
        };
        return icons[type] || 'bell';
    }

    getNotificationTitle(type, payload) {
        const titles = {
            'status_update': 'Status Updated',
            'payment_confirmed': 'Payment Confirmed',
            'delivery_choice': 'Delivery Choice',
            'order_created': 'New Order',
            'chat_message': 'New Message'
        };
        return titles[type] || 'Notification';
    }

    getNotificationMessage(type, payload) {
        if (payload.message) {
            return payload.message;
        }
        const messages = {
            'status_update': `Order status updated to ${payload.status || 'new status'}`,
            'payment_confirmed': 'Payment has been confirmed',
            'delivery_choice': 'Customer has chosen delivery method',
            'order_created': 'A new order has been created',
            'chat_message': 'You have a new message'
        };
        return messages[type] || 'You have a new notification';
    }

    formatNotificationTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('id-ID');
    }

    renderReviews(reviews) {
        const container = document.getElementById('reviewsContainer');
        if (!container) return;

        if (reviews.length === 0) {
            container.innerHTML = '<div class="empty-message">No reviews yet</div>';
            return;
        }

        container.innerHTML = reviews.map(review => {
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const date = new Date(review.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            return `
                <div class="review-card" style="background: #fff; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <div style="font-weight: 600; color: #333; margin-bottom: 0.25rem;">${review.user_name}</div>
                            <div style="font-size: 0.875rem; color: #666;">${review.user_email}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #ffc107; font-size: 1.25rem; margin-bottom: 0.25rem;">${stars}</div>
                            <div style="font-size: 0.875rem; color: #666;">${date}</div>
                        </div>
                    </div>
                    ${review.comment ? `
                        <div style="color: #555; margin-bottom: 0.75rem; line-height: 1.5;">${review.comment}</div>
                    ` : ''}
                    <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: #666;">
                        <span><strong>Order:</strong> #${review.order_id}</span>
                        ${review.service_name ? `<span><strong>Service:</strong> ${review.service_name}</span>` : ''}
                        <span><strong>Total:</strong> Rp ${parseFloat(review.order_total).toLocaleString()}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}






