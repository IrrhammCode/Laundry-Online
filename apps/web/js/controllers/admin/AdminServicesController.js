// Admin Services Controller - MVC Pattern
import { AuthService } from '../../services/auth.js';
import { AdminServicesView } from '../../views/admin/AdminServicesView.js';

export class AdminServicesController {
    constructor() {
        this.authService = new AuthService();
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
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'ADMIN') {
                this.view.showUserNav(user);
            } else {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    if (user.role === 'ADMIN') {
                        this.view.showUserNav(user);
                    } else {
                        alert('Access Denied! Admin access required.');
                        this.view.redirect('login.html');
                    }
                } else {
                    this.view.redirect('login.html');
                }
            }
        } catch (error) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user.role === 'ADMIN') {
                    this.view.showUserNav(user);
                } else {
                    alert('Access Denied! Admin access required.');
                    this.view.redirect('login.html');
                }
            } else {
                this.view.redirect('login.html');
            }
        }
    }

    async loadServices() {
        try {
            this.view.showLoading();
            
            // Mock services data (in real app, fetch from API)
            this.services = [
                {
                    id: 1,
                    name: 'Regular Wash',
                    description: 'Standard washing service for everyday clothes',
                    price: 15000,
                    duration: 24,
                    status: 'ACTIVE'
                },
                {
                    id: 2,
                    name: 'Dry Clean',
                    description: 'Professional dry cleaning for delicate fabrics',
                    price: 25000,
                    duration: 48,
                    status: 'ACTIVE'
                },
                {
                    id: 3,
                    name: 'Express Wash',
                    description: 'Fast washing service (same day)',
                    price: 20000,
                    duration: 6,
                    status: 'ACTIVE'
                }
            ];

            this.view.renderServices(this.services);
        } catch (error) {
            this.view.showAlert('Failed to load services', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    showServiceModal(service = null) {
        this.editingService = service;
        this.view.showServiceModal(service);
    }

    saveService() {
        const serviceData = this.view.getServiceFormData();
        if (!serviceData) return;

        const processedData = {
            name: serviceData.name,
            description: serviceData.description,
            price: parseInt(serviceData.price),
            duration: parseInt(serviceData.duration),
            status: serviceData.status
        };

        if (this.editingService) {
            const index = this.services.findIndex(s => s.id === this.editingService.id);
            this.services[index] = { ...this.editingService, ...processedData };
            this.view.showAlert('Service updated successfully', 'success');
        } else {
            const newService = {
                id: this.services.length + 1,
                ...processedData
            };
            this.services.push(newService);
            this.view.showAlert('Service added successfully', 'success');
        }

        this.view.renderServices(this.services);
        this.view.hideServiceModal();
    }

    editService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (service) {
            this.showServiceModal(service);
        }
    }

    deleteService(serviceId) {
        if (confirm('Are you sure you want to delete this service?')) {
            this.services = this.services.filter(s => s.id !== serviceId);
            this.view.renderServices(this.services);
            this.view.showAlert('Service deleted successfully', 'success');
        }
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onAddService: () => this.showServiceModal(),
            onSaveService: () => this.saveService()
        });
    }
}

let adminServicesController;

document.addEventListener('DOMContentLoaded', () => {
    adminServicesController = new AdminServicesController();
    window.adminServicesController = adminServicesController;
});



