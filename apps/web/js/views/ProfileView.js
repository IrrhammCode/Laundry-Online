// Profile View - MVC Pattern
// Handles all DOM manipulation for Profile page
import { UI } from '../utils/ui.js';

export class ProfileView {
    constructor() {
        this.ui = new UI();
        // Cache DOM elements
        this.profileName = document.getElementById('profileName');
        this.profileEmail = document.getElementById('profileEmail');
        this.profileNameInput = document.getElementById('profileNameInput');
        this.profileEmailInput = document.getElementById('profileEmailInput');
        this.profilePhoneInput = document.getElementById('profilePhoneInput');
        this.profileAddressInput = document.getElementById('profileAddressInput');
        this.profileForm = document.getElementById('profileForm');
    }

    /**
     * Render profile data
     * @param {Object} user - User object
     */
    renderProfile(user) {
        if (this.profileName) {
            this.profileName.textContent = user.name;
        }
        if (this.profileEmail) {
            this.profileEmail.textContent = user.email;
        }
        if (this.profileNameInput) {
            this.profileNameInput.value = user.name;
        }
        if (this.profileEmailInput) {
            this.profileEmailInput.value = user.email;
        }
        if (this.profilePhoneInput) {
            this.profilePhoneInput.value = user.phone || '';
        }
        if (this.profileAddressInput) {
            this.profileAddressInput.value = user.address || '';
        }
    }

    /**
     * Get form data
     * @returns {Object} - Form data object
     */
    getFormData() {
        if (!this.profileForm) return null;

        const formData = new FormData(this.profileForm);
        return Object.fromEntries(formData);
    }

    /**
     * Reset form
     */
    resetForm() {
        if (this.profileForm) {
            this.profileForm.reset();
        }
    }

    /**
     * Show alert message
     */
    showAlert(message, type = 'info') {
        this.ui.showAlert(message, type);
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        this.ui.showLoading();
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.ui.hideLoading();
    }

    /**
     * Show user navigation
     * @param {Object} user - User object
     */
    showUserNav(user) {
        this.ui.showUserNav(user);
    }

