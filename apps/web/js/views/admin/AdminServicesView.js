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
        
        if (services.length === 0) {
            this.servicesTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-message">
                        <i class="fas fa-inbox"></i><br>
                        No services found. Click "Add New Service" to create one.
                    </td>
                </tr>
            `;
            return;
        }

        this.servicesTableBody.innerHTML = '';

        services.forEach(service => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${service.name || 'N/A'}</strong></td>
                <td>${service.description || '-'}</td>
                <td><span class="total-price">Rp ${parseFloat(service.base_price || 0).toLocaleString('id-ID')}</span></td>
                <td><span class="items-count">${service.unit || '-'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-primary" onclick="window.adminServicesController.editService(${service.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.adminServicesController.deleteService(${service.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            this.servicesTableBody.appendChild(row);
        });
    }

    showServiceModal(service = null) {
        if (!this.serviceModal || !this.serviceModalTitle || !this.serviceForm) return;

        if (service) {
            this.serviceModalTitle.textContent = 'Edit Service';
            this.serviceForm.name.value = service.name || '';
            this.serviceForm.description.value = service.description || '';
            this.serviceForm.base_price.value = service.base_price || '';
            this.serviceForm.unit.value = service.unit || '';
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

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && callbacks.onLogout) {
            logoutBtn.addEventListener('click', callbacks.onLogout);
        }
    }

    redirect(url) {
        window.location.href = url;
    }
}






