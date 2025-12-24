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
     * Get reset password form data
     * @returns {Object} - Reset password form data
     */
    getResetPasswordFormData() {
        const form = document.getElementById('resetPasswordForm');
        if (!form) return null;

        const formData = new FormData(form);
        return {
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
    }

    /**
     * Show reset password form (step 2) and hide email form (step 1)
     * @param {string} email - Verified email
     */
    showResetPasswordForm(email) {
        const emailForm = document.getElementById('forgotPasswordForm');
        const resetForm = document.getElementById('resetPasswordForm');
        const resetEmailInput = document.getElementById('resetEmail');
        const title = document.getElementById('forgotPasswordTitle');

        if (emailForm) emailForm.style.display = 'none';
        if (resetForm) resetForm.style.display = 'block';
        if (resetEmailInput) resetEmailInput.value = email;
        if (title) title.textContent = 'Reset Password';
    }

    /**
     * Reset forgot password modal to step 1
     */
    resetForgotPasswordModal() {
        const emailForm = document.getElementById('forgotPasswordForm');
        const resetForm = document.getElementById('resetPasswordForm');
        const title = document.getElementById('forgotPasswordTitle');

        if (emailForm) emailForm.style.display = 'block';
        if (resetForm) resetForm.style.display = 'none';
        if (title) title.textContent = 'Forgot Password';
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
     * Update notification badge count
     * @param {number} count - Unread notification count
     */
    updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    /**
     * Render notifications list
     * @param {Array} notifications - Array of notification objects
     */
    renderNotifications(notifications) {
        const list = document.getElementById('notificationList');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = '<div class="notification-empty">No notifications</div>';
            return;
        }

        list.innerHTML = notifications.map(notif => {
            // Handle payload_json - could be string or object
            let payload = {};
            try {
                if (notif.payload_json) {
                    payload = typeof notif.payload_json === 'string' 
                        ? JSON.parse(notif.payload_json) 
                        : notif.payload_json;
                }
            } catch (e) {
                console.error('Failed to parse payload_json:', e);
                payload = {};
            }
            const isRead = notif.sent_at !== null;
            const orderId = notif.order_id || payload.orderId || '';
            
            return `
                <div class="notification-item ${isRead ? 'read' : 'unread'}" data-id="${notif.id}">
                    <div class="notification-icon">
                        <i class="fas fa-${this.getNotificationIcon(notif.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${this.getNotificationTitle(notif.type, payload)}</div>
                        <div class="notification-message">${this.getNotificationMessage(notif.type, payload)}</div>
                        <div class="notification-time">${this.formatNotificationTime(notif.created_at)}</div>
                    </div>
                    ${orderId ? `<a href="history.html" class="notification-link">View Order</a>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Get notification icon based on type
     */
    getNotificationIcon(type) {
        const icons = {
            'status_update': 'sync-alt',
            'payment_confirmed': 'check-circle',
            'order_created': 'shopping-cart',
            'message': 'comment'
        };
        return icons[type] || 'bell';
    }

    /**
     * Get notification title
     */
    getNotificationTitle(type, payload) {
        const titles = {
            'status_update': 'Order Status Updated',
            'payment_confirmed': 'Payment Confirmed',
            'order_created': 'Order Created',
            'message': 'New Message'
        };
        return titles[type] || 'Notification';
    }

    /**
     * Get notification message
     */
    getNotificationMessage(type, payload) {
        if (payload.isi_pesan) return payload.isi_pesan;
        if (payload.message) return payload.message;
        
        const messages = {
            'status_update': `Order #${payload.orderId || ''} status has been updated`,
            'payment_confirmed': `Payment for order #${payload.orderId || ''} has been confirmed`,
            'order_created': `Your order #${payload.orderId || ''} has been created`,
            'message': 'You have a new message'
        };
        return messages[type] || 'You have a new notification';
    }

    /**
     * Format notification time
     */
    formatNotificationTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    /**
     * Toggle notification dropdown
     */
    toggleNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    /**
     * Hide notification dropdown
     */
    hideNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
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
            forgotPasswordModalClose.addEventListener('click', () => {
                this.hideForgotPasswordModal();
                this.resetForgotPasswordModal();
            });
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

        // Validasi real-time untuk input phone (hanya angka)
        const phoneInput = document.getElementById('registerPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                // Hapus semua karakter non-angka
                e.target.value = e.target.value.replace(/\D/g, '');
            });

            phoneInput.addEventListener('blur', (e) => {
                const phone = e.target.value.trim();
                if (phone && phone !== '') {
                    // Validasi format nomor Indonesia
                    if (!/^08\d{8,11}$/.test(phone)) {
                        e.target.setCustomValidity('Format: 08xxxxxxxxxx (10-13 digit)');
                    } else {
                        e.target.setCustomValidity('');
                    }
                } else {
                    e.target.setCustomValidity('');
                }
            });
        }

        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm && callbacks.onForgotPassword) {
            forgotPasswordForm.addEventListener('submit', callbacks.onForgotPassword);
        }

        const resetPasswordForm = document.getElementById('resetPasswordForm');
        if (resetPasswordForm && callbacks.onResetPassword) {
            resetPasswordForm.addEventListener('submit', callbacks.onResetPassword);
        }

        const backToEmailBtn = document.getElementById('backToEmailBtn');
        if (backToEmailBtn) {
            backToEmailBtn.addEventListener('click', () => {
                this.resetForgotPasswordModal();
            });
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






