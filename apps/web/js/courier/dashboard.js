// Courier Dashboard Module
import { AuthService } from '../services/auth.js';
import { UI } from '../utils/ui.js';

class CourierDashboard {
    constructor() {
        this.authService = new AuthService();
        this.ui = new UI();
        
        this.currentOrderId = null;
        
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuth();
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'COURIER') {
                this.ui.showUserNav(user);
            } else {
                // Try localStorage fallback
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    if (user.role === 'COURIER') {
                        this.ui.showUserNav(user);
                    } else {
                        alert('Access Denied! Courier access required.');
                        window.location.href = '../../index.html';
                    }
                } else {
                    window.location.href = '../../index.html';
                }
            }
        } catch (error) {
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user.role === 'COURIER') {
                    this.ui.showUserNav(user);
                } else {
                    alert('Access Denied! Courier access required.');
                    window.location.href = '../../index.html';
                }
            } else {
                window.location.href = '../../index.html';
            }
        }
    }

    async loadDashboardData() {
        try {
            // Load orders
            await this.loadOrders();
        } catch (error) {
            this.ui.showAlert('Failed to load dashboard data', 'error');
        }
    }

    async loadOrders() {
        try {
            this.ui.showLoading();
            const response = await fetch('http://localhost:3001/api/courier/orders', {
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.ok) {
                this.renderOrders(result.data.orders);
                this.renderStats(result.data.orders);
            } else {
                this.ui.showAlert(result.error || 'Failed to load orders', 'error');
            }
        } catch (error) {
            this.ui.showAlert('Failed to load orders. Please try again.', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    renderStats(orders) {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid) return;

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

        statsGrid.innerHTML = statsCards.map(card => `
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
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        if (orders.length === 0) {
            ordersList.innerHTML = '<p class="empty-message">No orders assigned to you</p>';
            return;
        }

        ordersList.innerHTML = orders.map(order => `
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
                    <button class="btn btn-outline btn-sm" onclick="courierDashboard.viewOrder(${order.id})">View</button>
                    <button class="btn btn-primary btn-sm" onclick="courierDashboard.updateOrderStatus(${order.id})">Update Status</button>
                </div>
            </div>
        `).join('');
    }

    async viewOrder(orderId) {
        try {
            this.ui.showLoading();
            const response = await fetch(`http://localhost:3001/api/courier/orders/${orderId}`, {
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.ok) {
                this.renderOrderDetail(result.data.order);
                this.ui.showModal('orderDetailModal');
            } else {
                this.ui.showAlert(result.error || 'Failed to load order details', 'error');
            }
        } catch (error) {
            this.ui.showAlert('Failed to load order details. Please try again.', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    renderOrderDetail(order) {
        const orderDetailContent = document.getElementById('orderDetailContent');
        if (!orderDetailContent) return;

        orderDetailContent.innerHTML = this.ui.renderOrderDetail(order);
    }

    updateOrderStatus(orderId) {
        this.currentOrderId = orderId;
        this.ui.showModal('updateStatusModal');
    }

    async handleStatusUpdate(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            this.ui.showLoading();
            const response = await fetch(`http://localhost:3001/api/courier/orders/${this.currentOrderId}/delivery-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            const result = await response.json();
            
            if (result.ok) {
                this.ui.hideLoading();
                this.ui.hideModal('updateStatusModal');
                this.ui.showAlert('Delivery status updated successfully!', 'success');
                this.loadDashboardData(); // Refresh data
            } else {
                this.ui.hideLoading();
                this.ui.showAlert(result.error || 'Failed to update status', 'error');
            }
        } catch (error) {
            this.ui.hideLoading();
            this.ui.showAlert('Failed to update status. Please try again.', 'error');
        }
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadDashboardData();
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Modal close buttons
        document.getElementById('orderDetailModalClose')?.addEventListener('click', () => {
            this.ui.hideModal('orderDetailModal');
        });

        document.getElementById('updateStatusModalClose')?.addEventListener('click', () => {
            this.ui.hideModal('updateStatusModal');
        });

        document.getElementById('cancelStatusUpdate')?.addEventListener('click', () => {
            this.ui.hideModal('updateStatusModal');
        });

        // Update status form
        document.getElementById('updateStatusForm')?.addEventListener('submit', (e) => {
            this.handleStatusUpdate(e);
        });
    }

    async logout() {
        try {
            await this.authService.logout();
            window.location.href = '../../index.html';
        } catch (error) {
            this.ui.showAlert('Logout failed', 'error');
        }
    }
}

// Make courierDashboard globally available for onclick handlers
let courierDashboard;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    courierDashboard = new CourierDashboard();
});

// Global functions for onclick handlers
window.courierDashboard = {
    viewOrder: (orderId) => courierDashboard.viewOrder(orderId),
    updateOrderStatus: (orderId) => courierDashboard.updateOrderStatus(orderId)
};


