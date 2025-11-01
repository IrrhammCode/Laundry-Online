// Courier Orders View - MVC Pattern
import { UI } from '../../utils/ui.js';

export class CourierOrdersView {
    constructor() {
        this.ui = new UI();
        this.pickupOrdersTableBody = document.getElementById('pickupOrdersTableBody');
        this.deliveryOrdersTableBody = document.getElementById('deliveryOrdersTableBody');
        this.orderDetailContent = document.getElementById('orderDetailContent');
    }

    renderPickupOrders(orders) {
        if (!this.pickupOrdersTableBody) return;
        this.pickupOrdersTableBody.innerHTML = '';

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>
                    <div>
                        <strong>${order.customer_name || (order.customer && order.customer.name)}</strong><br>
                        <small>${order.phone || (order.customer && order.customer.phone)}</small>
                    </div>
                </td>
                <td>${order.address || 'N/A'}</td>
                <td>${order.items ? order.items.length : 0} item(s)</td>
                <td><span class="status status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.courierOrdersController.viewOrder(${order.id}, 'pickup')">View</button>
                    ${order.status === 'DIPESAN' || order.status === 'PENDING' ? `<button class="btn btn-sm btn-success" onclick="window.courierOrdersController.updateStatus(${order.id}, 'DIJEMPUT', 'pickup')">Pick Up</button>` : ''}
                </td>
            `;
            this.pickupOrdersTableBody.appendChild(row);
        });
    }

    renderDeliveryOrders(orders) {
        if (!this.deliveryOrdersTableBody) return;
        this.deliveryOrdersTableBody.innerHTML = '';

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>
                    <div>
                        <strong>${order.customer_name || (order.customer && order.customer.name)}</strong><br>
                        <small>${order.phone || (order.customer && order.customer.phone)}</small>
                    </div>
                </td>
                <td>${order.address || 'N/A'}</td>
                <td>${order.items ? order.items.length : 0} item(s)</td>
                <td><span class="status status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.courierOrdersController.viewOrder(${order.id}, 'delivery')">View</button>
                    ${order.status === 'DICUCI' || order.status === 'READY' ? `<button class="btn btn-sm btn-success" onclick="window.courierOrdersController.updateStatus(${order.id}, 'DIKIRIM', 'delivery')">Start Delivery</button>` : ''}
                    ${order.status === 'DIKIRIM' || order.status === 'OUT_FOR_DELIVERY' ? `<button class="btn btn-sm btn-success" onclick="window.courierOrdersController.updateStatus(${order.id}, 'SELESAI', 'delivery')">Mark Delivered</button>` : ''}
                </td>
            `;
            this.deliveryOrdersTableBody.appendChild(row);
        });
    }

    showOrderDetailModal(order, type) {
        if (!this.orderDetailContent) return;
        
        this.orderDetailContent.innerHTML = `
            <div class="order-detail">
                <h4>Order #${order.id} - ${type.toUpperCase()}</h4>
                <div class="detail-section">
                    <h5>Customer Information</h5>
                    <p><strong>Name:</strong> ${order.customer_name || (order.customer && order.customer.name)}</p>
                    <p><strong>Phone:</strong> ${order.phone || (order.customer && order.customer.phone)}</p>
                    <p><strong>Address:</strong> ${order.address || 'N/A'}</p>
                </div>
                <div class="detail-section">
                    <h5>Order Items</h5>
                    <ul>
                        ${order.items ? order.items.map(item => `
                            <li>${item.service_name || (item.service && item.service.name)} x${item.qty || item.quantity} - Rp ${parseFloat(item.subtotal || (item.unit_price * (item.qty || item.quantity))).toLocaleString()}</li>
                        `).join('') : '<li>No items</li>'}
                    </ul>
                </div>
                <div class="detail-section">
                    <h5>Order Information</h5>
                    <p><strong>Status:</strong> <span class="status status-${order.status.toLowerCase()}">${order.status}</span></p>
                    <p><strong>Created:</strong> ${new Date(order.created_at || order.scheduledTime).toLocaleString()}</p>
                </div>
            </div>
        `;
        this.ui.showModal('orderDetailModal');
    }

    hideOrderDetailModal() {
        this.ui.hideModal('orderDetailModal');
    }

    showAlert(message, type = 'info') {
        this.ui.showAlert(message, type);
    }

    showUserNav(user) {
        this.ui.showUserNav(user);
    }

    setupEventListeners(callbacks) {
        const orderDetailModalClose = document.getElementById('orderDetailModalClose');
        if (orderDetailModalClose) {
            orderDetailModalClose.addEventListener('click', () => this.hideOrderDetailModal());
        }

        if (callbacks.onLogout) {
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', callbacks.onLogout);
            }
        }
    }

    redirect(url) {
        window.location.href = url;
    }
}



