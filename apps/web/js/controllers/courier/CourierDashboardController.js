// Courier Dashboard Controller - MVC Pattern
import { AuthService } from '../../services/auth.js';
import { CourierDashboardView } from '../../views/courier/CourierDashboardView.js';

export class CourierDashboardController {
    constructor() {
        this.authService = new AuthService();
        this.view = new CourierDashboardView();
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
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'COURIER') {
                this.view.showUserNav(user);
            } else {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    if (user.role === 'COURIER') {
                        this.view.showUserNav(user);
                    } else {
                        alert('Access Denied! Courier access required.');
                        this.view.redirect('login.html');
                    }
                } else {
                    this.view.redirect('login.html');
                }
            }
        } catch (error) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user.role === 'COURIER') {
                    this.view.showUserNav(user);
                } else {
                    alert('Access Denied! Courier access required.');
                    this.view.redirect('login.html');
                }
            } else {
                this.view.redirect('login.html');
            }
        }
    }

    async loadDashboardData() {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const response = await fetch('http://localhost:3001/api/courier/orders', {
                headers: headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.view.renderStats(result.data.orders);
                this.view.renderOrders(result.data.orders);
            }
        } catch (error) {
            this.view.showAlert('Failed to load dashboard data', 'error');
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
            
            const response = await fetch(`http://localhost:3001/api/courier/orders/${orderId}`, {
                headers: headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.view.showOrderDetailModal(result.data.order);
            } else {
                this.view.showAlert(result.error || 'Failed to load order details', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to load order details', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    updateOrderStatus(orderId) {
        this.currentOrderId = orderId;
        this.view.showStatusModal();
    }

    async handleStatusUpdate(e) {
        e.preventDefault();
        
        const data = this.view.getStatusFormData();
        if (!data || !data.status) {
            this.view.showAlert('Please select a status', 'error');
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
            
            const response = await fetch(`http://localhost:3001/api/courier/orders/${this.currentOrderId}/status`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({ status: data.status, notes: data.notes || '' })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update status');
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.view.hideStatusModal();
                this.view.showAlert('Order status updated successfully!', 'success');
                this.loadDashboardData();
            } else {
                this.view.showAlert(result.error || 'Failed to update status', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to update status', 'error');
        } finally {
            this.view.hideLoading();
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

let courierDashboardController;

document.addEventListener('DOMContentLoaded', () => {
    courierDashboardController = new CourierDashboardController();
    window.courierDashboardController = courierDashboardController;
});



