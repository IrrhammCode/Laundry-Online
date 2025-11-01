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

        const { orderStats, revenue } = data;
        
        const statsCards = [
            {
                title: 'Total Orders',
                value: orderStats.reduce((sum, stat) => sum + stat.count, 0),
                icon: 'fas fa-shopping-cart',
                color: '#007bff'
            },
            {
                title: 'Total Revenue',
                value: `Rp ${(revenue.total_revenue || 0).toLocaleString()}`,
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

    renderRecentOrders(orders) {
        if (!this.recentOrders) return;

        if (orders.length === 0) {
            this.recentOrders.innerHTML = '<p class="empty-message">No recent orders</p>';
            return;
        }

        this.recentOrders.innerHTML = orders.map(order => `
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
                </div>
                <div class="order-actions">
                    <button class="btn btn-outline btn-sm" onclick="window.adminDashboardController.viewOrder(${order.id})">View</button>
                    <button class="btn btn-primary btn-sm" onclick="window.adminDashboardController.updateOrderStatus(${order.id})">Update Status</button>
                </div>
            </div>
        `).join('');
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

    populateStatusSelect(currentStatus) {
        if (!this.statusSelect) return;
        
        this.statusSelect.innerHTML = '';
        
        const validTransitions = {
            'DIPESAN': ['DIJEMPUT'],
            'DIJEMPUT': ['DICUCI'],
            'DICUCI': ['DIKIRIM'],
            'DIKIRIM': ['SELESAI'],
            'SELESAI': []
        };
        
        const statusLabels = {
            'DIJEMPUT': 'Dijemput',
            'DICUCI': 'Dicuci', 
            'DIKIRIM': 'Dikirim',
            'SELESAI': 'Selesai'
        };
        
        const nextStatuses = validTransitions[currentStatus] || [];
        
        if (nextStatuses.length === 0) {
            this.statusSelect.innerHTML = '<option value="">Order already completed</option>';
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
    }

    redirect(url) {
        window.location.href = url;
    }
}



