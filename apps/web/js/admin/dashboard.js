// Admin Dashboard Module
import { AuthService } from '../services/auth.js';
import { UI } from '../utils/ui.js';

class AdminDashboard {
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
            if (user && user.role === 'ADMIN') {
                this.ui.showUserNav(user);
            } else {
                // Try localStorage fallback
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    if (user.role === 'ADMIN') {
                        this.ui.showUserNav(user);
                    } else {
                        alert('Access Denied! Admin access required.');
                        window.location.href = '../index.html';
                    }
                } else {
                    window.location.href = '../index.html';
                }
            }
        } catch (error) {
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user.role === 'ADMIN') {
                    this.ui.showUserNav(user);
                } else {
                    alert('Access Denied! Admin access required.');
                    window.location.href = '../index.html';
                }
            } else {
                window.location.href = 'login.html';
            }
        }
    }

    async loadDashboardData() {
        try {
            // Load stats
            await this.loadStats();
            
            // Load recent orders
            await this.loadRecentOrders();
        } catch (error) {
            this.ui.showAlert('Failed to load dashboard data', 'error');
        }
    }

    async loadStats() {
        try {
            // Get token from localStorage
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for admin stats');
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/dashboard/stats`, {
                headers: headers,
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.ok) {
                this.renderStats(result.data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    renderStats(data) {
        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid) return;

        const { orderStats, revenue, recentOrders } = data;
        
        // Create stats cards
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

    async loadRecentOrders() {
        try {
            // Get token from localStorage
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for recent orders');
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders?limit=5`, {
                headers: headers,
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.ok) {
                this.renderRecentOrders(result.data.orders);
            }
        } catch (error) {
            console.error('Failed to load recent orders:', error);
        }
    }

    renderRecentOrders(orders) {
        const recentOrders = document.getElementById('recentOrders');
        if (!recentOrders) return;

        if (orders.length === 0) {
            recentOrders.innerHTML = '<p class="empty-message">No recent orders</p>';
            return;
        }

        recentOrders.innerHTML = orders.map(order => `
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
                    <button class="btn btn-outline btn-sm" onclick="adminDashboard.viewOrder(${order.id})">View</button>
                    <button class="btn btn-primary btn-sm" onclick="adminDashboard.updateOrderStatus(${order.id})">Update Status</button>
                </div>
            </div>
        `).join('');
    }

    async viewOrder(orderId) {
        try {
            this.ui.showLoading();
            
            // Get token from localStorage
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for order detail');
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${orderId}`, {
                headers: headers,
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
        console.log('Setting currentOrderId to:', orderId);
        
        // Get current order status and populate options
        this.populateStatusOptions(orderId);
        this.ui.showModal('updateStatusModal');
    }
    
    async populateStatusOptions(orderId) {
        try {
            // Get token from localStorage
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${orderId}`, {
                headers: headers,
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                const currentStatus = result.data.order.status;
                this.populateStatusSelect(currentStatus);
            }
        } catch (error) {
            console.error('Failed to get order status:', error);
            // Fallback to default options
            this.populateStatusSelect('DIPESAN');
        }
    }
    
    populateStatusSelect(currentStatus) {
        const statusSelect = document.getElementById('newStatus');
        if (!statusSelect) return;
        
        // Clear existing options
        statusSelect.innerHTML = '';
        
        // Define valid transitions based on current status
        const validTransitions = {
            'DIPESAN': ['DIJEMPUT'],
            'DIJEMPUT': ['DICUCI'],
            'DICUCI': ['DIKIRIM'],
            'DIKIRIM': ['SELESAI'],
            'SELESAI': [] // No transitions from completed
        };
        
        const statusLabels = {
            'DIJEMPUT': 'Dijemput',
            'DICUCI': 'Dicuci', 
            'DIKIRIM': 'Dikirim',
            'SELESAI': 'Selesai'
        };
        
        const nextStatuses = validTransitions[currentStatus] || [];
        
        if (nextStatuses.length === 0) {
            statusSelect.innerHTML = '<option value="">Order already completed</option>';
            statusSelect.disabled = true;
        } else {
            nextStatuses.forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = statusLabels[status];
                statusSelect.appendChild(option);
            });
            statusSelect.disabled = false;
        }
    }

    async handleStatusUpdate(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Ensure status is valid
        if (!data.status) {
            this.ui.showAlert('Please select a status', 'error');
            return;
        }
        
        // Validate status value
        const validStatuses = ['DIPESAN', 'DIJEMPUT', 'DICUCI', 'DIKIRIM', 'SELESAI'];
        if (!validStatuses.includes(data.status)) {
            this.ui.showAlert('Invalid status selected', 'error');
            return;
        }

        try {
            this.ui.showLoading();
            
            // Get token from localStorage
            const authToken = localStorage.getItem('authToken');
            let headers = {
                'Content-Type': 'application/json',
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for status update');
            }
            
            console.log('Status update data:', data);
            console.log('Order ID:', this.currentOrderId);
            console.log('Headers:', headers);
            
            // Test with simple data first
            const testData = {
                status: data.status,
                notes: data.notes || ''
            };
            
            console.log('Sending test data:', testData);
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${this.currentOrderId}/status`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify(testData)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            const result = await response.json();
            
            if (result.ok) {
                this.ui.hideLoading();
                this.ui.hideModal('updateStatusModal');
                this.ui.showAlert('Order status updated successfully!', 'success');
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
            window.location.href = 'login.html';
        } catch (error) {
            this.ui.showAlert('Logout failed', 'error');
        }
    }
}

// Make adminDashboard globally available for onclick handlers
let adminDashboard;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});

// Global functions for onclick handlers
window.adminDashboard = {
    viewOrder: (orderId) => adminDashboard.viewOrder(orderId),
    updateOrderStatus: (orderId) => adminDashboard.updateOrderStatus(orderId)
};


