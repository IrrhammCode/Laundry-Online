// Order Controller - MVC Pattern (Sesuai DPPL)
// Handles business logic and coordinates Model and View
import { AuthService } from '../models/AuthService.js';
import { LaundryService } from '../models/LaundryService.js';
import { PembayaranService } from '../models/PembayaranService.js';
import { OrderService } from '../services/order.js'; // Untuk getServices
import { OrderView } from '../views/OrderView.js';

export class OrderController {
    constructor() {
        // Model layer - Sesuai DPPL
        this.authService = new AuthService();
        this.laundryService = new LaundryService();
        this.pembayaranService = new PembayaranService();
        this.orderService = new OrderService(); // Untuk getServices
        
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
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    this.view.showUserNav(user);
                } else {
                    this.view.redirect('index.html');
                }
            }
        } catch (error) {
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
     * Menggunakan LaundryService.buatPesanan() sesuai Algoritma #1 DPPL
     */
    async handleOrderSubmit(e) {
        e.preventDefault();

        if (this.selectedItems.length === 0) {
            this.view.showAlert('Please select at least one service', 'error');
            return;
        }

        const formData = this.view.getFormData();
        if (!formData) return;

        // Get current user ID
        const user = await this.authService.getCurrentUser();
        if (!user) {
            this.view.showAlert('Please login first', 'error');
            return;
        }

        try {
            this.view.showLoading();
            
            // Menggunakan LaundryService.buatPesanan() sesuai DPPL Algoritma #1
            const result = await this.laundryService.buatPesanan(
                user.id,
                this.selectedItems,
                formData.pickup_method,
                formData.notes
            );
            
            if (result.ok) {
                this.view.hideLoading();
                this.currentOrderId = result.data.orderId;
                
                // Get order detail untuk payment modal
                const orderDetail = await this.orderService.getOrderDetail(result.data.orderId);
                if (orderDetail.ok) {
                    this.view.showPaymentModal(orderDetail.data.order);
                } else {
                    this.view.showAlert('Order created but failed to load details', 'error');
                }
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
     * Menggunakan PembayaranService.konfirmasiPembayaran() sesuai Algoritma #7 DPPL
     */
    async handlePaymentSubmit(e) {
        e.preventDefault();

        const paymentData = this.view.getPaymentFormData();
        if (!paymentData || !this.currentOrderId) return;

        try {
            this.view.showLoading();
            
            // Menggunakan PembayaranService.konfirmasiPembayaran() sesuai DPPL Algoritma #7
            const result = await this.pembayaranService.konfirmasiPembayaran(
                this.currentOrderId,
                paymentData.method,
                paymentData.proof || null
            );
            
            if (result.ok) {
                this.view.hideLoading();
                this.view.hidePaymentModal();
                this.view.showAlert('Order created and payment confirmed successfully!', 'success');
                
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
let orderController;

document.addEventListener('DOMContentLoaded', () => {
    orderController = new OrderController();
    
    // Make globally available for onclick handlers
    window.orderController = orderController;
});






