// Admin Orders View - MVC Pattern
import { UI } from '../../utils/ui.js';

export class AdminOrdersView {
    constructor() {
        this.ui = new UI();
        this.ordersTableBody = document.getElementById('ordersTableBody');
        this.orderDetailContent = document.getElementById('orderDetailContent');
        this.pageInfo = document.getElementById('pageInfo');
        this.prevPage = document.getElementById('prevPage');
        this.nextPage = document.getElementById('nextPage');
    }

    renderOrders(orders) {
        if (!this.ordersTableBody) return;
        
        if (orders.length === 0) {
            this.ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-message">
                        <i class="fas fa-inbox"></i><br>
                        No orders found
                    </td>
                </tr>
            `;
            return;
        }

        this.ordersTableBody.innerHTML = '';

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>#${order.id}</strong></td>
                <td>
                    <div class="customer-info">
                        <span class="customer-name">${order.customer_name || 'N/A'}</span>
                        <span class="customer-phone">${order.phone || '-'}</span>
                    </div>
                </td>
                <td>
                    <span class="items-count">${this.getItemsCount(order)}</span>
                </td>
                <td>
                    <span class="total-price">Rp ${parseFloat(order.price_total || 0).toLocaleString('id-ID')}</span>
                </td>
                <td>
                    <span class="status status-${order.status.toLowerCase().replace(/_/g, '-')}">${this.formatOrderStatus(order.status)}</span>
                </td>
                <td>${this.formatDate(order.created_at)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-primary" onclick="window.adminOrdersController.viewOrder(${order.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="window.adminOrdersController.openChat(${order.id})" title="Chat with Customer">
                            <i class="fas fa-comments"></i> Chat
                        </button>
                        ${this.getStatusButton(order.status, order.id)}
                    </div>
                </td>
            `;
            this.ordersTableBody.appendChild(row);
        });
    }

    getItemsCount(order) {
        let count = 0;
        
        // Check if items_count exists (from backend query)
        if (order.items_count !== undefined && order.items_count !== null) {
            count = order.items_count;
        }
        // Check if items array exists
        else if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            count = order.items.length;
        }
        // Check if order_items exists
        else if (order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
            count = order.order_items.length;
        }
        
        return count > 0 ? `${count} item${count > 1 ? 's' : ''}` : '0 items';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }
    
    formatOrderStatus(status) {
        return this.ui.formatOrderStatus(status);
    }

    getStatusButton(currentStatus, orderId) {
        const statusButtons = {
            'DIPESAN': `<button class="btn btn-sm btn-primary" onclick="window.adminOrdersController.viewOrder(${orderId})" title="View Order">
                <i class="fas fa-eye"></i> View
            </button>`,
            'PESANAN_DIJEMPUT': `<button class="btn btn-sm btn-warning" onclick="window.adminOrdersController.updateStatus(${orderId}, 'DIAMBIL')" title="Mark as Taken">
                <i class="fas fa-hand-holding"></i> Taken
            </button>`,
            'DIAMBIL': `<button class="btn btn-sm btn-info" onclick="window.adminOrdersController.updateStatus(${orderId}, 'DICUCI')" title="Mark as Washing">
                <i class="fas fa-soap"></i> Wash
            </button>`,
            'DICUCI': `<button class="btn btn-sm btn-primary" onclick="window.adminOrdersController.viewOrder(${orderId})" title="View Order">
                <i class="fas fa-eye"></i> View
            </button>`,
            'MENUNGGU_AMBIL_SENDIRI': `<button class="btn btn-sm btn-success" onclick="window.adminOrdersController.updateStatus(${orderId}, 'SELESAI')" title="Mark as Completed">
                <i class="fas fa-check-circle"></i> Complete
            </button>`,
            'DIKIRIM': `<button class="btn btn-sm btn-success" onclick="window.adminOrdersController.updateStatus(${orderId}, 'SELESAI')" title="Mark as Completed">
                <i class="fas fa-check-circle"></i> Complete
            </button>`,
            'SELESAI': `<span class="status status-selesai" style="padding: 0.5rem 1rem;">
                <i class="fas fa-check"></i> Completed
            </span>`
        };
        return statusButtons[currentStatus] || '';
    }

    updatePagination(pagination) {
        if (this.pageInfo && this.prevPage && this.nextPage) {
            if (pagination) {
                // Handle different pagination formats
                const currentPage = pagination.current_page || pagination.page || pagination.currentPage || 1;
                const totalPages = pagination.total_pages || pagination.pages || pagination.totalPages || 1;
                const total = pagination.total || pagination.totalItems || 0;
                
                this.pageInfo.textContent = `Page ${currentPage} of ${totalPages}${total > 0 ? ` (${total} total)` : ''}`;
                this.prevPage.disabled = currentPage <= 1;
                this.nextPage.disabled = currentPage >= totalPages;
            } else {
                // Fallback if pagination is not provided
                this.pageInfo.textContent = 'Page 1 of 1';
                this.prevPage.disabled = true;
                this.nextPage.disabled = true;
            }
        }
    }

    showOrderDetailModal(order) {
        if (!this.orderDetailContent) return;
        
        this.orderDetailContent.innerHTML = `
            <div class="order-detail">
                <h4>Order #${order.id}</h4>
                <div class="detail-section">
                    <h5>Customer Information</h5>
                    <p><strong>Name:</strong> ${order.customer_name}</p>
                    <p><strong>Phone:</strong> ${order.phone}</p>
                    <p><strong>Address:</strong> ${order.address}</p>
                </div>
                <div class="detail-section">
                    <h5>Order Items</h5>
                    <ul>
                        ${order.items ? order.items.map(item => `
                            <li>${item.service_name} x${item.qty} - Rp ${parseFloat(item.subtotal).toLocaleString()}</li>
                        `).join('') : '<li>No items</li>'}
                    </ul>
                </div>
                <div class="detail-section">
                    <h5>Order Summary</h5>
                    <p><strong>Total:</strong> Rp ${parseFloat(order.price_total).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span class="status status-${order.status.toLowerCase()}">${order.status}</span></p>
                    <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                    <p><strong>Notes:</strong> ${order.notes || 'No notes'}</p>
                </div>
            </div>
        `;
        this.ui.showModal('orderDetailModal');
    }

    hideOrderDetailModal() {
        this.ui.hideModal('orderDetailModal');
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

    formatOrderStatus(status) {
        return this.ui.formatOrderStatus(status);
    }

    getStatusFilter() {
        const statusFilter = document.getElementById('statusFilter');
        return statusFilter ? statusFilter.value : '';
    }

    getSearchInput() {
        const searchInput = document.getElementById('searchInput');
        return searchInput ? searchInput.value : '';
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
        const applyFilters = document.getElementById('applyFilters');
        if (applyFilters && callbacks.onApplyFilters) {
            applyFilters.addEventListener('click', callbacks.onApplyFilters);
        }

        if (this.prevPage && callbacks.onPrevPage) {
            this.prevPage.addEventListener('click', callbacks.onPrevPage);
        }

        if (this.nextPage && callbacks.onNextPage) {
            this.nextPage.addEventListener('click', callbacks.onNextPage);
        }

        const orderDetailModalClose = document.getElementById('orderDetailModalClose');
        if (orderDetailModalClose) {
            orderDetailModalClose.addEventListener('click', () => this.hideOrderDetailModal());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && callbacks.onLogout) {
            logoutBtn.addEventListener('click', callbacks.onLogout);
        }
    }

    redirect(url) {
        window.location.href = url;
    }
}






