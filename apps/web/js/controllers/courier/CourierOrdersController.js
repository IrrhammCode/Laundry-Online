// Courier Orders Controller - MVC Pattern
import { AuthService } from '../../services/auth.js';
import { CourierOrdersView } from '../../views/courier/CourierOrdersView.js';

export class CourierOrdersController {
    constructor() {
        this.authService = new AuthService();
        this.view = new CourierOrdersView();
        
        this.pickupOrders = [];
        this.deliveryOrders = [];
        
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

    async loadOrders() {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            // Load pickup orders (DIPESAN, DIJEMPUT)
            const pickupResponse = await fetch('http://localhost:3001/api/courier/orders?type=pickup', {
                headers: headers,
                credentials: 'include'
            });
            
            // Load delivery orders (DICUCI, DIKIRIM)
            const deliveryResponse = await fetch('http://localhost:3001/api/courier/orders?type=delivery', {
                headers: headers,
                credentials: 'include'
            });
            
            if (pickupResponse.ok) {
                const pickupResult = await pickupResponse.json();
                if (pickupResult.ok) {
                    this.pickupOrders = pickupResult.data.orders || [];
                    this.view.renderPickupOrders(this.pickupOrders);
                }
            }
            
            if (deliveryResponse.ok) {
                const deliveryResult = await deliveryResponse.json();
                if (deliveryResult.ok) {
                    this.deliveryOrders = deliveryResult.data.orders || [];
                    this.view.renderDeliveryOrders(this.deliveryOrders);
                }
            }
        } catch (error) {
            this.view.showAlert('Failed to load orders', 'error');
        }
    }

    viewOrder(orderId, type) {
        const orders = type === 'pickup' ? this.pickupOrders : this.deliveryOrders;
        const order = orders.find(o => o.id === orderId);
        
        if (order) {
            this.view.showOrderDetailModal(order, type);
        }
    }

    async updateStatus(orderId, newStatus, type) {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {
                'Content-Type': 'application/json',
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const response = await fetch(`http://localhost:3001/api/courier/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update status');
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.view.showAlert('Order status updated successfully', 'success');
                await this.loadOrders();
            } else {
                this.view.showAlert(result.error || 'Failed to update order status', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to update order status', 'error');
        }
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onLogout: () => this.logout()
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

let courierOrdersController;

document.addEventListener('DOMContentLoaded', () => {
    courierOrdersController = new CourierOrdersController();
    window.courierOrdersController = courierOrdersController;
});



