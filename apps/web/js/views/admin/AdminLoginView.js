// Admin Login View - MVC Pattern
import { UI } from '../../utils/ui.js';

export class AdminLoginView {
    constructor() {
        this.ui = new UI();
        this.loginForm = document.getElementById('adminLoginForm');
    }

    getFormData() {
        if (!this.loginForm) return null;
        const formData = new FormData(this.loginForm);
        return Object.fromEntries(formData);
    }

    showAlert(message, type = 'info') {
        this.ui.showAlert(message, type);
    }

    showLoading() {
        this.ui.showLoading();
    }

    hideLoading() {
        this.ui.hideLoading();
    }

    setupEventListeners(callbacks) {
        if (this.loginForm && callbacks.onLogin) {
            this.loginForm.addEventListener('submit', callbacks.onLogin);
        }
    }

    redirect(url) {
        window.location.href = url;
    }
}






