// Complaint Controller - MVC Pattern
import { AuthService } from '../models/AuthService.js';
import { ComplaintService } from '../models/ComplaintService.js';
import { OrderService } from '../services/order.js';
import { UI } from '../utils/ui.js';

export class ComplaintController {
    constructor() {
        this.authService = new AuthService();
        this.complaintService = new ComplaintService();
        this.orderService = new OrderService();
        this.ui = new UI();
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadUserOrders();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (!user || user.role !== 'CUSTOMER') {
                this.ui.redirect('index.html');
                return;
            }
            this.ui.updateNavbarForRole(user);
        } catch (error) {
            console.error('Auth check error:', error);
            this.ui.redirect('index.html');
        }
    }

    async loadUserOrders() {
        try {
            const result = await this.orderService.getUserOrders(1, 100);
            if (result.ok) {
                const orders = result.data.orders || [];
                const orderSelect = document.getElementById('order_id');
                if (orderSelect) {
                    orders.forEach(order => {
                        const option = document.createElement('option');
                        option.value = order.id;
                        option.textContent = `Order #${order.id} - ${order.status} - Rp ${parseFloat(order.price_total || 0).toLocaleString('id-ID')}`;
                        orderSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Load user orders error:', error);
        }
    }

    setupEventListeners() {
        const form = document.getElementById('complaintForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = {
            subject: formData.get('subject'),
            message: formData.get('message'),
            order_id: formData.get('order_id') || null
        };

        if (!data.subject || !data.message) {
            this.ui.showAlert('Please fill in all required fields', 'error');
            return;
        }

        try {
            this.ui.showLoading();
            const result = await this.complaintService.submitComplaint(data);
            
            if (result.ok) {
                this.ui.showAlert('Complaint submitted successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'complaints.html';
                }, 1500);
            } else {
                this.ui.showAlert(result.error || 'Failed to submit complaint', 'error');
            }
        } catch (error) {
            console.error('Submit complaint error:', error);
            this.ui.showAlert('Failed to submit complaint. Please try again.', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }
}

let complaintController;

document.addEventListener('DOMContentLoaded', () => {
    complaintController = new ComplaintController();
});

