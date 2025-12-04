// Admin Login Module
import { AuthService } from '../services/auth.js';
import { UI } from '../utils/ui.js';

class AdminLogin {
    constructor() {
        this.authService = new AuthService();
        this.ui = new UI();
        
        this.init();
    }

    async init() {
        // Check if already logged in
        await this.checkAuth();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'ADMIN') {
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            // Not authenticated, stay on login page
        }
    }

    setupEventListeners() {
        document.getElementById('adminLoginForm')?.addEventListener('submit', (e) => {
            this.handleLogin(e);
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            this.ui.showLoading();
            const result = await this.authService.login(data.email, data.password);
            
            if (result.ok) {
                // Check if user is admin
                const user = await this.authService.getCurrentUser();
                if (user.role === 'ADMIN') {
                    this.ui.hideLoading();
                    this.ui.showAlert('Login successful!', 'success');
                    window.location.href = 'dashboard.html';
                } else {
                    this.ui.hideLoading();
                    this.ui.showAlert('Access denied. Admin privileges required.', 'error');
                    await this.authService.logout();
                }
            } else {
                this.ui.hideLoading();
                this.ui.showAlert(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.ui.hideLoading();
            this.ui.showAlert('Login failed. Please try again.', 'error');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminLogin();
});












