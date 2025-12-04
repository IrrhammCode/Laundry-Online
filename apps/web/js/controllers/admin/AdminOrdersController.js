// Admin Orders Controller - MVC Pattern (Sesuai DPPL)
import { AdminAuthService } from '../../models/AdminAuthService.js';
import { AdminPesananService } from '../../models/AdminPesananService.js';
import { StatusLaundry } from '../../models/StatusLaundry.js';
import { AdminOrdersView } from '../../views/admin/AdminOrdersView.js';

export class AdminOrdersController {
    constructor() {
        // Model layer - Sesuai DPPL
        this.adminAuthService = new AdminAuthService();
        this.adminPesananService = new AdminPesananService();
        this.statusLaundry = new StatusLaundry();
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
            const admin = this.adminAuthService.getCurrentAdmin();
            if (admin && admin.role === 'ADMIN') {
                this.view.showUserNav(admin);
            } else {
                alert('Access Denied! Admin access required.');
                this.view.redirect('login.html');
            }
        } catch (error) {
            alert('Access Denied! Admin access required.');
            this.view.redirect('login.html');
        }
    }

    /**
     * Load orders menggunakan AdminPesananService.lihatSemuaPesanan() sesuai Algoritma #13 DPPL
     */
    async loadOrders() {
        try {
            this.view.showLoading();
            
            // Menggunakan AdminPesananService.lihatSemuaPesanan() sesuai DPPL Algoritma #13
            const result = await this.adminPesananService.lihatSemuaPesanan(
                this.currentPage,
                10,
                this.currentStatus
            );
            
            if (result.ok) {
                this.view.renderOrders(result.data.orders);
                this.view.updatePagination(result.data.pagination);
            } else {
                this.view.showAlert(result.error || 'Failed to load orders', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to load orders', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    /**
     * Update status menggunakan AdminPesananService.ubahStatusPesanan() sesuai Algoritma #15 DPPL
     * atau StatusLaundry.updateStatus()
     */
    async updateStatus(orderId, newStatus) {
        try {
            this.view.showLoading();
            
            // Menggunakan AdminPesananService.ubahStatusPesanan() sesuai DPPL Algoritma #15
            const result = await this.adminPesananService.ubahStatusPesanan(orderId, newStatus);
            
            if (result.ok) {
                this.view.showAlert('Order status updated successfully', 'success');
                this.loadOrders();
            } else {
                this.view.showAlert(result.error || 'Failed to update order status', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to update order status', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    /**
     * View order detail menggunakan AdminPesananService.getDetailPesanan()
     */
    async viewOrder(orderId) {
        try {
            this.view.showLoading();
            
            // Menggunakan AdminPesananService.getDetailPesanan()
            const result = await this.adminPesananService.getDetailPesanan(orderId);
            
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






