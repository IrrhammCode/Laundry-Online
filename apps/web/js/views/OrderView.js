// Order View - MVP Pattern
// Handles all DOM manipulation for Order page
export class OrderView {
    constructor() {
        // Cache DOM elements
        this.servicesGrid = document.getElementById('servicesGrid');
        this.orderItems = document.getElementById('orderItems');
        this.servicesTotalEl = document.getElementById('servicesTotal');
        this.pickupFeeEl = document.getElementById('pickupFee');
        this.orderTotalEl = document.getElementById('orderTotal');
        this.paymentTotalEl = document.getElementById('paymentTotal');
        this.paymentAmountEl = document.getElementById('paymentAmount');
        this.paymentModal = document.getElementById('paymentModal');
    }

    /**
     * Render recommended packages
     * @param {Array} packages - Array of package objects
     */
    renderRecommendedPackages(packages) {
        const packagesSection = document.getElementById('recommendedPackagesSection');
        const packagesGrid = document.getElementById('recommendedPackages');
        
        if (!packagesSection || !packagesGrid || packages.length === 0) return;
        
        packagesSection.style.display = 'block';
        packagesGrid.innerHTML = packages.map(pkg => `
            <div class="package-card">
                <div class="package-badge">${pkg.badge}</div>
                <h3>${pkg.name}</h3>
                <p class="package-description">${pkg.description}</p>
                <div class="package-services">
                    ${pkg.services.map(s => `
                        <div class="package-service-item">
                            <i class="fas fa-check"></i>
                            <span>${s.name} (Rp ${parseFloat(s.base_price).toLocaleString('id-ID')}/${s.unit})</span>
                        </div>
                    `).join('')}
                </div>
                <div class="package-pricing">
                    ${pkg.discount > 0 ? `
                        <div class="package-price-original">Rp ${pkg.original_price.toLocaleString('id-ID')}</div>
                        <div class="package-discount">${pkg.discount}% OFF</div>
                    ` : ''}
                    <div class="package-price-final">Rp ${pkg.final_price.toLocaleString('id-ID')}</div>
                </div>
                <button type="button" class="btn btn-primary btn-block" 
                        onclick="window.orderController.selectPackage('${pkg.id}', ${JSON.stringify(pkg.services).replace(/"/g, '&quot;')})">
                    <i class="fas fa-shopping-cart"></i> Add Package
                </button>
            </div>
        `).join('');
    }

