// Courier Dashboard View - MVC Pattern
import { UI } from '../../utils/ui.js';

export class CourierDashboardView {
    constructor() {
        this.ui = new UI();
        this.statsGrid = document.getElementById('statsGrid');
        this.ordersList = document.getElementById('ordersList');
        this.orderDetailContent = document.getElementById('orderDetailContent');
    }

    renderStats(orders) {
        if (!this.statsGrid) return;

        const totalOrders = orders.length;
        const completedOrders = orders.filter(order => order.status === 'SELESAI').length;
        const inProgressOrders = orders.filter(order => ['DIJEMPUT', 'DIKIRIM'].includes(order.status)).length;

        const statsCards = [
            {
                title: 'Total Orders',
                value: totalOrders,
                icon: 'fas fa-shopping-cart',
                color: '#007bff'
            },
            {
                title: 'Completed',
                value: completedOrders,
                icon: 'fas fa-check-circle',
                color: '#28a745'
            },
            {
                title: 'In Progress',
                value: inProgressOrders,
                icon: 'fas fa-clock',
                color: '#ffc107'
            }
        ];

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

    renderOrders(orders) {
        if (!this.ordersList) return;

        if (orders.length === 0) {
            this.ordersList.innerHTML = '<p class="empty-message">No orders assigned to you</p>';
            return;
        }

        this.ordersList.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">#${order.id}</div>
                    <div class="order-date">${new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <div class="order-details">
                    <div class="order-detail">
                        <div class="order-detail-label">Customer</div>
                        <div class="order-detail-value">${order.customer_name}</div>
                    </div>
                    <div class="order-detail">
                        <div class="order-detail-label">Status</div>
                        <div class="order-detail-value">
                            <span class="status-badge status-${order.status.toLowerCase()}">
                                ${this.ui.formatOrderStatus(order.status)}
                            </span>
                        </div>
                    </div>
                    <div class="order-detail">
                        <div class="order-detail-label">Total</div>
                        <div class="order-detail-value">Rp ${order.price_total.toLocaleString()}</div>
                    </div>
                    <div class="order-detail">
                        <div class="order-detail-label">Address</div>
                        <div class="order-detail-value">${order.address || 'N/A'}</div>
                    </div>
                </div>
                <div class="order-actions">
                    <button class="btn btn-outline btn-sm" onclick="window.courierDashboardController.viewOrder(${order.id})">View</button>
                    <button class="btn btn-primary btn-sm" onclick="window.courierDashboardController.updateOrderStatus(${order.id})">Update Status</button>
                </div>
            </div>
        `).join('');
    }

    renderOrderDetail(order) {
        if (!this.orderDetailContent) return;
        
        this.orderDetailContent.innerHTML = `
            <div class="order-detail">
                <h4>Order #${order.id}</h4>
                <div class="detail-section">
                    <h5>Customer Information</h5>
                    <p><strong>Name:</strong> ${order.customer_name}</p>
                    <p><strong>Phone:</strong> ${order.phone}</p>
                    <p><strong>Address:</strong> ${order.address || 'N/A'}</p>
                </div>
                <div class="detail-section">
                    <h5>Order Items</h5>
                    <ul>
                        ${order.items ? order.items.map(item => `
                            <li>${item.service_name} x${item.qty} - Rp ${parseFloat(item.subtotal || item.unit_price * item.qty).toLocaleString()}</li>
                        `).join('') : '<li>No items</li>'}
                    </ul>
                </div>
                <div class="detail-section">
                    <h5>Order Summary</h5>
                    <p><strong>Total:</strong> Rp ${parseFloat(order.price_total).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span class="status status-${order.status.toLowerCase()}">${order.status}</span></p>
                    <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                </div>
            </div>
        `;
    }

    showOrderDetailModal(order) {
        this.renderOrderDetail(order);
        this.ui.showModal('orderDetailModal');
    }

    hideOrderDetailModal() {
        this.ui.hideModal('orderDetailModal');
    }

    showStatusModal() {
        this.ui.showModal('updateStatusModal');
    }

    hideStatusModal() {
        this.ui.hideModal('updateStatusModal');
    }

    getStatusFormData() {
        const form = document.getElementById('updateStatusForm');
        if (!form) return null;
        const formData = new FormData(form);
        return Object.fromEntries(formData);
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
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && callbacks.onLogout) {
            logoutBtn.addEventListener('click', callbacks.onLogout);
        }

        const orderDetailModalClose = document.getElementById('orderDetailModalClose');
        if (orderDetailModalClose) {
            orderDetailModalClose.addEventListener('click', () => this.hideOrderDetailModal());
        }

        const updateStatusForm = document.getElementById('updateStatusForm');
        if (updateStatusForm && callbacks.onStatusUpdate) {
            updateStatusForm.addEventListener('submit', callbacks.onStatusUpdate);
        }
    }

    redirect(url) {
        window.location.href = url;
    }
}



