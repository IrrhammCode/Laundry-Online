// History Page Module
import { AuthService } from './services/auth.js';
import { OrderService } from './services/order.js';
import { ChatService } from './services/chat.js';
import { UI } from './utils/ui.js';

class HistoryPage {
    constructor() {
        this.authService = new AuthService();
        this.orderService = new OrderService();
        this.chatService = new ChatService();
        this.ui = new UI();
        
        this.currentPage = 1;
        this.currentStatus = '';
        this.currentOrderId = null;
        
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
            console.log('Checking authentication...');
            const user = await this.authService.getCurrentUser();
            console.log('Current user from API:', user);
            if (user) {
                this.ui.showUserNav(user);
            } else {
                // Try localStorage fallback
                const userInfo = localStorage.getItem('userInfo');
                console.log('User info from localStorage:', userInfo);
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    console.log('Using localStorage user:', user);
                    this.ui.showUserNav(user);
                } else {
                    console.log('No user found, redirecting to index');
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            console.log('Fallback - User info from localStorage:', userInfo);
            if (userInfo) {
                const user = JSON.parse(userInfo);
                console.log('Fallback - Using localStorage user:', user);
                this.ui.showUserNav(user);
            } else {
                console.log('Fallback - No user found, redirecting to index');
                window.location.href = 'index.html';
            }
        }
    }

