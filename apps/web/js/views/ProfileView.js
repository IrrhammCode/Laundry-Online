// Profile View - MVC Pattern
// Handles all DOM manipulation for Profile page
import { UI } from '../utils/ui.js';

export class ProfileView {
    constructor() {
        this.ui = new UI();
        // Cache DOM elements
        this.profileName = document.getElementById('profileName');
        this.profileEmail = document.getElementById('profileEmail');
        this.profileNameInput = document.getElementById('profileNameInput');
        this.profileEmailInput = document.getElementById('profileEmailInput');
        this.profilePhoneInput = document.getElementById('profilePhoneInput');
        this.profileAddressInput = document.getElementById('profileAddressInput');
        this.profileForm = document.getElementById('profileForm');
    }

    /**
     * Render profile data
     * @param {Object} user - User object
     */
    renderProfile(user) {
        if (this.profileName) {
            this.profileName.textContent = user.name;
        }
        if (this.profileEmail) {
            this.profileEmail.textContent = user.email;
        }
        if (this.profileNameInput) {
            this.profileNameInput.value = user.name;
        }
        if (this.profileEmailInput) {
            this.profileEmailInput.value = user.email;
        }
        if (this.profilePhoneInput) {
            this.profilePhoneInput.value = user.phone || '';
        }
        if (this.profileAddressInput) {
            this.profileAddressInput.value = user.address || '';
        }
    }

    /**
     * Get form data
     * @returns {Object} - Form data object
     */
    getFormData() {
        if (!this.profileForm) return null;

        const formData = new FormData(this.profileForm);
        return Object.fromEntries(formData);
    }

    /**
     * Reset form
     */
    resetForm() {
        if (this.profileForm) {
            this.profileForm.reset();
        }
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
     * Setup event listeners
     * @param {Object} callbacks - Object with callback functions
     */
    setupEventListeners(callbacks) {
        // Form submission
        if (this.profileForm && callbacks.onProfileUpdate) {
            this.profileForm.addEventListener('submit', callbacks.onProfileUpdate);
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn && callbacks.onCancel) {
            cancelBtn.addEventListener('click', callbacks.onCancel);
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && callbacks.onLogout) {
            logoutBtn.addEventListener('click', callbacks.onLogout);
        }
    }

    /**
     * Redirect to another page
     * @param {string} url - URL to redirect to
     */
    redirect(url) {
        window.location.href = url;
    }
}






