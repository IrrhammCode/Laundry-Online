// Admin Orders Module
import { AuthService } from '../services/auth.js';
import { OrderService } from '../services/order.js';
import { UI } from '../utils/ui.js';

class AdminOrders {
    constructor() {
        this.authService = new AuthService();
        this.orderService = new OrderService();
        this.ui = new UI();
        
        this.currentPage = 1;
        this.currentStatus = '';
        this.currentSearch = '';
        
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
        // Filter buttons
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.currentStatus = document.getElementById('statusFilter').value;
            this.currentSearch = document.getElementById('searchInput').value;
            this.currentPage = 1;
            this.loadOrders();
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadOrders();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            this.currentPage++;
            this.loadOrders();
        });

        // Modal close
        document.getElementById('orderDetailModalClose').addEventListener('click', () => {
            this.ui.hideModal('orderDetailModal');
        });
    }

    async loadOrders() {
        try {
            this.ui.showLoading();
            
            // Get token from localStorage
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for admin orders');
            }
            
            // Load orders from API
            const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders?page=${this.currentPage}&limit=10&status=${this.currentStatus}&search=${this.currentSearch}`, {
                headers: headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.renderOrders(result.data.orders);
                this.updatePagination(result.data.pagination);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Failed to load orders:', error);
            this.ui.showAlert('Failed to load orders', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    renderOrders(orders) {
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';

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
                <td>${order.items ? order.items.length : 0} item(s)</td>
                <td>Rp ${parseFloat(order.price_total).toLocaleString()}</td>
                <td><span class="status status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="adminOrders.viewOrder(${order.id})">View</button>
                    ${this.getStatusButton(order.status, order.id)}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getStatusButton(currentStatus, orderId) {
        const statusButtons = {
            'DIPESAN': `<button class="btn btn-sm btn-success" onclick="adminOrders.updateStatus(${orderId}, 'DIJEMPUT')">Pickup</button>`,
            'DIJEMPUT': `<button class="btn btn-sm btn-warning" onclick="adminOrders.updateStatus(${orderId}, 'DICUCI')">Wash</button>`,
            'DICUCI': `<button class="btn btn-sm btn-info" onclick="adminOrders.updateStatus(${orderId}, 'DIKIRIM')">Ship</button>`,
            'DIKIRIM': `<button class="btn btn-sm btn-success" onclick="adminOrders.updateStatus(${orderId}, 'SELESAI')">Complete</button>`,
            'SELESAI': `<span class="text-success">Completed</span>`
        };
        
        return statusButtons[currentStatus] || '';
    }
    
    async updateStatus(orderId, newStatus) {
        try {
            // Get token from localStorage
            const authToken = localStorage.getItem('authToken');
            let headers = {
                'Content-Type': 'application/json',
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for status update');
            }
            
            console.log(`Updating order ${orderId} to status: ${newStatus}`);
            
            const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.ui.showAlert('Order status updated successfully', 'success');
                this.loadOrders(); // Reload orders to show updated status
            } else {
                this.ui.showAlert(result.error || 'Failed to update order status', 'error');
            }
        } catch (error) {
            console.error('Update status error:', error);
            this.ui.showAlert('Failed to update order status', 'error');
        }
    }

    updatePagination(pagination) {
        if (pagination) {
            document.getElementById('pageInfo').textContent = `Page ${pagination.current_page} of ${pagination.total_pages}`;
            document.getElementById('prevPage').disabled = pagination.current_page <= 1;
            document.getElementById('nextPage').disabled = pagination.current_page >= pagination.total_pages;
        } else {
            document.getElementById('pageInfo').textContent = `Page ${this.currentPage} of 1`;
            document.getElementById('prevPage').disabled = this.currentPage <= 1;
            document.getElementById('nextPage').disabled = true;
        }
    }

    async viewOrder(orderId) {
        try {
            // Get token from localStorage
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for order detail');
            }
            
            const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${orderId}`, {
                headers: headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch order details');
            }
            
            const result = await response.json();
            
            if (result.ok) {
                const order = result.data.order;
                const content = document.getElementById('orderDetailContent');
                content.innerHTML = `
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
            } else {
                this.ui.showAlert(result.error || 'Failed to load order details', 'error');
            }
        } catch (error) {
            console.error('Failed to load order details:', error);
            this.ui.showAlert('Failed to load order details', 'error');
        }
    }

}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminOrders = new AdminOrders();
});
