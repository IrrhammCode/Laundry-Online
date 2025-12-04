// History Controller - MVC Pattern (Sesuai DPPL)
// Handles business logic and coordinates Model and View
import { AuthService } from '../models/AuthService.js';
import { RiwayatService } from '../models/RiwayatService.js';
import { ChatService } from '../services/chat.js';
import { HistoryView } from '../views/HistoryView.js';

export class HistoryController {
    constructor() {
        // Model layer - Sesuai DPPL
        this.authService = new AuthService();
        this.riwayatService = new RiwayatService();
        this.chatService = new ChatService();
        
        // View layer
        this.view = new HistoryView();
        
        // Business state
        this.currentPage = 1;
        this.currentStatus = '';
        this.currentOrderId = null;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadOrders();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user) {
                this.view.showUserNav(user);
            } else {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    this.view.showUserNav(JSON.parse(userInfo));
                } else {
                    this.view.redirect('index.html');
                }
            }
        } catch (error) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                this.view.showUserNav(JSON.parse(userInfo));
            } else {
                this.view.redirect('index.html');
            }
        }
    }

    /**
     * Load orders menggunakan RiwayatService.lihatRiwayat() sesuai Algoritma #9 DPPL
     */
    async loadOrders(page = 1, status = '') {
        try {
            this.currentPage = page;
            this.currentStatus = status;
            
            // Get current user
            const user = this.authService.getCurrentUser();
            if (!user) {
                this.view.redirect('index.html');
                return;
            }
            
            this.view.showLoading();
            
            // Menggunakan RiwayatService.lihatRiwayat() sesuai DPPL Algoritma #9
            const result = await this.riwayatService.lihatRiwayat(user.id, page, 10, status);
            
            if (result.ok) {
                this.view.renderOrders(result.data.orders);
                this.view.renderPagination(result.data.pagination, this.loadOrders.bind(this), this.currentStatus);
            } else {
                this.view.showAlert(result.error || 'Failed to load orders', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to load orders. Please try again.', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    /**
     * Load order detail menggunakan RiwayatService.getDetailPesanan()
     */
    async loadOrderDetail(orderId) {
        try {
            this.view.showLoading();
            
            // Menggunakan RiwayatService.getDetailPesanan()
            const result = await this.riwayatService.getDetailPesanan(orderId);
            
            if (result.ok) {
                this.view.showOrderDetailModal(result.data.order);
            } else {
                this.view.showAlert(result.error || 'Failed to load order details', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to load order details. Please try again.', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    async openChat(orderId) {
        this.currentOrderId = orderId;
        
        try {
            const result = await this.orderService.getOrderDetail(orderId);
            if (result.ok) {
                this.view.showChatModal(result.data.order);
            }
        } catch (error) {
            console.error('Failed to load order details for chat:', error);
        }

        this.chatService.connect();
        this.chatService.joinOrderRoom(orderId);
        this.chatService.setCurrentUserId(await this.getCurrentUserId());
        await this.loadChatMessages(orderId);
        this.setupChatEventListeners();
    }

    async loadChatMessages(orderId) {
        try {
            const result = await this.chatService.getMessages(orderId);
            if (result.ok) {
                const currentUserId = await this.getCurrentUserId();
                this.view.renderChat(result.data.messages, currentUserId);
            }
        } catch (error) {
            console.error('Failed to load chat messages:', error);
        }
    }

    setupChatEventListeners() {
        document.addEventListener('chat:message', (e) => {
            const message = e.detail;
            if (message.orderId === this.currentOrderId) {
                this.loadChatMessages(this.currentOrderId);
            }
        });
    }

    async sendMessage() {
        const message = this.view.getChatInput();
        if (!message) return;

        try {
            await this.chatService.sendMessageAPI(this.currentOrderId, message);
            this.view.clearChatInput();
            await this.loadChatMessages(this.currentOrderId);
        } catch (error) {
            this.view.showAlert('Failed to send message', 'error');
        }
    }

    async getCurrentUserId() {
        try {
            const user = await this.authService.getCurrentUser();
            return user ? user.id : null;
        } catch (error) {
            return null;
        }
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onStatusFilterChange: (e) => {
                this.currentStatus = e.target.value;
                this.currentPage = 1;
                this.loadOrders(1, this.currentStatus);
            },
            onRefresh: () => this.loadOrders(this.currentPage, this.currentStatus),
            onLogout: () => this.logout(),
            onChatModalClose: () => {
                if (this.currentOrderId) {
                    this.chatService.leaveOrderRoom(this.currentOrderId);
                }
                this.view.hideChatModal();
            },
            onSendMessage: () => this.sendMessage()
        });
    }

    async logout() {
        try {
            await this.authService.logout();
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            this.view.redirect('index.html');
        } catch (error) {
            this.view.showAlert('Logout failed', 'error');
        }
    }
}

let historyController;

document.addEventListener('DOMContentLoaded', () => {
    historyController = new HistoryController();
    window.historyController = historyController;
    
    window.viewOrder = (orderId) => historyController.loadOrderDetail(orderId);
    window.openChat = (orderId) => historyController.openChat(orderId);
});






