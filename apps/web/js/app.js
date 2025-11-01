// Main App Module
import { AuthService } from './services/auth.js';
import { OrderService } from './services/order.js';
import { ChatService } from './services/chat.js';
import { UI } from './utils/ui.js';

class App {
    constructor() {
        this.authService = new AuthService();
        this.orderService = new OrderService();
        this.chatService = new ChatService();
        this.ui = new UI();
        
        this.init();
    }

    async init() {
        // Check authentication status
        await this.checkAuth();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load services
        await this.loadServices();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user) {
                this.ui.showUserNav(user);
                this.ui.hideAuthNav();
            } else {
                this.ui.showAuthNav();
                this.ui.hideUserNav();
            }
        } catch (error) {
            console.log('User not authenticated');
        }
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.ui.showModal('loginModal');
        });

        document.getElementById('registerBtn')?.addEventListener('click', () => {
            this.ui.showModal('registerModal');
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Modal close buttons
        document.getElementById('loginModalClose')?.addEventListener('click', () => {
            this.ui.hideModal('loginModal');
        });

        document.getElementById('registerModalClose')?.addEventListener('click', () => {
            this.ui.hideModal('registerModal');
        });

        document.getElementById('forgotPasswordModalClose')?.addEventListener('click', () => {
            this.ui.hideModal('forgotPasswordModal');
        });

        // Forms
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            this.handleLogin(e);
        });

        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            this.handleRegister(e);
        });

        document.getElementById('forgotPasswordForm')?.addEventListener('submit', (e) => {
            this.handleForgotPassword(e);
        });

        // Reset rate limit button
        document.getElementById('resetRateLimitBtn')?.addEventListener('click', () => {
            this.resetRateLimit();
        });

        // Forgot password link
        document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.ui.hideModal('loginModal');
            this.ui.showModal('forgotPasswordModal');
        });

        // Order now button
        document.getElementById('orderNowBtn')?.addEventListener('click', () => {
            this.handleOrderNow();
        });

        // Mobile navigation toggle
        document.getElementById('navToggle')?.addEventListener('click', () => {
            this.ui.toggleMobileNav();
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    this.ui.scrollToSection(href);
                }
            });
        });
    }

    async loadServices() {
        try {
            const services = await this.orderService.getServices();
            this.ui.renderServices(services);
        } catch (error) {
            console.error('Failed to load services:', error);
            // Don't show error to user if they're not authenticated
            // Services will be loaded after login
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            this.ui.showLoading();
            const result = await this.authService.login(data.email, data.password);
            
            if (result.ok) {
                // Store user info and token in localStorage as backup
                localStorage.setItem('userInfo', JSON.stringify(result.data.user));
                localStorage.setItem('authToken', result.data.token);
                
                this.ui.hideModal('loginModal');
                this.ui.showAlert('Login successful!', 'success');
                await this.checkAuth();
                this.ui.resetForm('loginForm');
                // Redirect to dashboard after successful login
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                this.ui.showAlert(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.ui.showAlert('Login failed. Please try again.', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Debug: log the data being sent
        console.log('Registration data:', data);

        try {
            this.ui.showLoading();
            const result = await this.authService.register(data);
            
            if (result.ok) {
                // Store user info and token in localStorage as backup
                localStorage.setItem('userInfo', JSON.stringify(result.data.user));
                localStorage.setItem('authToken', result.data.token);
                
                this.ui.hideModal('registerModal');
                this.ui.showAlert('Registration successful!', 'success');
                await this.checkAuth();
                this.ui.resetForm('registerForm');
                // Redirect to dashboard after successful registration
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                console.error('Registration failed:', result);
                this.ui.showAlert(result.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.ui.showAlert('Registration failed. Please try again.', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email');

        try {
            this.ui.showLoading();
            const result = await this.authService.forgotPassword(email);
            
            if (result.ok) {
                this.ui.hideModal('forgotPasswordModal');
                this.ui.showAlert('Password reset link sent to your email!', 'success');
                this.ui.resetForm('forgotPasswordForm');
            } else {
                this.ui.showAlert(result.error || 'Failed to send reset link', 'error');
            }
        } catch (error) {
            this.ui.showAlert('Failed to send reset link. Please try again.', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async logout() {
        try {
            await this.authService.logout();
            // Clear localStorage
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            this.ui.showAuthNav();
            this.ui.hideUserNav();
            this.ui.showAlert('Logged out successfully', 'success');
        } catch (error) {
            // Clear localStorage anyway
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            this.ui.showAlert('Logout failed', 'error');
        }
    }

    async resetRateLimit() {
        try {
            this.ui.showAlert('Resetting rate limit...', 'info');
            const response = await fetch('http://localhost:3001/api/reset-rate-limit', {
                method: 'POST'
            });
            
            if (response.ok) {
                const result = await response.json();
                this.ui.showAlert('Rate limit reset successfully! You can now try logging in again.', 'success');
            } else {
                this.ui.showAlert('Failed to reset rate limit', 'error');
            }
        } catch (error) {
            console.error('Reset rate limit error:', error);
            this.ui.showAlert('Failed to reset rate limit', 'error');
        }
    }

    handleOrderNow() {
        // Check if user is logged in
        this.authService.getCurrentUser().then(user => {
            if (user) {
                // Redirect to order page
                window.location.href = 'order.html';
            } else {
                // Show login modal
                this.ui.showModal('loginModal');
            }
        }).catch(() => {
            this.ui.showModal('loginModal');
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});