    async loadOrders(page = 1, status = '') {
        try {
            this.ui.showLoading();
            console.log('Loading orders for page:', page, 'status:', status);
            const result = await this.orderService.getUserOrders(page, 10, status);
            console.log('Orders result:', result);
            
            if (result.ok) {
                console.log('Orders loaded successfully:', result.data.orders);
                this.renderOrders(result.data.orders);
                this.renderPagination(result.data.pagination);
            } else {
                console.error('Failed to load orders:', result.error);
                this.ui.showAlert(result.error || 'Failed to load orders', 'error');
            }
        } catch (error) {
            console.error('Load orders error:', error);
            this.ui.showAlert('Failed to load orders. Please try again.', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    renderOrders(orders) {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        if (orders.length === 0) {
            ordersList.innerHTML = '<p class="empty-message">No orders found.</p>';
            return;
        }

        ordersList.innerHTML = this.ui.renderOrders(orders);
    }

    renderPagination(pagination) {
        const paginationEl = document.getElementById('pagination');
        if (!paginationEl) return;

        if (pagination.pages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let paginationHTML = '<div class="pagination-controls">';
        
        // Previous button
        if (pagination.page > 1) {
            paginationHTML += `<button class="btn btn-outline" onclick="historyPage.loadOrders(${pagination.page - 1}, '${this.currentStatus}')">Previous</button>`;
        }
        
        // Page numbers
        const startPage = Math.max(1, pagination.page - 2);
        const endPage = Math.min(pagination.pages, pagination.page + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === pagination.page ? 'active' : '';
            paginationHTML += `<button class="btn btn-outline ${activeClass}" onclick="historyPage.loadOrders(${i}, '${this.currentStatus}')">${i}</button>`;
        }
        
        // Next button
        if (pagination.page < pagination.pages) {
            paginationHTML += `<button class="btn btn-outline" onclick="historyPage.loadOrders(${pagination.page + 1}, '${this.currentStatus}')">Next</button>`;
        }
        
        paginationHTML += '</div>';
        paginationEl.innerHTML = paginationHTML;
    }

    async loadOrderDetail(orderId) {
        try {
            this.ui.showLoading();
            const result = await this.orderService.getOrderDetail(orderId);
            
            if (result.ok) {
                this.renderOrderDetail(result.data.order);
                this.ui.showModal('orderDetailModal');
            } else {
                this.ui.showAlert(result.error || 'Failed to load order details', 'error');
            }
        } catch (error) {
            this.ui.showAlert('Failed to load order details. Please try again.', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    renderOrderDetail(order) {
        const orderDetailContent = document.getElementById('orderDetailContent');
        if (!orderDetailContent) return;

        orderDetailContent.innerHTML = this.ui.renderOrderDetail(order);
    }

    async openChat(orderId) {
        this.currentOrderId = orderId;
        
        // Get order details for chat header
        try {
            const result = await this.orderService.getOrderDetail(orderId);
            if (result.ok) {
                const order = result.data.order;
                document.getElementById('chatOrderId').textContent = order.id;
                document.getElementById('chatOrderStatus').textContent = this.ui.formatOrderStatus(order.status);
                document.getElementById('chatOrderStatus').className = `status-badge status-${order.status.toLowerCase()}`;
            }
        } catch (error) {
            console.error('Failed to load order details for chat:', error);
        }

        // Connect to chat service
        this.chatService.connect();
        this.chatService.joinOrderRoom(orderId);
        this.chatService.setCurrentUserId(await this.getCurrentUserId());

        // Load chat messages
        await this.loadChatMessages(orderId);

        // Setup chat event listeners
        this.setupChatEventListeners();

        this.ui.showModal('chatModal');
    }

    async loadChatMessages(orderId) {
        try {
            const result = await this.chatService.getMessages(orderId);
            if (result.ok) {
                await this.renderChatMessages(result.data.messages);
            }
        } catch (error) {
            console.error('Failed to load chat messages:', error);
        }
    }

    async renderChatMessages(messages) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        if (messages.length === 0) {
            chatMessages.innerHTML = '<p class="empty-message">No messages yet. Start a conversation!</p>';
            return;
        }

        const currentUserId = await this.getCurrentUserId();
        chatMessages.innerHTML = this.ui.renderChat(messages, currentUserId);
        this.scrollChatToBottom();
    }

    setupChatEventListeners() {
        const chatInput = document.getElementById('chatInput');
        const sendMessageBtn = document.getElementById('sendMessageBtn');

        const sendMessage = async () => {
            const message = chatInput.value.trim();
            if (!message) return;

            try {
                await this.chatService.sendMessageAPI(this.currentOrderId, message);
                chatInput.value = '';
            } catch (error) {
                this.ui.showAlert('Failed to send message', 'error');
            }
        };

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        sendMessageBtn.addEventListener('click', sendMessage);

        // Listen for new messages
        document.addEventListener('chat:message', (e) => {
            const message = e.detail;
            if (message.orderId === this.currentOrderId) {
                this.loadChatMessages(this.currentOrderId);
            }
        });
    }

    scrollChatToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    async getCurrentUserId() {
        try {
            const user = await this.authService.getCurrentUser();
            return user.id;
        } catch (error) {
            return null;
        }
    }

    setupEventListeners() {
        // Status filter
        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.currentStatus = e.target.value;
            this.currentPage = 1;
            this.loadOrders(1, this.currentStatus);
        });

        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadOrders(this.currentPage, this.currentStatus);
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Modal close buttons
        document.getElementById('orderDetailModalClose')?.addEventListener('click', () => {
            this.ui.hideModal('orderDetailModal');
        });

        document.getElementById('chatModalClose')?.addEventListener('click', () => {
            this.ui.hideModal('chatModal');
            if (this.currentOrderId) {
                this.chatService.leaveOrderRoom(this.currentOrderId);
            }
        });
    }

    async logout() {
        try {
            await this.authService.logout();
            window.location.href = 'index.html';
        } catch (error) {
            this.ui.showAlert('Logout failed', 'error');
        }
    }
}

// Make historyPage globally available for onclick handlers
let historyPage;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    historyPage = new HistoryPage();
});

// Global functions for onclick handlers
window.historyPage = {
    loadOrders: (page, status) => historyPage.loadOrders(page, status),
    viewOrder: (orderId) => historyPage.loadOrderDetail(orderId),
    openChat: (orderId) => historyPage.openChat(orderId)
};

// Global function for order cards
window.viewOrder = (orderId) => {
    historyPage.loadOrderDetail(orderId);
};

window.openChat = (orderId) => {
    historyPage.openChat(orderId);
};


