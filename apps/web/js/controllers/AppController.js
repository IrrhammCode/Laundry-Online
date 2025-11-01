// App Controller - MVC Pattern
import { AuthService } from '../services/auth.js';
import { OrderService } from '../services/order.js';
import { ChatService } from '../services/chat.js';
import { AppView } from '../views/AppView.js';

export class AppController {
    constructor() {
        // Model layer
        this.authService = new AuthService();
        this.orderService = new OrderService();
        this.chatService = new ChatService();
        
        // View layer
        this.view = new AppView();
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadServices();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user) {
                this.view.showUserNav(user);
                this.view.hideAuthNav();
            } else {
                this.view.showAuthNav();
                this.view.hideUserNav();
            }
        } catch (error) {
            console.log('User not authenticated');
        }
    }

    async loadServices() {
        try {
            const services = await this.orderService.getServices();
            this.view.renderServices(services);
        } catch (error) {
            console.error('Failed to load services:', error);
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const data = this.view.getLoginFormData();
        if (!data) return;

        try {
            this.view.showLoading();
            const result = await this.authService.login(data.email, data.password);
            
            if (result.ok) {
                localStorage.setItem('userInfo', JSON.stringify(result.data.user));
                localStorage.setItem('authToken', result.data.token);
                
                this.view.hideLoginModal();
                this.view.showAlert('Login successful!', 'success');
                await this.checkAuth();
                this.view.resetForm('loginForm');
                
                setTimeout(() => {
                    this.view.redirect('dashboard.html');
                }, 1000);
            } else {
                this.view.showAlert(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.view.showAlert('Login failed. Please try again.', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const data = this.view.getRegisterFormData();
        if (!data) return;

        try {
            this.view.showLoading();
            const result = await this.authService.register(data);
            
            if (result.ok) {
                localStorage.setItem('userInfo', JSON.stringify(result.data.user));
                localStorage.setItem('authToken', result.data.token);
                
                this.view.hideRegisterModal();
                this.view.showAlert('Registration successful!', 'success');
                await this.checkAuth();
                this.view.resetForm('registerForm');
                
                setTimeout(() => {
                    this.view.redirect('dashboard.html');
                }, 1000);
            } else {
                this.view.showAlert(result.error || 'Registration failed', 'error');
            }
        } catch (error) {
            this.view.showAlert('Registration failed. Please try again.', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        
        const data = this.view.getForgotPasswordFormData();
        if (!data) return;

        try {
            this.view.showLoading();
            const result = await this.authService.forgotPassword(data.email);
            
            if (result.ok) {
                this.view.hideForgotPasswordModal();
                this.view.showAlert('Password reset link sent to your email!', 'success');
                this.view.resetForm('forgotPasswordForm');
            } else {
                this.view.showAlert(result.error || 'Failed to send reset link', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to send reset link. Please try again.', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    async logout() {
        try {
            await this.authService.logout();
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            this.view.showAuthNav();
            this.view.hideUserNav();
            this.view.showAlert('Logged out successfully', 'success');
        } catch (error) {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            this.view.showAlert('Logout failed', 'error');
        }
    }

    async resetRateLimit() {
        try {
            this.view.showAlert('Resetting rate limit...', 'info');
            const response = await fetch('http://localhost:3001/api/reset-rate-limit', {
                method: 'POST'
            });
            
            if (response.ok) {
                this.view.showAlert('Rate limit reset successfully! You can now try logging in again.', 'success');
            } else {
                this.view.showAlert('Failed to reset rate limit', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to reset rate limit', 'error');
        }
    }

    handleOrderNow() {
        this.authService.getCurrentUser().then(user => {
            if (user) {
                this.view.redirect('order.html');
            } else {
                this.view.showLoginModal();
            }
        }).catch(() => {
            this.view.showLoginModal();
        });
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onLogin: (e) => this.handleLogin(e),
            onRegister: (e) => this.handleRegister(e),
            onForgotPassword: (e) => this.handleForgotPassword(e),
            onResetRateLimit: () => this.resetRateLimit(),
            onOrderNow: () => this.handleOrderNow(),
            onLogout: () => this.logout()
        });
    }
}

let appController;

document.addEventListener('DOMContentLoaded', () => {
    appController = new AppController();
    window.appController = appController;
});



