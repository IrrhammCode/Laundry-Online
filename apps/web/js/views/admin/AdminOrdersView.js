// Admin Orders View - MVC Pattern
import { UI } from '../../utils/ui.js';

export class AdminOrdersView {
    constructor() {
        this.ui = new UI();
        this.ordersTableBody = document.getElementById('ordersTableBody');
        this.orderDetailContent = document.getElementById('orderDetailContent');
        this.pageInfo = document.getElementById('pageInfo');
        this.prevPage = document.getElementById('prevPage');
        this.nextPage = document.getElementById('nextPage');
    }

    renderOrders(orders) {
        if (!this.ordersTableBody) return;
        this.ordersTableBody.innerHTML = '';

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>
                    <div>
                        <strong>${order.customer_name}</strong><br>
                        <small>${order.phone}</small>
                    </div>
                </td>
                <td>${this.getItemsCount(order)}</td>
                <td>Rp ${parseFloat(order.price_total).toLocaleString()}</td>
                <td><span class="status status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td>${this.formatDate(order.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.adminOrdersController.viewOrder(${order.id})">View</button>
                    ${this.getStatusButton(order.status, order.id)}
                </td>
            `;
            this.ordersTableBody.appendChild(row);
        });
    }

    getItemsCount(order) {
        // Check if items_count exists (from backend query)
        if (order.items_count !== undefined && order.items_count !== null) {
            return `${order.items_count} item(s)`;
        }
        // Check if items array exists
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
            return `${order.items.length} item(s)`;
        }
        // Check if order_items exists
        if (order.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
            return `${order.order_items.length} item(s)`;
        }
        // Default fallback
        return '0 item(s)';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    getStatusButton(currentStatus, orderId) {
        const statusButtons = {
            'DIPESAN': `<button class="btn btn-sm btn-success" onclick="window.adminOrdersController.updateStatus(${orderId}, 'DIJEMPUT')">Pickup</button>`,
            'DIJEMPUT': `<button class="btn btn-sm btn-warning" onclick="window.adminOrdersController.updateStatus(${orderId}, 'DICUCI')">Wash</button>`,
            'DICUCI': `<button class="btn btn-sm btn-info" onclick="window.adminOrdersController.updateStatus(${orderId}, 'DIKIRIM')">Ship</button>`,
            'DIKIRIM': `<button class="btn btn-sm btn-success" onclick="window.adminOrdersController.updateStatus(${orderId}, 'SELESAI')">Complete</button>`,
            'SELESAI': `<span class="text-success">Completed</span>`
        };
        return statusButtons[currentStatus] || '';
    }

    updatePagination(pagination) {
        if (this.pageInfo && this.prevPage && this.nextPage) {
            if (pagination) {
                // Handle different pagination formats
                const currentPage = pagination.current_page || pagination.page || pagination.currentPage || 1;
                const totalPages = pagination.total_pages || pagination.pages || pagination.totalPages || 1;
                const total = pagination.total || pagination.totalItems || 0;
                
                this.pageInfo.textContent = `Page ${currentPage} of ${totalPages}${total > 0 ? ` (${total} total)` : ''}`;
                this.prevPage.disabled = currentPage <= 1;
                this.nextPage.disabled = currentPage >= totalPages;
            } else {
                // Fallback if pagination is not provided
                this.pageInfo.textContent = 'Page 1 of 1';
                this.prevPage.disabled = true;
                this.nextPage.disabled = true;
            }
        }
    }

    showOrderDetailModal(order) {
        if (!this.orderDetailContent) return;
        
        this.orderDetailContent.innerHTML = `
            <div class="order-detail">
                <h4>Order #${order.id}</h4>
                <div class="detail-section">
                    <h5>Customer Information</h5>
                    <p><strong>Name:</strong> ${order.customer_name}</p>
                    <p><strong>Phone:</strong> ${order.phone}</p>
                    <p><strong>Address:</strong> ${order.address}</p>
                </div>
                <div class="detail-section">
                    <h5>Order Items</h5>
                    <ul>
                        ${order.items ? order.items.map(item => `
                            <li>${item.service_name} x${item.qty} - Rp ${parseFloat(item.subtotal).toLocaleString()}</li>
                        `).join('') : '<li>No items</li>'}
                    </ul>
                </div>
                <div class="detail-section">
                    <h5>Order Summary</h5>
                    <p><strong>Total:</strong> Rp ${parseFloat(order.price_total).toLocaleString()}</p>
                    <p><strong>Status:</strong> <span class="status status-${order.status.toLowerCase()}">${order.status}</span></p>
                    <p><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                    <p><strong>Notes:</strong> ${order.notes || 'No notes'}</p>
                </div>
            </div>
        `;
        this.ui.showModal('orderDetailModal');
    }

    hideOrderDetailModal() {
        this.ui.hideModal('orderDetailModal');
    }

    getStatusFilter() {
        const statusFilter = document.getElementById('statusFilter');
        return statusFilter ? statusFilter.value : '';
    }

    getSearchInput() {
        const searchInput = document.getElementById('searchInput');
        return searchInput ? searchInput.value : '';
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
        const applyFilters = document.getElementById('applyFilters');
        if (applyFilters && callbacks.onApplyFilters) {
            applyFilters.addEventListener('click', callbacks.onApplyFilters);
        }

        if (this.prevPage && callbacks.onPrevPage) {
            this.prevPage.addEventListener('click', callbacks.onPrevPage);
        }

        if (this.nextPage && callbacks.onNextPage) {
            this.nextPage.addEventListener('click', callbacks.onNextPage);
        }

        const orderDetailModalClose = document.getElementById('orderDetailModalClose');
        if (orderDetailModalClose) {
            orderDetailModalClose.addEventListener('click', () => this.hideOrderDetailModal());
        }
    }

    redirect(url) {
        window.location.href = url;
    }
}






