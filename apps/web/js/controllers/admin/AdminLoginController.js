// Admin Login Controller - MVC Pattern
import { AuthService } from '../../services/auth.js';
import { AdminLoginView } from '../../views/admin/AdminLoginView.js';

export class AdminLoginController {
    constructor() {
        this.authService = new AuthService();
        this.view = new AdminLoginView();
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'ADMIN') {
                this.view.redirect('dashboard.html');
            }
        } catch (error) {
            // Not authenticated, stay on login page
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const data = this.view.getFormData();
        if (!data) return;

        try {
            this.view.showLoading();
            const result = await this.authService.login(data.email, data.password);
            
            if (result.ok) {
                const user = await this.authService.getCurrentUser();
                if (user.role === 'ADMIN') {
                    this.view.hideLoading();
                    this.view.showAlert('Login successful!', 'success');
                    this.view.redirect('dashboard.html');
                } else {
                    this.view.hideLoading();
                    this.view.showAlert('Access denied. Admin privileges required.', 'error');
                    await this.authService.logout();
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



