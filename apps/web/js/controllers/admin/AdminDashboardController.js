// Admin Dashboard Controller - MVC Pattern
import { AuthService } from '../../services/auth.js';
import { AdminDashboardView } from '../../views/admin/AdminDashboardView.js';

export class AdminDashboardController {
    constructor() {
        this.authService = new AuthService();
        this.view = new AdminDashboardView();
        this.currentOrderId = null;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadDashboardData();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            // Check localStorage first (more reliable after redirect)
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user && user.role === 'ADMIN') {
                    this.view.showUserNav(user);
                    return;
                }
            }
            
            // Fallback to API call
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'ADMIN') {
                // Update localStorage with fresh data
                localStorage.setItem('userInfo', JSON.stringify(user));
                this.view.showUserNav(user);
            } else {
                alert('Access Denied! Admin access required.');
                this.view.redirect('../../index.html');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user && user.role === 'ADMIN') {
                    this.view.showUserNav(user);
                } else {
                    alert('Access Denied! Admin access required.');
                    this.view.redirect('../../index.html');
                }
            } else {
                this.view.redirect('../../index.html');
            }
        }
    }

    async loadDashboardData() {
        try {
            await this.loadStats();
            await this.loadRecentOrders();
        } catch (error) {
            this.view.showAlert('Failed to load dashboard data', 'error');
        }
    }

    async loadStats() {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/dashboard/stats`, {
                headers: headers,
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.ok) {
                this.view.renderStats(result.data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    async loadRecentOrders() {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders?limit=5`, {
                headers: headers,
                credentials: 'include'
            });
            const result = await response.json();
            
            if (result.ok) {
                this.view.renderRecentOrders(result.data.orders);
            }
        } catch (error) {
            console.error('Failed to load recent orders:', error);
        }
    }

    async viewOrder(orderId) {
        try {
            this.view.showLoading();
            
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
            const result = await response.json();
            
            if (result.ok) {
                this.view.showOrderDetailModal(result.data.order);
            } else {
                this.view.showAlert(result.error || 'Failed to load order details', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to load order details. Please try again.', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    updateOrderStatus(orderId) {
        this.currentOrderId = orderId;
        this.populateStatusOptions(orderId);
        this.view.showStatusModal();
    }
    
    async populateStatusOptions(orderId) {
        try {
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
                this.view.populateStatusSelect(currentStatus);
            }
        } catch (error) {
            console.error('Failed to get order status:', error);
            this.view.populateStatusSelect('DIPESAN');
        }
    }

    async handleStatusUpdate(e) {
        e.preventDefault();
        
        const data = this.view.getStatusFormData();
        if (!data || !data.status) {
            this.view.showAlert('Please select a status', 'error');
            return;
        }
        
        const validStatuses = ['DIPESAN', 'DIJEMPUT', 'DICUCI', 'DIKIRIM', 'SELESAI'];
        if (!validStatuses.includes(data.status)) {
            this.view.showAlert('Invalid status selected', 'error');
            return;
        }

        try {
            this.view.showLoading();
            
            const authToken = localStorage.getItem('authToken');
            let headers = {
                'Content-Type': 'application/json',
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const updateData = {
                status: data.status,
                notes: data.notes || ''
            };
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${this.currentOrderId}/status`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.view.hideLoading();
                this.view.hideStatusModal();
                this.view.showAlert('Order status updated successfully!', 'success');
                this.loadDashboardData();
            } else {
                this.view.hideLoading();
                this.view.showAlert(result.error || 'Failed to update status', 'error');
            }
        } catch (error) {
            this.view.hideLoading();
            this.view.showAlert('Failed to update status. Please try again.', 'error');
        }
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onLogout: () => this.logout(),
            onStatusUpdate: (e) => this.handleStatusUpdate(e)
        });
    }

    async logout() {
        try {
            await this.authService.logout();
            this.view.redirect('login.html');
        } catch (error) {
            this.view.showAlert('Logout failed', 'error');
        }
    }
}

let adminDashboardController;

document.addEventListener('DOMContentLoaded', () => {
    adminDashboardController = new AdminDashboardController();
    window.adminDashboardController = adminDashboardController;
});