    /**
     * Render services list
     * @param {Array} services - Array of service objects
     * @param {Function} onAddService - Callback when service is added
     */
    renderServices(services, onAddService) {
        if (!this.servicesGrid) return;

        this.servicesGrid.innerHTML = services.map(service => `
            <div class="service-card" data-service-id="${service.id}">
                <div class="service-icon">
                    <i class="fas fa-tshirt"></i>
                </div>
                <div class="service-name">${service.name}</div>
                <div class="service-price">Rp ${service.base_price.toLocaleString()}/${service.unit}</div>
                <div class="service-description">${service.description || ''}</div>
                <div class="service-controls">
                    <button type="button" class="btn btn-outline btn-sm" onclick="window.orderController.addService(${service.id})">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render order items
     * @param {Array} items - Array of selected order items
     * @param {Function} onRemove - Callback when item is removed
     * @param {Function} onUpdateQuantity - Callback when quantity is updated
     */
    renderOrderItems(items, onRemove, onUpdateQuantity) {
        if (!this.orderItems) return;

        if (items.length === 0) {
            this.orderItems.innerHTML = '<p class="empty-message">No items selected. Please select services above.</p>';
            return;
        }

        this.orderItems.innerHTML = items.map(item => `
            <div class="order-item">
                <div class="item-info">
                    <h4>${item.service_name}</h4>
                    <p>Rp ${item.unit_price.toLocaleString()}/${item.unit}</p>
                </div>
                <div class="item-controls">
                    <button type="button" class="btn btn-outline btn-sm" onclick="window.orderController.updateServiceQuantity(${item.service_id}, ${item.qty - 1})">-</button>
                    <span class="quantity">${item.qty}</span>
                    <button type="button" class="btn btn-outline btn-sm" onclick="window.orderController.updateServiceQuantity(${item.service_id}, ${item.qty + 1})">+</button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="window.orderController.removeService(${item.service_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="item-subtotal">
                    Rp ${(item.unit_price * item.qty).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

    /**
     * Update order summary
     * @param {number} servicesTotal - Total price of services
     * @param {number} pickupFee - Pickup fee amount
     * @param {number} total - Grand total
     */
    updateOrderSummary(servicesTotal, pickupFee, total) {
        if (this.servicesTotalEl) {
            this.servicesTotalEl.textContent = `Rp ${servicesTotal.toLocaleString()}`;
        }
        if (this.pickupFeeEl) {
            this.pickupFeeEl.textContent = `Rp ${pickupFee.toLocaleString()}`;
        }
        if (this.orderTotalEl) {
            this.orderTotalEl.textContent = `Rp ${total.toLocaleString()}`;
        }
    }

    /**
     * Show payment modal
     * @param {Object} order - Order object with price_total
     */
    showPaymentModal(order) {
        if (this.paymentTotalEl) {
            this.paymentTotalEl.textContent = `Rp ${order.price_total.toLocaleString()}`;
        }
        if (this.paymentAmountEl) {
            this.paymentAmountEl.value = order.price_total;
        }
        
        // Show QRIS mockup by default
        const qrisMockup = document.getElementById('qrisMockup');
        const paymentForm = document.getElementById('paymentForm');
        if (qrisMockup) qrisMockup.style.display = 'block';
        if (paymentForm) paymentForm.style.display = 'none';
        
        // Reset QRIS status
        const qrisStatus = document.getElementById('qrisStatus');
        if (qrisStatus) {
            qrisStatus.innerHTML = '<p>Menunggu pembayaran...</p>';
        }
        
        if (this.paymentModal) {
            this.paymentModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Hide payment modal
     */
    hidePaymentModal() {
        if (this.paymentModal) {
            this.paymentModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Get pickup method from form
     * @returns {string} - 'PICKUP' or 'SELF'
     */
    getPickupMethod() {
        const checked = document.querySelector('input[name="pickup_method"]:checked');
        return checked ? checked.value : 'SELF';
    }

    /**
     * Get form data
     * @returns {Object} - Form data object
     */
    getFormData() {
        const form = document.getElementById('orderForm');
        if (!form) return null;

        const formData = new FormData(form);
        const emailOption = formData.get('email_option');
        let notificationEmail = null;
        
        if (emailOption === 'custom') {
            notificationEmail = formData.get('notification_email');
        }
        
        return {
            pickup_method: formData.get('pickup_method'),
            notes: formData.get('notes'),
            notification_email: notificationEmail
        };
    }

    /**
     * Get payment form data
     * @returns {Object} - Payment form data
     */
    getPaymentFormData() {
        // Get amount from hidden input
        const amountEl = document.getElementById('paymentAmount');
        const amount = amountEl ? parseFloat(amountEl.value) : null;
        
        // Default to QRIS if form not visible
        const method = 'QRIS';
        
        return {
            method: method,
            amount: amount
        };
    }
    
    /**
     * Get payment form data (legacy method)
     * @returns {Object} - Payment form data
     */
    getPaymentFormDataLegacy() {
        const form = document.getElementById('paymentForm');
        if (!form) return null;

        const formData = new FormData(form);
        return {
            method: formData.get('method'),
            amount: parseFloat(formData.get('amount'))
        };
    }

    /**
     * Show alert message
     * @param {string} message - Alert message
     * @param {string} type - Alert type (success, error, info)
     */
    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

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

    /**
     * Show loading indicator
     */
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

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) loading.remove();
    }

    /**
     * Show user navigation
     * @param {Object} user - User object
     */
    showUserNav(user) {
        const userName = document.getElementById('userName');
        if (userName && user.name) {
            userName.textContent = user.name;
        }
    }

    /**
     * Setup event listeners for view
     * @param {Object} callbacks - Object with callback functions
     */
    setupEventListeners(callbacks) {
        // Form submission
        const orderForm = document.getElementById('orderForm');
        if (orderForm && callbacks.onOrderSubmit) {
            orderForm.addEventListener('submit', callbacks.onOrderSubmit);
        }

        // Pickup method change
        document.querySelectorAll('input[name="pickup_method"]').forEach(radio => {
            radio.addEventListener('change', () => {
                if (callbacks.onPickupMethodChange) {
                    callbacks.onPickupMethodChange();
                }
            });
        });

        // Payment modal close
        const paymentModalClose = document.getElementById('paymentModalClose');
        if (paymentModalClose) {
            paymentModalClose.addEventListener('click', () => {
                this.hidePaymentModal();
            });
        }

        const cancelPayment = document.getElementById('cancelPayment');
        if (cancelPayment) {
            cancelPayment.addEventListener('click', () => {
                this.hidePaymentModal();
            });
        }

        // Payment form submission
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm && callbacks.onPaymentSubmit) {
            paymentForm.addEventListener('submit', callbacks.onPaymentSubmit);
        }
        
        // QRIS simulate payment button
        const simulatePaymentBtn = document.getElementById('simulatePayment');
        if (simulatePaymentBtn && callbacks.onPaymentSubmit) {
            simulatePaymentBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Simulate payment success
                const qrisStatus = document.getElementById('qrisStatus');
                if (qrisStatus) {
                    qrisStatus.innerHTML = '<p style="color: #28a745; font-weight: bold;">✓ Pembayaran berhasil!</p>';
                }
                
                // Disable button
                simulatePaymentBtn.disabled = true;
                simulatePaymentBtn.textContent = 'Memproses...';
                
                // Trigger payment submit after short delay
                setTimeout(() => {
                    if (callbacks.onPaymentSubmit) {
                        const fakeEvent = { preventDefault: () => {} };
                        callbacks.onPaymentSubmit(fakeEvent);
                    }
                }, 1000);
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && callbacks.onLogout) {
            logoutBtn.addEventListener('click', callbacks.onLogout);
        }
    }

    /**
     * Redirect to another page
     * @param {string} url - URL to redirect to
     */
    redirect(url) {
        window.location.href = url;
    }
}

