// Admin Auth Controller
import { AdminAuthService } from '../../models/AdminAuthService.js';

export class AdminAuthController {
    constructor() {
        this.adminAuthService = new AdminAuthService();
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        if (!email || !password) {
            this.showAlert('Please fill in all fields', 'error');
            return;
        }

        try {
            this.showLoading();

            const result = await this.adminAuthService.loginAdmin(email, password);

            if (result.ok) {
                // Save user info (admin is stored as user with role ADMIN)
                if (result.data.admin) {
                    localStorage.setItem('userInfo', JSON.stringify(result.data.admin));
                } else if (result.data.user) {
                    localStorage.setItem('userInfo', JSON.stringify(result.data.user));
                }
                
                if (result.data.token) {
                    localStorage.setItem('authToken', result.data.token);
                }

                this.showAlert('Login successful!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                this.showAlert(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Login failed. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showAlert(message, type = 'info') {
        // Simple alert implementation
        alert(message);
    }

    showLoading() {
        const submitBtn = document.querySelector('#adminLoginForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';
        }
    }

    hideLoading() {
        const submitBtn = document.querySelector('#adminLoginForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    }
}

let adminAuthController;

document.addEventListener('DOMContentLoaded', () => {
    adminAuthController = new AdminAuthController();
});

