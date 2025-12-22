// Admin Services Controller - MVC Pattern
import { AuthService } from '../../services/auth.js';
import { AdminServicesService } from '../../models/AdminServicesService.js';
import { AdminServicesView } from '../../views/admin/AdminServicesView.js';

export class AdminServicesController {
    constructor() {
        this.authService = new AuthService();
        this.adminServicesService = new AdminServicesService();
        this.view = new AdminServicesView();
        
        this.services = [];
        this.editingService = null;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadServices();
    }

    async checkAuth() {
        try {
            // Check localStorage first (more reliable after redirect)
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user && user.role === 'ADMIN') {
                    this.view.showUserNav(user);
                    return;
                }
            }
            
            // Fallback to API call
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'ADMIN') {
                // Update localStorage with fresh data
                localStorage.setItem('userInfo', JSON.stringify(user));
                this.view.showUserNav(user);
            } else {
                // Redirect to admin login page
                this.view.redirect('login.html');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user && user.role === 'ADMIN') {
                    this.view.showUserNav(user);
                } else {
                    // Redirect to admin login page
                    this.view.redirect('login.html');
                }
            } else {
                // Redirect to admin login page
                this.view.redirect('login.html');
            }
        }
    }

    async loadServices() {
        try {
            this.view.showLoading();
            
            // Fetch services from API
            this.services = await this.adminServicesService.getAllServices();
            
            this.view.renderServices(this.services);
        } catch (error) {
            console.error('Load services error:', error);
            this.view.showAlert(error.message || 'Failed to load services', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    showServiceModal(service = null) {
        this.editingService = service;
        this.view.showServiceModal(service);
    }

    async saveService() {
        try {
            const serviceData = this.view.getServiceFormData();
            if (!serviceData) return;

            // Validate required fields
            if (!serviceData.name || !serviceData.base_price || !serviceData.unit) {
                this.view.showAlert('Please fill in all required fields', 'error');
                return;
            }

            this.view.showLoading();

            const processedData = {
                name: serviceData.name.trim(),
                description: serviceData.description ? serviceData.description.trim() : null,
                base_price: parseFloat(serviceData.base_price),
                unit: serviceData.unit.trim()
            };

            if (this.editingService) {
                // Update existing service
                await this.adminServicesService.updateService(this.editingService.id, processedData);
                this.view.showAlert('Service updated successfully', 'success');
            } else {
                // Create new service
                const newService = await this.adminServicesService.createService(processedData);
                this.view.showAlert('Service added successfully', 'success');
            }

            // Reload services from API
            await this.loadServices();
            this.view.hideServiceModal();
        } catch (error) {
            console.error('Save service error:', error);
            this.view.showAlert(error.message || 'Failed to save service', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    editService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            this.showServiceModal(service);
        }
    }

    async deleteService(serviceId) {
        if (!confirm('Are you sure you want to delete this service?')) {
            return;
        }

        try {
            this.view.showLoading();
            
            await this.adminServicesService.deleteService(serviceId);
            
            // Reload services from API
            await this.loadServices();
            this.view.showAlert('Service deleted successfully', 'success');
        } catch (error) {
            console.error('Delete service error:', error);
            this.view.showAlert(error.message || 'Failed to delete service', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onAddService: () => this.showServiceModal(),
            onSaveService: () => this.saveService(),
            onLogout: () => this.logout()
        });
    }

    async logout() {
        try {
            await this.authService.logout();
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminInfo');
            // Redirect to landing page
            window.location.href = '../../index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Clear localStorage even if API call fails
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminInfo');
            // Redirect to landing page
            window.location.href = '../../index.html';
        }
    }
}

let adminServicesController;

document.addEventListener('DOMContentLoaded', () => {
    adminServicesController = new AdminServicesController();
    window.adminServicesController = adminServicesController;
});






