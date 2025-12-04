// Profile Page Module
import { AuthService } from './services/auth.js';
import { UI } from './utils/ui.js';

class ProfilePage {
    constructor() {
        this.authService = new AuthService();
        this.ui = new UI();
        
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuth();
        
        // Load user profile
        await this.loadProfile();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user) {
                this.currentUser = user;
                this.ui.showUserNav(user);
            } else {
                // Try localStorage fallback
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    this.currentUser = user;
                    this.ui.showUserNav(user);
                } else {
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                this.currentUser = user;
                this.ui.showUserNav(user);
            } else {
                window.location.href = 'index.html';
            }
        }
    }

    async loadProfile() {
        try {
            const user = await this.authService.getCurrentUser();
            this.currentUser = user;
            
            // Populate form fields
            document.getElementById('profileName').textContent = user.name;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profileNameInput').value = user.name;
            document.getElementById('profileEmailInput').value = user.email;
            document.getElementById('profilePhoneInput').value = user.phone || '';
            document.getElementById('profileAddressInput').value = user.address || '';
        } catch (error) {
            this.ui.showAlert('Failed to load profile', 'error');
        }
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            this.handleProfileUpdate(e);
        });

        // Cancel button
        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.loadProfile(); // Reset form
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Validate password fields if any are filled
        if (data.newPassword || data.currentPassword || data.confirmPassword) {
            if (!data.currentPassword) {
                this.ui.showAlert('Current password is required to change password', 'error');
                return;
            }

            if (!data.newPassword) {
                this.ui.showAlert('New password is required', 'error');
                return;
            }

            if (data.newPassword !== data.confirmPassword) {
                this.ui.showAlert('New passwords do not match', 'error');
                return;
            }

            if (data.newPassword.length < 6) {
                this.ui.showAlert('New password must be at least 6 characters', 'error');
                return;
            }
        }

        try {
            this.ui.showLoading();
            
            // Update profile
            const updateData = {
                name: data.name,
                phone: data.phone,
                address: data.address
            };

            // If password change is requested
            if (data.newPassword) {
                updateData.currentPassword = data.currentPassword;
                updateData.newPassword = data.newPassword;
            }

            const result = await this.updateProfile(updateData);
            
            if (result.ok) {
                this.ui.showAlert('Profile updated successfully!', 'success');
                await this.loadProfile();
                this.ui.resetForm('profileForm');
            } else {
                this.ui.showAlert(result.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            this.ui.showAlert('Failed to update profile. Please try again.', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async updateProfile(data) {
        // This would be implemented in the AuthService
        // For now, we'll simulate the API call
        try {
            const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await this.authService.logout();
            window.location.href = 'index.html';
        } catch (error) {
            this.ui.showAlert('Logout failed', 'error');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfilePage();
});


