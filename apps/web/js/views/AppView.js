// App View - MVC Pattern
// Handles all DOM manipulation for main App page
import { UI } from '../utils/ui.js';

export class AppView {
    constructor() {
        this.ui = new UI();
    }

    /**
     * Show login modal
     */
    showLoginModal() {
        this.ui.showModal('loginModal');
    }

    /**
     * Hide login modal
     */
    hideLoginModal() {
        this.ui.hideModal('loginModal');
    }

    /**
     * Show register modal
     */
    showRegisterModal() {
        this.ui.showModal('registerModal');
    }

    /**
     * Hide register modal
     */
    hideRegisterModal() {
        this.ui.hideModal('registerModal');
    }

    /**
     * Show forgot password modal
     */
    showForgotPasswordModal() {
        this.ui.showModal('forgotPasswordModal');
    }

    /**
     * Hide forgot password modal
     */
    hideForgotPasswordModal() {
        this.ui.hideModal('forgotPasswordModal');
    }

    /**
     * Render services list
     * @param {Array} services - Array of service objects
     */
    renderServices(services) {
        this.ui.renderServices(services);
    }

    /**
     * Get login form data
     * @returns {Object} - Login form data
     */
    getLoginFormData() {
        const form = document.getElementById('loginForm');
        if (!form) return null;

        const formData = new FormData(form);
        return Object.fromEntries(formData);
    }

    /**
     * Get register form data
     * @returns {Object} - Register form data
     */
    getRegisterFormData() {
        const form = document.getElementById('registerForm');
        if (!form) return null;

        const formData = new FormData(form);
        return Object.fromEntries(formData);
    }

    /**
     * Get forgot password form data
     * @returns {Object} - Forgot password form data
     */
    getForgotPasswordFormData() {
        const form = document.getElementById('forgotPasswordForm');
        if (!form) return null;

        const formData = new FormData(form);
        return { email: formData.get('email') };
    }

    /**
     * Reset form
     * @param {string} formId - Form ID
     */
    resetForm(formId) {
        this.ui.resetForm(formId);
    }

    /**
     * Show alert message
     */
    showAlert(message, type = 'info') {
        this.ui.showAlert(message, type);
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        this.ui.showLoading();
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.ui.hideLoading();
    }

    /**
     * Show user navigation
     * @param {Object} user - User object
     */
    showUserNav(user) {
        this.ui.showUserNav(user);
    }

    /**
     * Hide user navigation
     */
    hideUserNav() {
        this.ui.hideUserNav();
    }

    /**
     * Show auth navigation
     */
    showAuthNav() {
        this.ui.showAuthNav();
    }

    /**
     * Hide auth navigation
     */
    hideAuthNav() {
        this.ui.hideAuthNav();
    }

    /**
     * Toggle mobile navigation
     */
    toggleMobileNav() {
        this.ui.toggleMobileNav();
    }

    /**
     * Scroll to section
     * @param {string} sectionId - Section ID
     */
    scrollToSection(sectionId) {
        this.ui.scrollToSection(sectionId);
    }

    /**
     * Redirect to another page
     * @param {string} url - URL to redirect to
     */
    redirect(url) {
        window.location.href = url;
    }

    /**
     * Setup event listeners
     * @param {Object} callbacks - Object with callback functions
     */
    setupEventListeners(callbacks) {
        // Navigation buttons
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showRegisterModal());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && callbacks.onLogout) {
            logoutBtn.addEventListener('click', callbacks.onLogout);
        }

        // Modal close buttons
        const loginModalClose = document.getElementById('loginModalClose');
        if (loginModalClose) {
            loginModalClose.addEventListener('click', () => this.hideLoginModal());
        }

        const registerModalClose = document.getElementById('registerModalClose');
        if (registerModalClose) {
            registerModalClose.addEventListener('click', () => this.hideRegisterModal());
        }

        const forgotPasswordModalClose = document.getElementById('forgotPasswordModalClose');
        if (forgotPasswordModalClose) {
            forgotPasswordModalClose.addEventListener('click', () => this.hideForgotPasswordModal());
        }

        // Forms
        const loginForm = document.getElementById('loginForm');
        if (loginForm && callbacks.onLogin) {
            loginForm.addEventListener('submit', callbacks.onLogin);
        }

        const registerForm = document.getElementById('registerForm');
        if (registerForm && callbacks.onRegister) {
            registerForm.addEventListener('submit', callbacks.onRegister);
        }

        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm && callbacks.onForgotPassword) {
            forgotPasswordForm.addEventListener('submit', callbacks.onForgotPassword);
        }

        // Reset rate limit button
        const resetRateLimitBtn = document.getElementById('resetRateLimitBtn');
        if (resetRateLimitBtn && callbacks.onResetRateLimit) {
            resetRateLimitBtn.addEventListener('click', callbacks.onResetRateLimit);
        }

        // Forgot password link
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideLoginModal();
                this.showForgotPasswordModal();
            });
        }

        // Order now button
        const orderNowBtn = document.getElementById('orderNowBtn');
        if (orderNowBtn && callbacks.onOrderNow) {
            orderNowBtn.addEventListener('click', callbacks.onOrderNow);
        }

        // Mobile navigation toggle
        const navToggle = document.getElementById('navToggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => this.toggleMobileNav());
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    this.scrollToSection(href);
                }
            });
        });
    }
}



