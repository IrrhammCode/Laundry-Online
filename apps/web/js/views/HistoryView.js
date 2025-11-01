// History View - MVP Pattern
// Handles all DOM manipulation for History page
import { UI } from '../utils/ui.js';

export class HistoryView {
    constructor() {
        this.ui = new UI(); // Reuse UI utility
        // Cache DOM elements
        this.ordersList = document.getElementById('ordersList');
        this.paginationEl = document.getElementById('pagination');
        this.orderDetailContent = document.getElementById('orderDetailContent');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendMessageBtn = document.getElementById('sendMessageBtn');
        this.chatOrderId = document.getElementById('chatOrderId');
        this.chatOrderStatus = document.getElementById('chatOrderStatus');
    }

    /**
     * Render orders list
     * @param {Array} orders - Array of order objects
     */
    renderOrders(orders) {
        if (!this.ordersList) return;

        if (orders.length === 0) {
            this.ordersList.innerHTML = '<p class="empty-message">No orders found.</p>';
            return;
        }

        this.ordersList.innerHTML = this.ui.renderOrders(orders);
    }

    /**
     * Render pagination controls
     * @param {Object} pagination - Pagination object
     * @param {Function} onPageChange - Callback when page changes
     * @param {string} currentStatus - Current status filter
     */
    renderPagination(pagination, onPageChange, currentStatus) {
        if (!this.paginationEl) return;

        if (pagination.pages <= 1) {
            this.paginationEl.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination-controls">';
        
        // Previous button
        if (pagination.page > 1) {
            paginationHTML += `<button class="btn btn-outline" onclick="window.historyController.loadOrders(${pagination.page - 1}, '${currentStatus}')">Previous</button>`;
        }
        
        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === pagination.page ? 'active' : '';
            paginationHTML += `<button class="btn btn-outline ${activeClass}" onclick="window.historyController.loadOrders(${i}, '${currentStatus}')">${i}</button>`;
        }
        
        // Next button
        if (pagination.page < pagination.pages) {
            paginationHTML += `<button class="btn btn-outline" onclick="window.historyController.loadOrders(${pagination.page + 1}, '${currentStatus}')">Next</button>`;
        }
        
        paginationHTML += '</div>';
        this.paginationEl.innerHTML = paginationHTML;
    }

    /**
     * Render order detail
     * @param {Object} order - Order object
     */
    renderOrderDetail(order) {
        if (!this.orderDetailContent) return;
        this.orderDetailContent.innerHTML = this.ui.renderOrderDetail(order);
    }

    /**
     * Render chat messages
     * @param {Array} messages - Array of message objects
     * @param {number} currentUserId - Current user ID
     */
    renderChat(messages, currentUserId) {
        if (!this.chatMessages) return;

        if (messages.length === 0) {
            this.chatMessages.innerHTML = '<p class="empty-message">No messages yet. Start a conversation!</p>';
            return;
        }

        this.chatMessages.innerHTML = this.ui.renderChat(messages, currentUserId);
        this.scrollChatToBottom();
    }

    /**
     * Scroll chat to bottom
     */
    scrollChatToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }

    /**
     * Show order detail modal
     * @param {Object} order - Order object
     */
    showOrderDetailModal(order) {
        this.renderOrderDetail(order);
        this.ui.showModal('orderDetailModal');
    }

    /**
     * Hide order detail modal
     */
    hideOrderDetailModal() {
        this.ui.hideModal('orderDetailModal');
    }

    /**
     * Show chat modal with order info
     * @param {Object} order - Order object
     */
    showChatModal(order) {
        if (this.chatOrderId) {
            this.chatOrderId.textContent = order.id;
        }
        if (this.chatOrderStatus) {
            this.chatOrderStatus.textContent = this.ui.formatOrderStatus(order.status);
            this.chatOrderStatus.className = `status-badge status-${order.status.toLowerCase()}`;
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
     * Get chat input value
     * @returns {string} - Chat message
     */
    getChatInput() {
        return this.chatInput ? this.chatInput.value.trim() : '';
    }

    /**
     * Clear chat input
     */
    clearChatInput() {
        if (this.chatInput) {
            this.chatInput.value = '';
        }
    }

    /**
     * Get status filter value
     * @returns {string} - Selected status
     */
    getStatusFilter() {
        const statusFilter = document.getElementById('statusFilter');
        return statusFilter ? statusFilter.value : '';
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
     * Setup event listeners
     * @param {Object} callbacks - Object with callback functions
     */
    setupEventListeners(callbacks) {
        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter && callbacks.onStatusFilterChange) {
            statusFilter.addEventListener('change', callbacks.onStatusFilterChange);
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn && callbacks.onRefresh) {
            refreshBtn.addEventListener('click', callbacks.onRefresh);
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && callbacks.onLogout) {
            logoutBtn.addEventListener('click', callbacks.onLogout);
        }

        // Modal close buttons
        const orderDetailModalClose = document.getElementById('orderDetailModalClose');
        if (orderDetailModalClose) {
            orderDetailModalClose.addEventListener('click', () => {
                this.hideOrderDetailModal();
            });
        }

        const chatModalClose = document.getElementById('chatModalClose');
        if (chatModalClose && callbacks.onChatModalClose) {
            chatModalClose.addEventListener('click', callbacks.onChatModalClose);
        }

        // Chat input enter key
        if (this.chatInput && callbacks.onSendMessage) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    callbacks.onSendMessage();
                }
            });
        }

        // Send message button
        if (this.sendMessageBtn && callbacks.onSendMessage) {
            this.sendMessageBtn.addEventListener('click', callbacks.onSendMessage);
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

