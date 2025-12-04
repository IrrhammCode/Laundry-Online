// Admin Services View - MVC Pattern
import { UI } from '../../utils/ui.js';

export class AdminServicesView {
    constructor() {
        this.ui = new UI();
        this.servicesTableBody = document.getElementById('servicesTableBody');
        this.serviceModal = document.getElementById('serviceModal');
        this.serviceModalTitle = document.getElementById('serviceModalTitle');
        this.serviceForm = document.getElementById('serviceForm');
    }

    renderServices(services) {
        if (!this.servicesTableBody) return;
        this.servicesTableBody.innerHTML = '';

        services.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${service.name}</td>
                <td>${service.description}</td>
                <td>Rp ${service.price.toLocaleString()}</td>
                <td>${service.duration} hours</td>
                <td><span class="status status-${service.status.toLowerCase()}">${service.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.adminServicesController.editService(${service.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="window.adminServicesController.deleteService(${service.id})">Delete</button>
                </td>
            `;
            this.servicesTableBody.appendChild(row);
        });
    }

    showServiceModal(service = null) {
        if (!this.serviceModal || !this.serviceModalTitle || !this.serviceForm) return;

        if (service) {
            this.serviceModalTitle.textContent = 'Edit Service';
            this.serviceForm.name.value = service.name;
            this.serviceForm.description.value = service.description;
            this.serviceForm.price.value = service.price;
            this.serviceForm.duration.value = service.duration;
            this.serviceForm.status.value = service.status;
        } else {
            this.serviceModalTitle.textContent = 'Add New Service';
            this.serviceForm.reset();
        }

        this.ui.showModal('serviceModal');
    }

    hideServiceModal() {
        this.ui.hideModal('serviceModal');
    }

    getServiceFormData() {
        if (!this.serviceForm) return null;
        const formData = new FormData(this.serviceForm);
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

    showUserNav(user) {
        this.ui.showUserNav(user);
    }

    setupEventListeners(callbacks) {
        const addServiceBtn = document.getElementById('addServiceBtn');
        if (addServiceBtn && callbacks.onAddService) {
            addServiceBtn.addEventListener('click', () => {
                callbacks.onAddService();
            });
        }

        const serviceModalClose = document.getElementById('serviceModalClose');
        if (serviceModalClose) {
            serviceModalClose.addEventListener('click', () => this.hideServiceModal());
        }

        const cancelService = document.getElementById('cancelService');
        if (cancelService) {
            cancelService.addEventListener('click', () => this.hideServiceModal());
        }

        if (this.serviceForm && callbacks.onSaveService) {
            this.serviceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                callbacks.onSaveService();
            });
        }
    }

    redirect(url) {
        window.location.href = url;
    }
}