    /**
     * Update notification badge count
     */
    updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    /**
     * Render notifications list
     */
    renderNotifications(notifications) {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;

        if (notifications.length === 0) {
            container.innerHTML = '<div class="empty-message"><i class="fas fa-inbox"></i><br>No notifications</div>';
            return;
        }

        container.innerHTML = notifications.map(notif => {
            // Handle payload_json - could be string or object
            let payload = {};
            try {
                if (notif.payload_json) {
                    payload = typeof notif.payload_json === 'string' 
                        ? JSON.parse(notif.payload_json) 
                        : notif.payload_json;
                }
            } catch (e) {
                console.error('Failed to parse payload_json:', e);
                payload = {};
            }
            const isRead = notif.sent_at !== null;
            const orderId = notif.order_id || payload.orderId || '';
            
            return `
                <div class="notification-item ${isRead ? 'read' : 'unread'}" data-id="${notif.id}">
                    <div class="notification-icon">
                        <i class="fas fa-${this.getNotificationIcon(notif.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${this.getNotificationTitle(notif.type, payload)}</div>
                        <div class="notification-message">${this.getNotificationMessage(notif.type, payload)}</div>
                        <div class="notification-time">${this.formatNotificationTime(notif.created_at)}</div>
                    </div>
                    ${orderId ? `<a href="history.html" class="notification-link">View Order</a>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Show notifications loading
     */
    showNotificationsLoading() {
        const container = document.getElementById('notificationsContainer');
        if (container) {
            container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading notifications...</p></div>';
        }
    }

    /**
     * Show notifications error
     */
    showNotificationsError(message) {
        const container = document.getElementById('notificationsContainer');
        if (container) {
            container.innerHTML = `<div class="notification-error">${message}</div>`;
        }
    }

    /**
     * Update notifications pagination
     */
    updateNotificationsPagination(pagination) {
        const paginationEl = document.getElementById('notificationsPagination');
        if (!paginationEl || !pagination) return;

        if (pagination.pages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let html = '<div class="pagination-controls">';
        
        if (pagination.page > 1) {
            html += `<button class="btn btn-outline" onclick="window.profileController.loadNotifications(${pagination.page - 1})">Previous</button>`;
        }
        
        html += `<span>Page ${pagination.page} of ${pagination.pages}</span>`;
        
        if (pagination.page < pagination.pages) {
            html += `<button class="btn btn-outline" onclick="window.profileController.loadNotifications(${pagination.page + 1})">Next</button>`;
        }
        
        html += '</div>';
        paginationEl.innerHTML = html;
    }

    /**
     * Render chat history
     */
    renderChatHistory(chatHistory) {
        const container = document.getElementById('chatHistoryContainer');
        if (!container) return;

        if (chatHistory.length === 0) {
            container.innerHTML = '<div class="empty-message"><i class="fas fa-comments"></i><br>No chat history yet</div>';
            return;
        }

        container.innerHTML = chatHistory.map(chat => {
            const order = chat.order;
            const lastMessage = chat.lastMessage;
            
            return `
                <div class="chat-history-item" onclick="window.profileController.openChat(${order.id})">
                    <div class="chat-history-header">
                        <div class="chat-history-order">
                            <strong>Order #${order.id}</strong>
                            <span class="status status-${order.status.toLowerCase()}">${this.formatOrderStatus(order.status)}</span>
                        </div>
                        <div class="chat-history-time">${this.formatNotificationTime(lastMessage.created_at)}</div>
                    </div>
                    <div class="chat-history-preview">
                        <strong>${lastMessage.sender_name}:</strong> ${lastMessage.body.substring(0, 100)}${lastMessage.body.length > 100 ? '...' : ''}
                    </div>
                    <div class="chat-history-meta">
                        <span>${chat.messages.length} message(s)</span>
                        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.profileController.openChat(${order.id})">
                            <i class="fas fa-comments"></i> Open Chat
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Show chat history loading
     */
    showChatHistoryLoading() {
        const container = document.getElementById('chatHistoryContainer');
        if (container) {
            container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading chat history...</p></div>';
        }
    }

    /**
     * Show chat history error
     */
    showChatHistoryError(message) {
        const container = document.getElementById('chatHistoryContainer');
        if (container) {
            container.innerHTML = `<div class="notification-error">${message}</div>`;
        }
    }

    /**
     * Show chat modal
     */
    showChatModal(order) {
        const chatOrderId = document.getElementById('chatOrderId');
        const chatOrderStatus = document.getElementById('chatOrderStatus');
        
        if (chatOrderId) {
            chatOrderId.textContent = order.id;
        }
        if (chatOrderStatus) {
            chatOrderStatus.textContent = this.formatOrderStatus(order.status);
            chatOrderStatus.className = `status-badge status-${order.status.toLowerCase()}`;
        }
        
        this.ui.showModal('chatModal');
    }

    /**
     * Hide chat modal
     */
    hideChatModal() {
        this.ui.hideModal('chatModal');
    }

    /**
     * Render chat messages
     */
    renderChat(messages, currentUserId) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        if (messages.length === 0) {
            chatMessages.innerHTML = '<div class="empty-message">No messages yet. Start a conversation!</div>';
            return;
        }

        chatMessages.innerHTML = messages.map(message => {
            const isSent = message.sender_id === currentUserId;
            return `
                <div class="chat-message ${isSent ? 'sent' : 'received'}">
                    <div class="message-header">
                        <strong>${message.sender_name || 'User'}</strong>
                        <span class="message-time">${new Date(message.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div class="message-body">${message.body}</div>
                </div>
            `;
        }).join('');

        this.scrollChatToBottom();
    }

    /**
     * Scroll chat to bottom
     */
    scrollChatToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    /**
     * Get chat input value
     */
    getChatInput() {
        const input = document.getElementById('chatInput');
        return input ? input.value.trim() : '';
    }

    /**
     * Clear chat input
     */
    clearChatInput() {
        const input = document.getElementById('chatInput');
        if (input) {
            input.value = '';
        }
    }

    /**
     * Get notification icon
     */
    getNotificationIcon(type) {
        const icons = {
            'status_update': 'sync-alt',
            'payment_confirmed': 'check-circle',
            'order_created': 'shopping-cart',
            'message': 'comment'
        };
        return icons[type] || 'bell';
    }

    /**
     * Get notification title
     */
    getNotificationTitle(type, payload) {
        const titles = {
            'status_update': 'Order Status Updated',
            'payment_confirmed': 'Payment Confirmed',
            'order_created': 'Order Created',
            'message': 'New Message'
        };
        return titles[type] || 'Notification';
    }

    /**
     * Get notification message
     */
    getNotificationMessage(type, payload) {
        if (payload.isi_pesan) return payload.isi_pesan;
        if (payload.message) return payload.message;
        
        const messages = {
            'status_update': `Order #${payload.orderId || ''} status has been updated`,
            'payment_confirmed': `Payment for order #${payload.orderId || ''} has been confirmed`,
            'order_created': `Your order #${payload.orderId || ''} has been created`,
            'message': 'You have a new message'
        };
        return messages[type] || 'You have a new notification';
    }

    /**
     * Format notification time
     */
    formatNotificationTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    /**
     * Format order status
     */
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

    /**
     * Setup event listeners
     * @param {Object} callbacks - Object with callback functions
     */
    setupEventListeners(callbacks) {
        // Form submission
        if (this.profileForm && callbacks.onProfileUpdate) {
            this.profileForm.addEventListener('submit', callbacks.onProfileUpdate);
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn && callbacks.onCancel) {
            cancelBtn.addEventListener('click', callbacks.onCancel);
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && callbacks.onLogout) {
            logoutBtn.addEventListener('click', callbacks.onLogout);
        }

        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotificationDropdown();
                if (callbacks.onNotificationClick) {
                    callbacks.onNotificationClick();
                }
            });
        }

        // Mark all notifications read
        const markAllReadBtn = document.getElementById('markAllNotificationsReadBtn');
        if (markAllReadBtn && callbacks.onMarkAllRead) {
            markAllReadBtn.addEventListener('click', callbacks.onMarkAllRead);
        }

        // Close notification dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            const btn = document.getElementById('notificationBtn');
            if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
                this.hideNotificationDropdown();
            }
        });

        // Chat modal close
        const chatModalClose = document.getElementById('chatModalClose');
        if (chatModalClose && callbacks.onChatModalClose) {
            chatModalClose.addEventListener('click', callbacks.onChatModalClose);
        }

        // Chat input
        const chatInput = document.getElementById('chatInput');
        if (chatInput && callbacks.onSendMessage) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    callbacks.onSendMessage();
                }
            });
        }

        const sendMessageBtn = document.getElementById('sendMessageBtn');
        if (sendMessageBtn && callbacks.onSendMessage) {
            sendMessageBtn.addEventListener('click', callbacks.onSendMessage);
        }

        const refreshChatBtn = document.getElementById('refreshChatBtn');
        if (refreshChatBtn && callbacks.onRefreshChat) {
            refreshChatBtn.addEventListener('click', callbacks.onRefreshChat);
        }
    }

    /**
     * Toggle notification dropdown
     */
    toggleNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    /**
     * Hide notification dropdown
     */
    hideNotificationDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
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






