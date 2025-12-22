// Admin Dashboard Controller - MVC Pattern
import { AuthService } from '../../services/auth.js';
import { AdminDashboardView } from '../../views/admin/AdminDashboardView.js';
import { ChatService } from '../../services/chat.js';

export class AdminDashboardController {
    constructor() {
        this.authService = new AuthService();
        this.view = new AdminDashboardView();
        this.chatService = new ChatService();
        this.currentOrderId = null;
        this.currentChatOrderId = null;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadDashboardData();
        await this.loadReviews();
        this.setupEventListeners();
        this.setupNotificationListeners();
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
            
            // Fallback to API call
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'ADMIN') {
                // Update localStorage with fresh data
                localStorage.setItem('userInfo', JSON.stringify(user));
                this.view.showUserNav(user);
            } else {
                console.log('User is not admin, redirecting to login');
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
                    console.log('User in localStorage is not admin, redirecting to login');
                    // Redirect to admin login page
                    this.view.redirect('login.html');
                }
            } else {
                console.log('No user info found, redirecting to login');
                // Redirect to admin login page
                this.view.redirect('login.html');
            }
        }
    }

    async loadDashboardData() {
        try {
            // Use single optimized endpoint that returns both stats and recent orders
            await this.loadDashboardStats();
        } catch (error) {
            console.error('Load dashboard data error:', error);
            this.view.showAlert('Failed to load dashboard data', 'error');
        }
    }

    async loadDashboardStats() {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            
            // Add timeout to prevent infinite loading
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(`${apiURL}/admin/dashboard/stats`, {
                headers: headers,
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.status === 401 || response.status === 403) {
                console.error('Authentication failed, redirecting to login');
                this.view.redirect('login.html');
                return;
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Dashboard stats API error:', response.status, errorText);
                this.view.showStatsError(`Failed to load statistics (${response.status})`);
                this.view.showRecentOrdersError(`Failed to load recent orders (${response.status})`);
                return;
            }
            
            const result = await response.json();
            
            if (result.ok && result.data) {
                // Render stats
                this.view.renderStats({
                    orderStats: result.data.orderStats || [],
                    revenue: result.data.revenue || { total_revenue: 0, total_orders: 0 }
                });
                
                // Render recent orders from the same endpoint
                const recentOrders = result.data.recentOrders || [];
                this.view.renderRecentOrders(recentOrders);
            } else {
                console.error('Failed to load dashboard stats:', result.error);
                this.view.showStatsError(result.error || 'Failed to load statistics');
                this.view.showRecentOrdersError(result.error || 'Failed to load recent orders');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Request timeout');
                this.view.showStatsError('Request timeout. Please check your connection.');
                this.view.showRecentOrdersError('Request timeout. Please check your connection.');
            } else {
                console.error('Failed to load dashboard stats:', error);
                this.view.showStatsError(`Failed to load statistics: ${error.message}`);
                this.view.showRecentOrdersError(`Failed to load recent orders: ${error.message}`);
            }
        }
    }

    async loadStats() {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            
            // Add timeout to prevent infinite loading
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(`${apiURL}/admin/dashboard/stats`, {
                headers: headers,
                credentials: 'include',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.status === 401 || response.status === 403) {
                // Authentication failed, redirect to login
                console.error('Authentication failed, redirecting to login');
                this.view.redirect('login.html');
                return;
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Stats API error:', response.status, errorText);
                this.view.showStatsError(`Failed to load statistics (${response.status})`);
                return;
            }
            
            const result = await response.json();
            
            if (result.ok && result.data) {
                this.view.renderStats(result.data);
                // Also render recent orders from the same response
                if (result.data.recentOrders) {
                    this.view.renderRecentOrders(result.data.recentOrders);
                }
            } else {
                console.error('Failed to load stats:', result.error);
                this.view.showStatsError(result.error || 'Failed to load statistics');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Request timeout');
                this.view.showStatsError('Request timeout. Please check your connection.');
            } else {
                console.error('Failed to load stats:', error);
                this.view.showStatsError(`Failed to load statistics: ${error.message}`);
            }
        }
    }

    // Removed loadRecentOrders - now using data from loadStats for efficiency

    async viewOrder(orderId) {
        try {
            this.view.showLoading();
            
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${orderId}`, {
                headers: headers,
                credentials: 'include'
            });
            const result = await response.json();
            
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

    updateOrderStatus(orderId) {
        this.currentOrderId = orderId;
        this.populateStatusOptions(orderId);
        this.view.showStatusModal();
    }
    
    async populateStatusOptions(orderId) {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${orderId}`, {
                headers: headers,
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
                const order = result.data.order;
                const currentStatus = order.status;
                this.view.populateStatusSelect(currentStatus, order);
            }
        } catch (error) {
            console.error('Failed to get order status:', error);
            this.view.populateStatusSelect('DIPESAN');
        }
    }

    async handleStatusUpdate(e) {
        e.preventDefault();
        
        const data = this.view.getStatusFormData();
        if (!data || !data.status) {
            this.view.showAlert('Please select a status', 'error');
            return;
        }
        
        const validStatuses = ['DIPESAN', 'PESANAN_DIJEMPUT', 'DIAMBIL', 'DICUCI', 'MENUNGGU_AMBIL_SENDIRI', 'DIKIRIM', 'SELESAI'];
        if (!validStatuses.includes(data.status)) {
            this.view.showAlert('Invalid status selected', 'error');
            return;
        }

        try {
            this.view.showLoading();
            
            const authToken = localStorage.getItem('authToken');
            let headers = {
                'Content-Type': 'application/json',
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const updateData = {
                status: data.status,
                notes: data.notes || ''
            };
            
            // Add estimated_arrival if provided and status is PESANAN_DIJEMPUT
            if (data.estimated_arrival && data.status === 'PESANAN_DIJEMPUT') {
                updateData.estimated_arrival = data.estimated_arrival;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${this.currentOrderId}/status`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.view.hideLoading();
                this.view.hideStatusModal();
                this.view.showAlert('Order status updated successfully!', 'success');
                this.loadDashboardData();
            } else {
                this.view.hideLoading();
                this.view.showAlert(result.error || 'Failed to update status', 'error');
            }
        } catch (error) {
            this.view.hideLoading();
            this.view.showAlert('Failed to update status. Please try again.', 'error');
        }
    }

    async approveOrder(orderId) {
        try {
            this.view.showLoading();
            
            const authToken = localStorage.getItem('authToken');
            let headers = {
                'Content-Type': 'application/json',
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${orderId}/approve`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.view.hideLoading();
                this.view.showAlert('Order berhasil di-approve!', 'success');
                // Reload order data to update status options
                await this.populateStatusOptions(orderId);
                // Reload dashboard to show updated orders
                this.loadDashboardData();
            } else {
                this.view.hideLoading();
                this.view.showAlert(result.error || 'Failed to approve order', 'error');
            }
        } catch (error) {
            this.view.hideLoading();
            this.view.showAlert('Failed to approve order. Please try again.', 'error');
        }
    }

    async confirmDelivery(orderId) {
        try {
            const confirmed = confirm('Konfirmasi delivery untuk order ini? User akan diminta memilih metode pengambilan (ambil sendiri atau dianter).');
            if (!confirmed) return;

            this.view.showLoading();
            
            const authToken = localStorage.getItem('authToken');
            let headers = {
                'Content-Type': 'application/json',
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${orderId}/confirm-delivery`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({})
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.view.hideLoading();
                this.view.showAlert('Delivery confirmed! User akan diminta memilih metode pengambilan.', 'success');
                // Reload dashboard to show updated orders
                this.loadDashboardData();
            } else {
                this.view.hideLoading();
                this.view.showAlert(result.error || 'Failed to confirm delivery', 'error');
            }
        } catch (error) {
            this.view.hideLoading();
            this.view.showAlert('Failed to confirm delivery. Please try again.', 'error');
        }
    }

    async openChat(orderId) {
        this.currentChatOrderId = orderId;
        
        try {
            // Get order details for chat header
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/orders/${orderId}`, {
                headers: headers,
                credentials: 'include'
            });
            
            if (response.ok) {
                const result = await response.json();
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
        
        // Listen for new messages via socket
        document.addEventListener('chat:message', (e) => {
            if (this.currentChatOrderId && e.detail.orderId === this.currentChatOrderId) {
                this.loadChatMessages(this.currentChatOrderId);
            }
        });
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onLogout: () => this.logout(),
            onStatusUpdate: (e) => this.handleStatusUpdate(e),
            onApproveOrder: (orderId) => this.approveOrder(orderId),
            onChatModalClose: () => this.closeChat()
        });
    }

    closeChat() {
        if (this.currentChatOrderId && this.chatService) {
            this.chatService.leaveOrderRoom(this.currentChatOrderId);
        }
        this.currentChatOrderId = null;
        this.view.hideChatModal();
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

    async loadReviews() {
        try {
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/admin/reviews?page=1&limit=10`, {
                headers: headers,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                const reviews = result.data.reviews || [];
                this.view.renderReviews(reviews);
            }
        } catch (error) {
            console.error('Failed to load reviews:', error);
            const container = document.getElementById('reviewsContainer');
            if (container) {
                container.innerHTML = '<div class="empty-message">Failed to load reviews</div>';
            }
        }
    }
}

let adminDashboardController;

document.addEventListener('DOMContentLoaded', () => {
    adminDashboardController = new AdminDashboardController();
    window.adminDashboardController = adminDashboardController;
});






