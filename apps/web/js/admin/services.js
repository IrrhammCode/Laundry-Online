// Admin Services Module
import { AuthService } from '../services/auth.js';
import { UI } from '../utils/ui.js';

class AdminServices {
    constructor() {
        this.authService = new AuthService();
        this.ui = new UI();
        
        this.services = [];
        this.editingService = null;
        
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuth();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load services
        await this.loadServices();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'ADMIN') {
                this.ui.showUserNav(user);
            } else {
                // Try localStorage fallback
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    if (user.role === 'ADMIN') {
                        this.ui.showUserNav(user);
                    } else {
                        alert('Access Denied! Admin access required.');
                        window.location.href = 'login.html';
                    }
                } else {
                    window.location.href = 'login.html';
                }
            }
        } catch (error) {
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user.role === 'ADMIN') {
                    this.ui.showUserNav(user);
                } else {
                    alert('Access Denied! Admin access required.');
                    window.location.href = 'login.html';
                }
            } else {
                window.location.href = 'login.html';
            }
        }
    }

    setupEventListeners() {
        // Add service button
        document.getElementById('addServiceBtn').addEventListener('click', () => {
            this.showServiceModal();
        });

        // Modal close
        document.getElementById('serviceModalClose').addEventListener('click', () => {
            this.ui.hideModal('serviceModal');
        });

        document.getElementById('cancelService').addEventListener('click', () => {
            this.ui.hideModal('serviceModal');
        });

        // Service form
        document.getElementById('serviceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveService();
        });
    }

    async loadServices() {
        try {
            this.ui.showLoading();
            
            // Mock services data
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

            this.renderServices();
            
        } catch (error) {
            this.ui.showAlert('Failed to load services', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    renderServices() {
        const tbody = document.getElementById('servicesTableBody');
        tbody.innerHTML = '';

        this.services.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.name}</td>
                <td>${service.description}</td>
                <td>Rp ${service.price.toLocaleString()}</td>
                <td>${service.duration} hours</td>
                <td><span class="status status-${service.status.toLowerCase()}">${service.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminServices.editService(${service.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="adminServices.deleteService(${service.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    showServiceModal(service = null) {
        this.editingService = service;
        const modal = document.getElementById('serviceModal');
        const title = document.getElementById('serviceModalTitle');
        const form = document.getElementById('serviceForm');

        if (service) {
            title.textContent = 'Edit Service';
            form.name.value = service.name;
            form.description.value = service.description;
            form.price.value = service.price;
            form.duration.value = service.duration;
            form.status.value = service.status;
        } else {
            title.textContent = 'Add New Service';
            form.reset();
        }

        this.ui.showModal('serviceModal');
    }

    saveService() {
        const form = document.getElementById('serviceForm');
        const formData = new FormData(form);
        
        const serviceData = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseInt(formData.get('price')),
            duration: parseInt(formData.get('duration')),
            status: formData.get('status')
        };

        if (this.editingService) {
            // Update existing service
            const index = this.services.findIndex(s => s.id === this.editingService.id);
            this.services[index] = { ...this.editingService, ...serviceData };
            this.ui.showAlert('Service updated successfully', 'success');
        } else {
            // Add new service
            const newService = {
                id: this.services.length + 1,
                ...serviceData
            };
            this.services.push(newService);
            this.ui.showAlert('Service added successfully', 'success');
        }

        this.renderServices();
        this.ui.hideModal('serviceModal');
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
            this.renderServices();
            this.ui.showAlert('Service deleted successfully', 'success');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminServices = new AdminServices();
});







