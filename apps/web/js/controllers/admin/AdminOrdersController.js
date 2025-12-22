// Admin Orders Controller - MVC Pattern (Sesuai DPPL)
import { AdminAuthService } from '../../models/AdminAuthService.js';
import { AdminPesananService } from '../../models/AdminPesananService.js';
import { StatusLaundry } from '../../models/StatusLaundry.js';
import { AdminOrdersView } from '../../views/admin/AdminOrdersView.js';
import { ChatService } from '../../services/chat.js';

export class AdminOrdersController {
    constructor() {
        // Model layer - Sesuai DPPL
        this.adminAuthService = new AdminAuthService();
        this.adminPesananService = new AdminPesananService();
        this.statusLaundry = new StatusLaundry();
        this.view = new AdminOrdersView();
        this.chatService = new ChatService();
        
        this.currentPage = 1;
        this.currentStatus = '';
        this.currentSearch = '';
        this.currentChatOrderId = null;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadOrders();
    }

    async checkAuth() {
        try {
            // Check localStorage first (more reliable after redirect)
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user && user.role === 'ADMIN') {
                    this.view.showUserNav(user);
                    return;
                }
            }
            
            // Fallback to AdminAuthService
            const admin = this.adminAuthService.getCurrentAdmin();
            if (admin && admin.role === 'ADMIN') {
                // Update localStorage
                localStorage.setItem('userInfo', JSON.stringify(admin));
                this.view.showUserNav(admin);
            } else {
                // Redirect to admin login page
                this.view.redirect('login.html');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // Try localStorage fallback
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user && user.role === 'ADMIN') {
                    this.view.showUserNav(user);
                } else {
                    // Redirect to admin login page
                    this.view.redirect('login.html');
                }
            } else {
                // Redirect to admin login page
                this.view.redirect('login.html');
            }
        }
    }

    /**
     * Load orders menggunakan AdminPesananService.lihatSemuaPesanan() sesuai Algoritma #13 DPPL
     */
    async loadOrders() {
        try {
            this.view.showLoading();
            
            // Menggunakan AdminPesananService.lihatSemuaPesanan() sesuai DPPL Algoritma #13
            const result = await this.adminPesananService.lihatSemuaPesanan(
                this.currentPage,
                10,
                this.currentStatus
            );
            
            if (result.ok) {
                this.view.renderOrders(result.data.orders);
                this.view.updatePagination(result.data.pagination);
            } else {
                this.view.showAlert(result.error || 'Failed to load orders', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to load orders', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    /**
     * Update status menggunakan AdminPesananService.ubahStatusPesanan() sesuai Algoritma #15 DPPL
     * atau StatusLaundry.updateStatus()
     */
    async updateStatus(orderId, newStatus) {
        try {
            this.view.showLoading();
            
            // Menggunakan AdminPesananService.ubahStatusPesanan() sesuai DPPL Algoritma #15
            const result = await this.adminPesananService.ubahStatusPesanan(orderId, newStatus);
            
            if (result.ok) {
                this.view.showAlert('Order status updated successfully', 'success');
                this.loadOrders();
            } else {
                this.view.showAlert(result.error || 'Failed to update order status', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to update order status', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    /**
     * View order detail menggunakan AdminPesananService.getDetailPesanan()
     */
    async viewOrder(orderId) {
        try {
            this.view.showLoading();
            
            // Menggunakan AdminPesananService.getDetailPesanan()
            const result = await this.adminPesananService.getDetailPesanan(orderId);
            
            if (result.ok) {
                this.view.showOrderDetailModal(result.data.order);
            } else {
                this.view.showAlert(result.error || 'Failed to load order details', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to load order details', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    /**
     * Open chat untuk order tertentu
     */
    async openChat(orderId) {
        this.currentChatOrderId = orderId;
        
        try {
            // Get order details for chat header
            const result = await this.adminPesananService.getDetailPesanan(orderId);
            if (result.ok) {
                const order = result.data.order;
                
                // Update chat header
                const chatOrderId = document.getElementById('adminChatOrderId');
                const chatOrderStatus = document.getElementById('adminChatOrderStatus');
                
                if (chatOrderId) chatOrderId.textContent = order.id;
                if (chatOrderStatus) {
                    chatOrderStatus.textContent = this.view.formatOrderStatus(order.status);
                    chatOrderStatus.className = `status-badge status-${order.status.toLowerCase().replace(/_/g, '-')}`;
                }
            }
            
            // Connect to chat service
            this.chatService.connect();
            this.chatService.joinOrderRoom(orderId);
            
            // Get current user ID
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                this.chatService.setCurrentUserId(user.id);
            }
            
            // Load chat messages
            await this.loadChatMessages(orderId);
            
            // Setup chat event listeners
            this.setupChatEventListeners();
            
            // Show chat modal
            this.view.showChatModal();
            
        } catch (error) {
            console.error('Failed to open chat:', error);
            this.view.showAlert('Failed to open chat', 'error');
        }
    }

    async loadChatMessages(orderId) {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${orderId}/messages`, {
                headers: headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                const messages = result.data.messages || [];
                const userInfo = localStorage.getItem('userInfo');
                const currentUserId = userInfo ? JSON.parse(userInfo).id : null;
                
                this.view.renderChat(messages, currentUserId);
            }
        } catch (error) {
            console.error('Failed to load chat messages:', error);
            this.view.showAlert('Failed to load chat messages', 'error');
        }
    }

    async sendChatMessage() {
        if (!this.currentChatOrderId) return;
        
        const chatInput = document.getElementById('adminChatInput');
        if (!chatInput) return;
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {
                'Content-Type': 'application/json'
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${this.currentChatOrderId}/messages`, {
                method: 'POST',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({ message })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                chatInput.value = '';
                // Reload messages
                await this.loadChatMessages(this.currentChatOrderId);
            } else {
                this.view.showAlert(result.error || 'Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            this.view.showAlert('Failed to send message', 'error');
        }
    }

    setupChatEventListeners() {
        // Send message button
        const sendBtn = document.getElementById('adminSendMessageBtn');
        if (sendBtn) {
            sendBtn.onclick = () => this.sendChatMessage();
        }
        
        // Chat input enter key
        const chatInput = document.getElementById('adminChatInput');
        if (chatInput) {
            chatInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            };
        }
        
        // Refresh chat button
        const refreshBtn = document.getElementById('refreshAdminChatBtn');
        if (refreshBtn) {
            refreshBtn.onclick = () => {
                if (this.currentChatOrderId) {
                    this.loadChatMessages(this.currentChatOrderId);
                }
            };
        }
        
        // Chat modal close
        const chatModalClose = document.getElementById('chatModalClose');
        if (chatModalClose) {
            chatModalClose.addEventListener('click', () => this.closeChat());
        }
        
        // Listen for new messages via socket
        document.addEventListener('chat:message', (e) => {
            if (this.currentChatOrderId && e.detail.orderId === this.currentChatOrderId) {
                this.loadChatMessages(this.currentChatOrderId);
            }
        });
    }

    closeChat() {
        if (this.currentChatOrderId && this.chatService) {
            this.chatService.leaveOrderRoom(this.currentChatOrderId);
        }
        this.currentChatOrderId = null;
        this.view.hideChatModal();
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onApplyFilters: () => {
                this.currentStatus = this.view.getStatusFilter();
                this.currentSearch = this.view.getSearchInput();
                this.currentPage = 1;
                this.loadOrders();
            },
            onPrevPage: () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.loadOrders();
                }
            },
            onNextPage: () => {
                this.currentPage++;
                this.loadOrders();
            },
            onLogout: () => this.logout()
        });
    }

    async logout() {
        try {
            await this.authService.logout();
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminInfo');
            // Redirect to landing page
            window.location.href = '../../index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Clear localStorage even if API call fails
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminInfo');
            // Redirect to landing page
            window.location.href = '../../index.html';
        }
    }
}

let adminOrdersController;

document.addEventListener('DOMContentLoaded', () => {
    adminOrdersController = new AdminOrdersController();
    window.adminOrdersController = adminOrdersController;
});






