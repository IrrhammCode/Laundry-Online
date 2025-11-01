// Order Presenter - MVP Pattern
// Handles business logic for Order page
import { AuthService } from '../services/auth.js';
import { OrderService } from '../services/order.js';
import { OrderView } from '../views/OrderView.js';

export class OrderPresenter {
    constructor() {
        // Model layer
        this.authService = new AuthService();
        this.orderService = new OrderService();
        
        // View layer
        this.view = new OrderView();
        
        // Business state
        this.services = [];
        this.selectedItems = [];
        this.pickupFee = 0;
        this.currentOrderId = null;
        
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
                this.view.showUserNav(user);
            } else {
                // Try localStorage fallback
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    this.view.showUserNav(user);
                } else {
                    this.view.redirect('index.html');
                }
            }
        } catch (error) {
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                this.view.showUserNav(user);
            } else {
                this.view.redirect('index.html');
            }
        }
    }

    async loadServices() {
        try {
            this.services = await this.orderService.getServices();
            this.view.renderServices(this.services);
        } catch (error) {
            this.view.showAlert('Failed to load services', 'error');
        }
    }

    /**
     * Business Logic: Add service to order
     */
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

        this.updateView();
    }

    /**
     * Business Logic: Remove service from order
     */
    removeService(serviceId) {
        this.selectedItems = this.selectedItems.filter(item => item.service_id !== serviceId);
        this.updateView();
    }

    /**
     * Business Logic: Update service quantity
     */
    updateServiceQuantity(serviceId, qty) {
        const item = this.selectedItems.find(item => item.service_id === serviceId);
        if (item) {
            if (qty <= 0) {
                this.removeService(serviceId);
            } else {
                item.qty = qty;
                this.updateView();
            }
        }
    }

    /**
     * Update view based on current state
     */
    updateView() {
        // Business Logic: Calculate totals
        const servicesTotal = this.selectedItems.reduce((total, item) => 
            total + (item.unit_price * item.qty), 0);
        
        // Business Logic: Calculate pickup fee
        const pickupMethod = this.view.getPickupMethod();
        this.pickupFee = pickupMethod === 'PICKUP' ? 5000 : 0;
        
        const total = servicesTotal + this.pickupFee;

        // Update View
        this.view.renderOrderItems(this.selectedItems);
        this.view.updateOrderSummary(servicesTotal, this.pickupFee, total);
    }

    /**
     * Setup event listeners - delegates to view
     */
    setupEventListeners() {
        this.view.setupEventListeners({
            onOrderSubmit: (e) => this.handleOrderSubmit(e),
            onPaymentSubmit: (e) => this.handlePaymentSubmit(e),
            onPickupMethodChange: () => this.updateView(),
            onLogout: () => this.logout()
        });
    }

    /**
     * Business Logic: Handle order submission
     */
    async handleOrderSubmit(e) {
        e.preventDefault();

        if (this.selectedItems.length === 0) {
            this.view.showAlert('Please select at least one service', 'error');
            return;
        }

        const formData = this.view.getFormData();
        if (!formData) return;

        const orderData = {
            pickup_method: formData.pickup_method,
            items: this.selectedItems,
            notes: formData.notes
        };

        console.log('Order data:', orderData);

        try {
            this.view.showLoading();
            const result = await this.orderService.createOrder(orderData);
            
            if (result.ok) {
                this.view.hideLoading();
                this.currentOrderId = result.data.order.id;
                this.view.showPaymentModal(result.data.order);
            } else {
                this.view.hideLoading();
                this.view.showAlert(result.error || 'Failed to create order', 'error');
            }
        } catch (error) {
            this.view.hideLoading();
            this.view.showAlert('Failed to create order. Please try again.', 'error');
        }
    }

    /**
     * Business Logic: Handle payment submission
     */
    async handlePaymentSubmit(e) {
        e.preventDefault();

        const paymentData = this.view.getPaymentFormData();
        if (!paymentData || !this.currentOrderId) return;

        try {
            this.view.showLoading();
            const result = await this.orderService.confirmPayment(this.currentOrderId, paymentData);
            
            if (result.ok) {
                this.view.hideLoading();
                this.view.hidePaymentModal();
                this.view.showAlert('Order created and payment confirmed successfully!', 'success');
                
                // Redirect to history page
                setTimeout(() => {
                    this.view.redirect('history.html');
                }, 2000);
            } else {
                this.view.hideLoading();
                this.view.showAlert(result.error || 'Failed to confirm payment', 'error');
            }
        } catch (error) {
            this.view.hideLoading();
            this.view.showAlert('Failed to confirm payment. Please try again.', 'error');
        }
    }

    /**
     * Business Logic: Logout
     */
    async logout() {
        try {
            await this.authService.logout();
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            this.view.redirect('index.html');
        } catch (error) {
            this.view.showAlert('Logout failed', 'error');
        }
    }
}

// Initialize when DOM is loaded
let orderPresenter;

document.addEventListener('DOMContentLoaded', () => {
    orderPresenter = new OrderPresenter();
    
    // Make globally available for onclick handlers
    window.orderPresenter = orderPresenter;
});



