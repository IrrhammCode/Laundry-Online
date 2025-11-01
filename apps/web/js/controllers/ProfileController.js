// Profile Controller - MVC Pattern
import { AuthService } from '../services/auth.js';
import { ProfileView } from '../views/ProfileView.js';

export class ProfileController {
    constructor() {
        // Model layer
        this.authService = new AuthService();
        
        // View layer
        this.view = new ProfileView();
        
        // Business state
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadProfile();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user) {
                this.currentUser = user;
                this.view.showUserNav(user);
            } else {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    this.currentUser = JSON.parse(userInfo);
                    this.view.showUserNav(this.currentUser);
                } else {
                    this.view.redirect('index.html');
                }
            }
        } catch (error) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                this.currentUser = JSON.parse(userInfo);
                this.view.showUserNav(this.currentUser);
            } else {
                this.view.redirect('index.html');
            }
        }
    }

    async loadProfile() {
        try {
            const user = await this.authService.getCurrentUser();
            this.currentUser = user;
            this.view.renderProfile(user);
        } catch (error) {
            this.view.showAlert('Failed to load profile', 'error');
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        const data = this.view.getFormData();
        if (!data) return;

        // Business Logic: Validate password fields
        if (data.newPassword || data.currentPassword || data.confirmPassword) {
            if (!data.currentPassword) {
                this.view.showAlert('Current password is required to change password', 'error');
                return;
            }

            if (!data.newPassword) {
                this.view.showAlert('New password is required', 'error');
                return;
            }

            if (data.newPassword !== data.confirmPassword) {
                this.view.showAlert('New passwords do not match', 'error');
                return;
            }

            if (data.newPassword.length < 6) {
                this.view.showAlert('New password must be at least 6 characters', 'error');
                return;
            }
        }

        try {
            this.view.showLoading();
            
            // Business Logic: Prepare update data
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
                this.view.showAlert('Profile updated successfully!', 'success');
                await this.loadProfile();
                this.view.resetForm();
            } else {
                this.view.showAlert(result.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to update profile. Please try again.', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    async updateProfile(data) {
        try {
            const response = await fetch('http://localhost:3001/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            return await response.json();
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onProfileUpdate: (e) => this.handleProfileUpdate(e),
            onCancel: () => this.loadProfile(),
            onLogout: () => this.logout()
        });
    }

    async logout() {
        try {
            await this.authService.logout();
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            this.view.redirect('index.html');
        } catch (error) {
            this.view.showAlert('Logout failed', 'error');
        }
    }
}

let profileController;

document.addEventListener('DOMContentLoaded', () => {
    profileController = new ProfileController();
    window.profileController = profileController;
});



