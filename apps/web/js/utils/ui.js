// UI Utility Class
export class UI {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    this.hideModal(activeModal.id);
                }
            }
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    showAuthNav() {
        const authNav = document.getElementById('navAuth');
        const userNav = document.getElementById('navUser');
        
        if (authNav) authNav.style.display = 'flex';
        if (userNav) userNav.style.display = 'none';
    }

    hideAuthNav() {
        const authNav = document.getElementById('navAuth');
        if (authNav) authNav.style.display = 'none';
    }

    showUserNav(user) {
        const authNav = document.getElementById('navAuth');
        const userNav = document.getElementById('navUser');
        const userName = document.getElementById('userName');
        
        if (authNav) authNav.style.display = 'none';
        if (userNav) userNav.style.display = 'flex';
        if (userName) userName.textContent = user.name;
    }

    hideUserNav() {
        const userNav = document.getElementById('navUser');
        if (userNav) userNav.style.display = 'none';
    }

    showAlert(message, type = 'info') {
        console.log(`[UI] Showing alert: ${type} - ${message}`);
        
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.cssText = 'position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 9999; padding: 1rem 2rem; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 300px; max-width: 90%; text-align: center;';

        // Insert at the top of the page
        const header = document.querySelector('.header');
        if (header) {
            header.insertAdjacentElement('afterend', alert);
        } else {
            document.body.insertBefore(alert, document.body.firstChild);
        }

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    showLoading() {
        // Remove existing loading
        const existingLoading = document.querySelector('.loading');
        if (existingLoading) existingLoading.remove();

        // Create loading element
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = '<div class="spinner"></div>';

        // Insert at the top of the page
        const header = document.querySelector('.header');
        if (header) {
            header.insertAdjacentElement('afterend', loading);
        } else {
            document.body.insertBefore(loading, document.body.firstChild);
        }
    }

    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) loading.remove();
    }

    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }

    renderServices(services) {
        const servicesGrid = document.getElementById('servicesGrid');
        if (!servicesGrid) return;

        servicesGrid.innerHTML = services.map(service => `
            <div class="service-card">
                <div class="service-icon">
                    <i class="fas fa-tshirt"></i>
                </div>
                <div class="service-name">${service.name}</div>
                <div class="service-price">Rp ${service.base_price.toLocaleString()}/${service.unit}</div>
                <div class="service-description">${service.description || ''}</div>
            </div>
        `).join('');
    }

    renderOrders(orders) {
        return orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">#${order.id}</div>
                    <div class="order-date">${new Date(order.created_at).toLocaleDateString()}</div>
                </div>
                <div class="order-details">
                    <div class="order-detail">
                        <div class="order-detail-label">Status</div>
                        <div class="order-detail-value">
                            <span class="status-badge status-${order.status.toLowerCase()}">
                                ${this.formatOrderStatus(order.status)}
                            </span>
                        </div>
                    </div>
                    <div class="order-detail">
                        <div class="order-detail-label">Total</div>
                        <div class="order-detail-value">Rp ${order.price_total.toLocaleString()}</div>
                    </div>
                    <div class="order-detail">
                        <div class="order-detail-label">Items</div>
                        <div class="order-detail-value">${order.item_count} items</div>
                    </div>
                </div>
                <div class="order-actions">
                    <button class="btn btn-outline" onclick="viewOrder(${order.id})">View Details</button>
                </div>
            </div>
        `).join('');
    }

    renderOrderDetail(order) {
        return `
            <div class="order-detail-container">
                <div class="order-header">
                    <h2>Order #${order.id}</h2>
                    <span class="status-badge status-${order.status.toLowerCase()}">
                        ${this.formatOrderStatus(order.status)}
                    </span>
                </div>
                
                <div class="order-info">
                    <div class="info-section">
                        <h3>Customer Information</h3>
                        <p><strong>Name:</strong> ${order.customer_name}</p>
                        <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${order.address || 'N/A'}</p>
                    </div>
                    
                    <div class="info-section">
                        <h3>Order Information</h3>
                        <p><strong>Pickup Method:</strong> ${order.pickup_method === 'PICKUP' ? 'Pickup Service' : 'Self Service'}</p>
                        <p><strong>Total Price:</strong> Rp ${order.price_total.toLocaleString()}</p>
                        <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                        ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
                    </div>
                </div>

                <div class="order-items">
                    <h3>Order Items</h3>
                    <div class="items-list">
                        ${order.items.map(item => `
                            <div class="item-row">
                                <div class="item-name">${item.service_name}</div>
                                <div class="item-qty">${item.qty} ${item.unit}</div>
                                <div class="item-price">Rp ${item.unit_price.toLocaleString()}</div>
                                <div class="item-subtotal">Rp ${item.subtotal.toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${order.payments && order.payments.length > 0 ? `
                    <div class="payment-info">
                        <h3>Payment Information</h3>
                        ${order.payments.map(payment => `
                            <div class="payment-item">
                                <p><strong>Method:</strong> ${payment.method}</p>
                                <p><strong>Amount:</strong> Rp ${payment.amount.toLocaleString()}</p>
                                <p><strong>Status:</strong> ${payment.status}</p>
                                ${payment.paid_at ? `<p><strong>Paid At:</strong> ${new Date(payment.paid_at).toLocaleString()}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

            </div>
        `;
    }

    renderChat(messages, currentUserId) {
        return messages.map(message => `
            <div class="chat-message ${message.sender_id === currentUserId ? 'sent' : 'received'}">
                <div class="message-header">
                    <strong>${message.sender_name}</strong>
                    <span class="message-time">${new Date(message.created_at).toLocaleTimeString()}</span>
                </div>
                <div class="message-body">${message.body}</div>
            </div>
        `).join('');
    }

    formatOrderStatus(status) {
        const statusMap = {
            'DIPESAN': 'Dipesan',
            'DIJEMPUT': 'Dijemput',
            'DICUCI': 'Dicuci',
            'DIKIRIM': 'Dikirim',
            'SELESAI': 'Selesai'
        };

        return statusMap[status] || status;
    }

    scrollToSection(sectionId) {
        const section = document.querySelector(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    toggleMobileNav() {
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            navMenu.classList.toggle('active');
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showConfirmDialog(message, onConfirm, onCancel) {
        const confirmed = confirm(message);
        if (confirmed && onConfirm) {
            onConfirm();
        } else if (!confirmed && onCancel) {
            onCancel();
        }
    }

    showPromptDialog(message, defaultValue = '') {
        return prompt(message, defaultValue);
    }
}



