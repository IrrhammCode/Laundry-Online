// Admin Login Controller - MVC Pattern (Sesuai DPPL)
import { AdminAuthService } from '../../models/AdminAuthService.js';
import { AdminLoginView } from '../../views/admin/AdminLoginView.js';

export class AdminLoginController {
    constructor() {
        // Model layer - Sesuai DPPL
        this.adminAuthService = new AdminAuthService();
        this.view = new AdminLoginView();
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const admin = this.adminAuthService.getCurrentAdmin();
            if (admin && admin.role === 'ADMIN') {
                this.view.redirect('dashboard.html');
            }
        } catch (error) {
            // Not authenticated, stay on login page
        }
    }

    /**
     * Handle login menggunakan AdminAuthService.loginAdmin() sesuai Algoritma #11 DPPL
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const data = this.view.getFormData();
        if (!data) return;

        try {
            this.view.showLoading();
            
            // Menggunakan AdminAuthService.loginAdmin() sesuai DPPL Algoritma #11
            const result = await this.adminAuthService.loginAdmin(data.email, data.password);
            
            if (result.ok) {
                const admin = this.adminAuthService.getCurrentAdmin();
                if (admin && admin.role === 'ADMIN') {
                    this.view.hideLoading();
                    this.view.showAlert('Login successful!', 'success');
                    this.view.redirect('dashboard.html');
                } else {
                    this.view.hideLoading();
                    this.view.showAlert('Access denied. Admin privileges required.', 'error');
                    await this.adminAuthService.logout();
                }
            } else {
                this.view.hideLoading();
                this.view.showAlert(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.view.hideLoading();
            this.view.showAlert('Login failed. Please try again.', 'error');
        }
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onLogin: (e) => this.handleLogin(e)
        });
    }
}

let adminLoginController;

document.addEventListener('DOMContentLoaded', () => {
    adminLoginController = new AdminLoginController();
    window.adminLoginController = adminLoginController;
});






