// Courier Orders Module
import { AuthService } from '../services/auth.js';
import { UI } from '../utils/ui.js';

class CourierOrders {
    constructor() {
        this.authService = new AuthService();
        this.ui = new UI();
        
        this.currentTab = 'pickup';
        this.pickupOrders = [];
        this.deliveryOrders = [];
        
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuth();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load orders
        await this.loadOrders();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'COURIER') {
                this.ui.showUserNav(user);
            } else {
                // Try localStorage fallback
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    if (user.role === 'COURIER') {
                        this.ui.showUserNav(user);
                    } else {
                        alert('Access Denied! Courier access required.');
                        window.location.href = '../../index.html';
                    }
                } else {
                    window.location.href = '../../index.html';
                }
            }
        } catch (error) {
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user.role === 'COURIER') {
                    this.ui.showUserNav(user);
                } else {
                    alert('Access Denied! Courier access required.');
                    window.location.href = '../../index.html';
                }
            } else {
                window.location.href = '../../index.html';
            }
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Filter buttons
        document.getElementById('applyPickupFilters').addEventListener('click', () => {
            this.loadPickupOrders();
        });

        document.getElementById('applyDeliveryFilters').addEventListener('click', () => {
            this.loadDeliveryOrders();
        });

        // Modal close
        document.getElementById('orderDetailModalClose').addEventListener('click', () => {
            this.ui.hideModal('orderDetailModal');
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tab}Tab`).classList.add('active');
        
        // Load appropriate orders
        if (tab === 'pickup') {
            this.loadPickupOrders();
        } else {
            this.loadDeliveryOrders();
        }
    }

    async loadOrders() {
        await this.loadPickupOrders();
        await this.loadDeliveryOrders();
    }

    async loadPickupOrders() {
        try {
            this.ui.showLoading();
            
            // Mock pickup orders
            this.pickupOrders = [
                {
                    id: 1,
                    customer: { name: 'John Doe', phone: '08123456789' },
                    address: 'Jl. Sudirman No. 123, Jakarta',
                    items: [
                        { service: { name: 'Regular Wash' }, quantity: 2 }
                    ],
                    status: 'PENDING',
                    scheduledTime: '2024-10-16T10:00:00Z'
                },
                {
                    id: 2,
                    customer: { name: 'Jane Smith', phone: '08123456790' },
                    address: 'Jl. Thamrin No. 456, Jakarta',
                    items: [
                        { service: { name: 'Dry Clean' }, quantity: 1 }
                    ],
                    status: 'PICKED_UP',
                    scheduledTime: '2024-10-16T14:00:00Z'
                }
            ];

            this.renderPickupOrders();
            
        } catch (error) {
            this.ui.showAlert('Failed to load pickup orders', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async loadDeliveryOrders() {
        try {
            this.ui.showLoading();
            
            // Mock delivery orders
            this.deliveryOrders = [
                {
                    id: 3,
                    customer: { name: 'Bob Wilson', phone: '08123456791' },
                    address: 'Jl. Gatot Subroto No. 789, Jakarta',
                    items: [
                        { service: { name: 'Regular Wash' }, quantity: 3 }
                    ],
                    status: 'READY',
                    scheduledTime: '2024-10-16T16:00:00Z'
                },
                {
                    id: 4,
                    customer: { name: 'Alice Brown', phone: '08123456792' },
                    address: 'Jl. Rasuna Said No. 321, Jakarta',
                    items: [
                        { service: { name: 'Express Wash' }, quantity: 1 }
                    ],
                    status: 'OUT_FOR_DELIVERY',
                    scheduledTime: '2024-10-16T18:00:00Z'
                }
            ];

            this.renderDeliveryOrders();
            
        } catch (error) {
            this.ui.showAlert('Failed to load delivery orders', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    renderPickupOrders() {
        const tbody = document.getElementById('pickupOrdersTableBody');
        tbody.innerHTML = '';

        this.pickupOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>
                    <div>
                        <strong>${order.customer.name}</strong><br>
                        <small>${order.customer.phone}</small>
                    </div>
                </td>
                <td>${order.address}</td>
                <td>${order.items.length} item(s)</td>
                <td><span class="status status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="courierOrders.viewOrder(${order.id}, 'pickup')">View</button>
                    ${order.status === 'PENDING' ? `<button class="btn btn-sm btn-success" onclick="courierOrders.updateStatus(${order.id}, 'PICKED_UP', 'pickup')">Pick Up</button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderDeliveryOrders() {
        const tbody = document.getElementById('deliveryOrdersTableBody');
        tbody.innerHTML = '';

        this.deliveryOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.id}</td>
                <td>
                    <div>
                        <strong>${order.customer.name}</strong><br>
                        <small>${order.customer.phone}</small>
                    </div>
                </td>
                <td>${order.address}</td>
                <td>${order.items.length} item(s)</td>
                <td><span class="status status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="courierOrders.viewOrder(${order.id}, 'delivery')">View</button>
                    ${order.status === 'READY' ? `<button class="btn btn-sm btn-success" onclick="courierOrders.updateStatus(${order.id}, 'OUT_FOR_DELIVERY', 'delivery')">Start Delivery</button>` : ''}
                    ${order.status === 'OUT_FOR_DELIVERY' ? `<button class="btn btn-sm btn-success" onclick="courierOrders.updateStatus(${order.id}, 'DELIVERED', 'delivery')">Mark Delivered</button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    viewOrder(orderId, type) {
        const orders = type === 'pickup' ? this.pickupOrders : this.deliveryOrders;
        const order = orders.find(o => o.id === orderId);
        
        if (!order) return;

        const content = document.getElementById('orderDetailContent');
        content.innerHTML = `
            <div class="order-detail">
                <h4>Order #${order.id} - ${type.toUpperCase()}</h4>
                <div class="detail-section">
                    <h5>Customer Information</h5>
                    <p><strong>Name:</strong> ${order.customer.name}</p>
                    <p><strong>Phone:</strong> ${order.customer.phone}</p>
                    <p><strong>Address:</strong> ${order.address}</p>
                </div>
                <div class="detail-section">
                    <h5>Order Items</h5>
                    <ul>
                        ${order.items.map(item => `
                            <li>${item.service.name} x${item.quantity}</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="detail-section">
                    <h5>Order Information</h5>
                    <p><strong>Status:</strong> <span class="status status-${order.status.toLowerCase()}">${order.status}</span></p>
                    <p><strong>Scheduled Time:</strong> ${new Date(order.scheduledTime).toLocaleString()}</p>
                </div>
            </div>
        `;

        this.ui.showModal('orderDetailModal');
    }

    updateStatus(orderId, newStatus, type) {
        const orders = type === 'pickup' ? this.pickupOrders : this.deliveryOrders;
        const orderIndex = orders.findIndex(o => o.id === orderId);
        
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            
            if (type === 'pickup') {
                this.renderPickupOrders();
            } else {
                this.renderDeliveryOrders();
            }
            
            this.ui.showAlert(`Order #${orderId} status updated to ${newStatus}`, 'success');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.courierOrders = new CourierOrders();
});







