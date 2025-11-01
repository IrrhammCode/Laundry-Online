// Admin Orders Controller - MVC Pattern
import { AuthService } from '../../services/auth.js';
import { OrderService } from '../../services/order.js';
import { AdminOrdersView } from '../../views/admin/AdminOrdersView.js';

export class AdminOrdersController {
    constructor() {
        this.authService = new AuthService();
        this.orderService = new OrderService();
        this.view = new AdminOrdersView();
        
        this.currentPage = 1;
        this.currentStatus = '';
        this.currentSearch = '';
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadOrders();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'ADMIN') {
                this.view.showUserNav(user);
            } else {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    if (user.role === 'ADMIN') {
                        this.view.showUserNav(user);
                    } else {
                        alert('Access Denied! Admin access required.');
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
                if (user.role === 'ADMIN') {
                    this.view.showUserNav(user);
                } else {
                    alert('Access Denied! Admin access required.');
                    this.view.redirect('login.html');
                }
            } else {
                this.view.redirect('login.html');
            }
        }
    }

    async loadOrders() {
        try {
            this.view.showLoading();
            
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const response = await fetch(`http://localhost:3001/api/admin/orders?page=${this.currentPage}&limit=10&status=${this.currentStatus}&search=${this.currentSearch}`, {
                headers: headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.view.renderOrders(result.data.orders);
                this.view.updatePagination(result.data.pagination);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.view.showAlert('Failed to load orders', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    async updateStatus(orderId, newStatus) {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {
                'Content-Type': 'application/json',
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const response = await fetch(`http://localhost:3001/api/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.view.showAlert('Order status updated successfully', 'success');
                this.loadOrders();
            } else {
                this.view.showAlert(result.error || 'Failed to update order status', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to update order status', 'error');
        }
    }

    async viewOrder(orderId) {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const response = await fetch(`http://localhost:3001/api/admin/orders/${orderId}`, {
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
        }
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onApplyFilters: () => {
                this.currentStatus = this.view.getStatusFilter();
                this.currentSearch = this.view.getSearchInput();
                this.currentPage = 1;
                this.loadOrders();
            },
            onPrevPage: () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.loadOrders();
                }
            },
            onNextPage: () => {
                this.currentPage++;
                this.loadOrders();
            }
        });
    }
}

let adminOrdersController;

document.addEventListener('DOMContentLoaded', () => {
    adminOrdersController = new AdminOrdersController();
    window.adminOrdersController = adminOrdersController;
});



