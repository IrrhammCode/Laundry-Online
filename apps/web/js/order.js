// Order Page Module
import { AuthService } from './services/auth.js';
import { OrderService } from './services/order.js';
import { UI } from './utils/ui.js';

class OrderPage {
    constructor() {
        this.authService = new AuthService();
        this.orderService = new OrderService();
        this.ui = new UI();
        
        this.services = [];
        this.selectedItems = [];
        this.pickupFee = 0;
        
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuth();
        
        // Load services
        await this.loadServices();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user) {
                this.ui.showUserNav(user);
            } else {
                // Try localStorage fallback
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    this.ui.showUserNav(user);
                } else {
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                this.ui.showUserNav(user);
            } else {
                window.location.href = 'index.html';
            }
        }
    }

    async loadServices() {
        try {
            this.services = await this.orderService.getServices();
            this.renderServices();
        } catch (error) {
            this.ui.showAlert('Failed to load services', 'error');
        }
    }

    renderServices() {
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid) return;

        servicesGrid.innerHTML = this.services.map(service => `
            <div class="service-card" data-service-id="${service.id}">
                <div class="service-icon">
                    <i class="fas fa-tshirt"></i>
                </div>
                <div class="service-name">${service.name}</div>
                <div class="service-price">Rp ${service.base_price.toLocaleString()}/${service.unit}</div>
                <div class="service-description">${service.description || ''}</div>
                <div class="service-controls">
                    <button type="button" class="btn btn-outline btn-sm" onclick="orderPage.addService(${service.id})">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        `).join('');
    }

    addService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) return;

        const existingItem = this.selectedItems.find(item => item.service_id === serviceId);
        
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            this.selectedItems.push({
                service_id: serviceId,
                qty: 1,
                unit_price: service.base_price,
                service_name: service.name,
                unit: service.unit
            });
        }

        this.renderOrderItems();
        this.updateOrderSummary();
    }

    removeService(serviceId) {
        this.selectedItems = this.selectedItems.filter(item => item.service_id !== serviceId);
        this.renderOrderItems();
        this.updateOrderSummary();
    }

    updateServiceQuantity(serviceId, qty) {
        const item = this.selectedItems.find(item => item.service_id === serviceId);
        if (item) {
            if (qty <= 0) {
                this.removeService(serviceId);
            } else {
                item.qty = qty;
                this.renderOrderItems();
                this.updateOrderSummary();
            }
        }
    }

    renderOrderItems() {
        const orderItems = document.getElementById('orderItems');
        if (!orderItems) return;

        if (this.selectedItems.length === 0) {
            orderItems.innerHTML = '<p class="empty-message">No items selected. Please select services above.</p>';
            return;
        }

        orderItems.innerHTML = this.selectedItems.map(item => `
            <div class="order-item">
                <div class="item-info">
                    <h4>${item.service_name}</h4>
                    <p>Rp ${item.unit_price.toLocaleString()}/${item.unit}</p>
                </div>
                <div class="item-controls">
                    <button type="button" class="btn btn-outline btn-sm" onclick="orderPage.updateServiceQuantity(${item.service_id}, ${item.qty - 1})">-</button>
                    <span class="quantity">${item.qty}</span>
                    <button type="button" class="btn btn-outline btn-sm" onclick="orderPage.updateServiceQuantity(${item.service_id}, ${item.qty + 1})">+</button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="orderPage.removeService(${item.service_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="item-subtotal">
                    Rp ${(item.unit_price * item.qty).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    updateOrderSummary() {
        const servicesTotal = this.selectedItems.reduce((total, item) => total + (item.unit_price * item.qty), 0);
        
        // Update pickup fee
        const pickupMethod = document.querySelector('input[name="pickup_method"]:checked');
        this.pickupFee = pickupMethod?.value === 'PICKUP' ? 5000 : 0;
        
        const total = servicesTotal + this.pickupFee;

        document.getElementById('servicesTotal').textContent = `Rp ${servicesTotal.toLocaleString()}`;
        document.getElementById('pickupFee').textContent = `Rp ${this.pickupFee.toLocaleString()}`;
        document.getElementById('orderTotal').textContent = `Rp ${total.toLocaleString()}`;
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('orderForm')?.addEventListener('submit', (e) => {
            this.handleOrderSubmit(e);
        });

        // Pickup method change
        document.querySelectorAll('input[name="pickup_method"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.updateOrderSummary();
            });
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Payment modal
        document.getElementById('paymentModalClose')?.addEventListener('click', () => {
            this.ui.hideModal('paymentModal');
        });

        document.getElementById('cancelPayment')?.addEventListener('click', () => {
            this.ui.hideModal('paymentModal');
        });

        document.getElementById('paymentForm')?.addEventListener('submit', (e) => {
            this.handlePaymentSubmit(e);
        });
    }

    async handleOrderSubmit(e) {
        e.preventDefault();

        if (this.selectedItems.length === 0) {
            this.ui.showAlert('Please select at least one service', 'error');
            return;
        }

        const formData = new FormData(e.target);
        const orderData = {
            pickup_method: formData.get('pickup_method'),
            items: this.selectedItems,
            notes: formData.get('notes')
        };

        // Debug: log order data and check cookies
        console.log('Order data:', orderData);
        console.log('Cookies:', document.cookie);

        try {
            this.ui.showLoading();
            const result = await this.orderService.createOrder(orderData);
            
            if (result.ok) {
                this.ui.hideLoading();
                // Store the order ID for payment confirmation
                this.currentOrderId = result.data.order.id;
                this.showPaymentModal(result.data.order);
            } else {
                this.ui.hideLoading();
                this.ui.showAlert(result.error || 'Failed to create order', 'error');
            }
        } catch (error) {
            this.ui.hideLoading();
            this.ui.showAlert('Failed to create order. Please try again.', 'error');
        }
    }

    showPaymentModal(order) {
        const total = order.price_total;
        
        document.getElementById('paymentTotal').textContent = `Rp ${total.toLocaleString()}`;
        document.getElementById('paymentAmount').value = total;
        
        this.ui.showModal('paymentModal');
    }

    async handlePaymentSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const paymentData = {
            method: formData.get('method'),
            amount: parseFloat(formData.get('amount'))
        };

        // Get order ID from the current order (you might need to store this)
        const orderId = this.currentOrderId;

        try {
            this.ui.showLoading();
            const result = await this.orderService.confirmPayment(orderId, paymentData);
            
            if (result.ok) {
                this.ui.hideLoading();
                this.ui.hideModal('paymentModal');
                this.ui.showAlert('Order created and payment confirmed successfully!', 'success');
                
                // Redirect to history page
                setTimeout(() => {
                    window.location.href = 'history.html';
                }, 2000);
            } else {
                this.ui.hideLoading();
                this.ui.showAlert(result.error || 'Failed to confirm payment', 'error');
            }
        } catch (error) {
            this.ui.hideLoading();
            this.ui.showAlert('Failed to confirm payment. Please try again.', 'error');
        }
    }

    async logout() {
        try {
            await this.authService.logout();
            window.location.href = 'index.html';
        } catch (error) {
            this.ui.showAlert('Logout failed', 'error');
        }
    }
}

// Make orderPage globally available for onclick handlers
let orderPage;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    orderPage = new OrderPage();
});

// Global functions for onclick handlers
window.orderPage = {
    addService: (serviceId) => orderPage.addService(serviceId),
    removeService: (serviceId) => orderPage.removeService(serviceId),
    updateServiceQuantity: (serviceId, qty) => orderPage.updateServiceQuantity(serviceId, qty)
};


