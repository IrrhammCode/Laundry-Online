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
        
        // Setup email form
        await this.setupEmailForm();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    async setupEmailForm() {
        // Get user email and display
        try {
            const user = await this.authService.getCurrentUser();
            if (user) {
                const registeredEmailDisplay = document.getElementById('registeredEmailDisplay');
                if (registeredEmailDisplay) {
                    registeredEmailDisplay.textContent = user.email || 'Not available';
                }
            } else {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    try {
                        const parsedUser = JSON.parse(userInfo);
                        const registeredEmailDisplay = document.getElementById('registeredEmailDisplay');
                        if (registeredEmailDisplay) {
                            registeredEmailDisplay.textContent = parsedUser.email || 'Not available';
                        }
                    } catch (e) {
                        console.error('Failed to parse user info:', e);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to get user email:', error);
        }

        // Toggle email input based on radio selection
        const emailOptions = document.querySelectorAll('input[name="email_option"]');
        const notificationEmailInput = document.getElementById('notificationEmail');
        
        emailOptions.forEach(option => {
            option.addEventListener('change', () => {
                if (notificationEmailInput) {
                    if (option.value === 'custom') {
                        notificationEmailInput.style.display = 'block';
                        notificationEmailInput.required = true;
                    } else {
                        notificationEmailInput.style.display = 'none';
                        notificationEmailInput.required = false;
                        notificationEmailInput.value = '';
                    }
                }
            });
        });
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user) {
                // Only CUSTOMER can access this page
                if (user.role !== 'CUSTOMER') {
                    if (user.role === 'ADMIN') {
                        this.view.redirect('admin/dashboard.html');
                    } else {
                        this.view.redirect('index.html');
                    }
                    return;
                }
                this.view.showUserNav(user);
            } else {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const parsedUser = JSON.parse(userInfo);
                    if (parsedUser.role !== 'CUSTOMER') {
                        if (parsedUser.role === 'ADMIN') {
                            this.view.redirect('admin/dashboard.html');
                        } else {
                            this.view.redirect('index.html');
                        }
                        return;
                    }
                    this.view.showUserNav(parsedUser);
                } else {
                    this.view.redirect('index.html');
                }
            }
        } catch (error) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const parsedUser = JSON.parse(userInfo);
                if (parsedUser.role !== 'CUSTOMER') {
                    if (parsedUser.role === 'ADMIN') {
                        this.view.redirect('admin/dashboard.html');
                    } else {
                        this.view.redirect('index.html');
                    }
                    return;
                }
                this.view.showUserNav(parsedUser);
            } else {
                this.view.redirect('index.html');
            }
        }
    }

    async loadServices() {
        try {
            this.services = await this.orderService.getServices();
            this.view.renderServices(this.services);
            
            // Load recommended packages
            await this.loadRecommendedPackages();
        } catch (error) {
            this.view.showAlert('Failed to load services', 'error');
        }
    }

    async loadRecommendedPackages() {
        try {
            const result = await this.orderService.getRecommendations();
            if (result.ok && result.data.packages && result.data.packages.length > 0) {
                this.view.renderRecommendedPackages(result.data.packages);
            }
        } catch (error) {
            console.error('Failed to load recommendations:', error);
            // Don't show error, just don't display recommendations
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
        if (!formData) {
            this.view.showAlert('Please fill in the form', 'error');
            return;
        }

        // Validate pickup_method
        if (!formData.pickup_method || !['PICKUP', 'SELF'].includes(formData.pickup_method)) {
            this.view.showAlert('Please select a pickup method', 'error');
            return;
        }

        // Get current user ID
        const user = await this.authService.getCurrentUser();
        if (!user) {
            this.view.showAlert('Please login first', 'error');
            return;
        }

        try {
            this.view.showLoading();
            
            console.log('Submitting order with:', {
                items: this.selectedItems,
                pickup_method: formData.pickup_method,
                notes: formData.notes,
                notification_email: formData.notification_email
            });
            
            // Menggunakan LaundryService.buatPesanan() sesuai DPPL Algoritma #1
            const result = await this.laundryService.buatPesanan(
                user.id,
                this.selectedItems,
                formData.pickup_method,
                formData.notes,
                formData.notification_email
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
                paymentData.proof || null,
                paymentData.amount // Pass amount from form
            );
            
            if (result.ok) {
                this.view.hideLoading();
                this.view.hidePaymentModal();
                
                // Get order detail for WhatsApp message
                const orderDetail = await this.orderService.getOrderDetail(this.currentOrderId);
                const order = orderDetail.data?.order;
                
                // Redirect to WhatsApp untuk kirim bukti
                const whatsappNumber = '6281234567890'; // Ganti dengan nomor WhatsApp admin yang sebenarnya
                const message = encodeURIComponent(
                    `Halo Admin, saya sudah melakukan pembayaran untuk order #${this.currentOrderId}.\n\n` +
                    `Detail Order:\n` +
                    `- Order ID: ${this.currentOrderId}\n` +
                    `- Total: Rp ${order?.price_total?.toLocaleString() || '0'}\n` +
                    `- Metode: ${paymentData.method}\n\n` +
                    `Saya akan mengirimkan bukti pembayaran melalui chat ini.`
                );
                const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
                
                this.view.showAlert('Pembayaran berhasil! Mengarahkan ke WhatsApp untuk kirim bukti...', 'success');
                
                setTimeout(() => {
                    window.open(whatsappUrl, '_blank');
                    // Redirect ke history setelah buka WhatsApp
                    setTimeout(() => {
                        this.view.redirect('history.html');
                    }, 1000);
                }, 1500);
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






