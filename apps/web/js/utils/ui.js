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
        const navMenu = document.getElementById('navMenu');
        
        if (authNav) authNav.style.display = 'none';
        if (userNav) userNav.style.display = 'flex';
        if (userName) userName.textContent = user.name;
        
        // Update navbar links based on user role
        if (navMenu && user.role) {
            this.updateNavbarForRole(user.role, navMenu);
        }
    }
    
    updateNavbarForRole(role, navMenu) {
        // Only update navbar for customer pages
        // Courier and Admin have their own separate pages with different navbar structure
        if (role === 'CUSTOMER') {
            // Ensure notification wrapper is visible for customers
            const notificationWrapper = navMenu.querySelector('.notification-wrapper');
            if (!notificationWrapper) {
                // Notification wrapper should already be in HTML for customer pages
                // If missing, it means we're on a wrong page
                console.warn('Notification wrapper not found for customer');
            }
            
            // Ensure customer links are present
            const links = {
                'index.html': 'Home',
                'order.html': 'New Order',
                'history.html': 'My Orders',
                'complaints.html': 'Complaints',
                'profile.html': 'Profile'
            };
            
            // Check and add missing links
            Object.entries(links).forEach(([href, text]) => {
                if (!navMenu.querySelector(`a[href="${href}"]`)) {
                    const link = document.createElement('a');
                    link.href = href;
                    link.className = 'nav-link';
                    link.textContent = text;
                    
                    // Insert after home link or at the beginning
                    const homeLink = navMenu.querySelector('a[href="index.html"]') || navMenu.querySelector('a[href="#home"]');
                    if (homeLink && href !== 'index.html') {
                        homeLink.insertAdjacentElement('afterend', link);
                    } else if (!homeLink) {
                        navMenu.insertBefore(link, navMenu.firstChild);
                    }
                }
            });
        } else if (role === 'COURIER' || role === 'ADMIN') {
            // Remove notification wrapper for non-customer roles
            const notificationWrapper = navMenu.querySelector('.notification-wrapper');
            if (notificationWrapper) {
                notificationWrapper.remove();
            }
            
            // Redirect to appropriate page if on customer pages
            if (window.location.pathname.includes('/admin/') === false && role === 'ADMIN') {
                window.location.href = 'admin/dashboard.html';
            }
        }
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
                    ${order.status === 'MENUNGGU_KONFIRMASI_DELIVERY' ? `
                    <button class="btn btn-warning" onclick="chooseDeliveryMethod(${order.id})" style="background: #ffc107; color: #000; border: none;">
                        <i class="fas fa-truck"></i> Pilih Metode Pengambilan
                    </button>
                    ` : ''}
                    ${order.status === 'MENUNGGU_PEMBAYARAN_DELIVERY' ? `
                    <button class="btn btn-success" onclick="payQRIS(${order.id})" style="background: #28a745; color: #fff; border: none;">
                        <i class="fas fa-qrcode"></i> Bayar QRIS
                    </button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="viewOrder(${order.id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-primary" onclick="openChat(${order.id})">
                        <i class="fas fa-comments"></i> Chat
                    </button>
                    ${order.status === 'SELESAI' ? `
                    <button class="btn btn-success" onclick="openReview(${order.id})">
                        <i class="fas fa-star"></i> Review
                    </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderOrderDetail(order) {
        // Check if order needs delivery method selection
        const needsDeliverySelection = order.status === 'MENUNGGU_KONFIRMASI_DELIVERY';
        const needsPayment = order.status === 'MENUNGGU_PEMBAYARAN_DELIVERY';
        
        return `
            <div class="order-detail-container">
                <div class="order-header">
                    <h2>Order #${order.id}</h2>
                    <span class="status-badge status-${order.status.toLowerCase().replace(/_/g, '-')}">
                        ${this.formatOrderStatus(order.status)}
                    </span>
                </div>
                
                ${needsDeliverySelection ? `
                <div class="delivery-selection" style="background: #e3f2fd; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <h3 style="margin-top: 0;"><i class="fas fa-truck"></i> Pilih Metode Pengambilan</h3>
                    <p>Pesanan Anda sudah selesai dicuci. Silakan pilih metode pengambilan:</p>
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button class="btn btn-success" onclick="window.historyController.chooseDelivery(${order.id}, 'SELF_PICKUP')" style="flex: 1;">
                            <i class="fas fa-walking"></i> Ambil Sendiri (Gratis)
                        </button>
                        <button class="btn btn-primary" onclick="window.historyController.chooseDelivery(${order.id}, 'DELIVERY')" style="flex: 1;">
                            <i class="fas fa-truck"></i> Dianter (Rp 10.000)
                        </button>
                    </div>
                </div>
                ` : ''}
                
                ${needsPayment ? `
                <div class="payment-section" style="background: #fff3cd; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <h3 style="margin-top: 0;"><i class="fas fa-qrcode"></i> Pembayaran Delivery Fee</h3>
                    <p>Anda memilih layanan delivery. Silakan lakukan pembayaran delivery fee sebesar:</p>
                    <div style="background: white; padding: 1rem; border-radius: 5px; margin: 1rem 0;">
                        <h2 style="color: #28a745; margin: 0;">Rp 10.000</h2>
                    </div>
                    <div style="text-align: center; margin: 1.5rem 0;">
                        <div style="background: white; padding: 2rem; border-radius: 8px; display: inline-block;">
                            <div style="width: 200px; height: 200px; background: #f0f0f0; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
                                <i class="fas fa-qrcode" style="font-size: 4rem; color: #666;"></i>
                            </div>
                            <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">QRIS Payment (Mock)</p>
                        </div>
                    </div>
                    <button class="btn btn-success" onclick="window.historyController.payQRIS(${order.id})" style="width: 100%;">
                        <i class="fas fa-check-circle"></i> Konfirmasi Pembayaran (Mock)
                    </button>
                </div>
                ` : ''}
                
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
            'PESANAN_DIJEMPUT': 'Pesanan Dijemput',
            'DIAMBIL': 'Diambil',
            'DICUCI': 'Dicuci',
            'MENUNGGU_KONFIRMASI_DELIVERY': 'Menunggu Konfirmasi Delivery',
            'MENUNGGU_PEMBAYARAN_DELIVERY': 'Menunggu Pembayaran Delivery',
            'MENUNGGU_AMBIL_SENDIRI': 'Menunggu Ambil Sendiri',
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



