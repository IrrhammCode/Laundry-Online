// Profile Controller - MVC Pattern (Sesuai DPPL)
import { AuthService } from '../models/AuthService.js';
import { ChatService } from '../services/chat.js';
import { ProfileView } from '../views/ProfileView.js';

export class ProfileController {
    constructor() {
        // Model layer - Sesuai DPPL
        this.authService = new AuthService();
        this.chatService = new ChatService();
        
        // View layer
        this.view = new ProfileView();
        
        // Business state
        this.currentUser = null;
        this.currentOrderId = null;
        this.notificationsPage = 1;
        this.chatHistory = [];
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadProfile();
        this.setupEventListeners();
        
        // Load notifications count for badge
        await this.loadNotificationCount();
        
        // Setup tab switching
        this.setupTabs();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user) {
                // Only CUSTOMER can access this page
                if (user.role !== 'CUSTOMER') {
                    if (user.role === 'ADMIN') {
                        this.view.redirect('admin/dashboard.html');
                    } else {
                        this.view.redirect('index.html');
                    }
                    return;
                }
                this.currentUser = user;
                this.view.showUserNav(user);
            } else {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const parsedUser = JSON.parse(userInfo);
                    if (parsedUser.role !== 'CUSTOMER') {
                        if (parsedUser.role === 'ADMIN') {
                            this.view.redirect('admin/dashboard.html');
                        } else {
                            this.view.redirect('index.html');
                        }
                        return;
                    }
                    this.currentUser = parsedUser;
                    this.view.showUserNav(parsedUser);
                } else {
                    this.view.redirect('index.html');
                }
            }
        } catch (error) {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const parsedUser = JSON.parse(userInfo);
                if (parsedUser.role !== 'CUSTOMER') {
                    if (parsedUser.role === 'ADMIN') {
                        this.view.redirect('admin/dashboard.html');
                    } else {
                        this.view.redirect('index.html');
                    }
                    return;
                }
                this.currentUser = parsedUser;
                this.view.showUserNav(parsedUser);
            } else {
                this.view.redirect('index.html');
            }
        }
    }

    async loadProfile() {
        try {
            const user = await this.authService.getCurrentUser();
            this.currentUser = user;
            this.view.renderProfile(user);
        } catch (error) {
            this.view.showAlert('Failed to load profile', 'error');
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        const data = this.view.getFormData();
        if (!data) return;

        // Business Logic: Validate password fields
        if (data.newPassword || data.currentPassword || data.confirmPassword) {
            if (!data.currentPassword) {
                this.view.showAlert('Current password is required to change password', 'error');
                return;
            }

            if (!data.newPassword) {
                this.view.showAlert('New password is required', 'error');
                return;
            }

            if (data.newPassword !== data.confirmPassword) {
                this.view.showAlert('New passwords do not match', 'error');
                return;
            }

            if (data.newPassword.length < 6) {
                this.view.showAlert('New password must be at least 6 characters', 'error');
                return;
            }
        }

        try {
            this.view.showLoading();
            
            // Business Logic: Prepare update data
            const updateData = {
                name: data.name,
                phone: data.phone,
                address: data.address
            };

            // If password change is requested
            if (data.newPassword) {
                updateData.currentPassword = data.currentPassword;
                updateData.newPassword = data.newPassword;
            }

            const result = await this.updateProfile(updateData);
            
            if (result.ok) {
                this.view.showAlert('Profile updated successfully!', 'success');
                await this.loadProfile();
                this.view.resetForm();
            } else {
                this.view.showAlert(result.error || 'Failed to update profile', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to update profile. Please try again.', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    async updateProfile(data) {
        try {
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            return await response.json();
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.view.setupEventListeners({
            onProfileUpdate: (e) => this.handleProfileUpdate(e),
            onCancel: () => this.loadProfile(),
            onLogout: () => this.logout(),
            onNotificationClick: () => this.loadNotificationList(),
            onMarkAllRead: () => this.markAllNotificationsAsRead(),
            onChatModalClose: () => {
                this.currentOrderId = null;
                this.view.hideChatModal();
            },
            onSendMessage: () => this.sendMessage(),
            onRefreshChat: () => this.refreshChat()
        });
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;

                // Remove active class from all tabs
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab
                btn.classList.add('active');
                document.getElementById(`${targetTab}Tab`).classList.add('active');

                // Load content based on tab
                if (targetTab === 'notifications') {
                    this.loadNotifications();
                } else if (targetTab === 'chat') {
                    this.loadChatHistory();
                }
            });
        });
    }

    async loadNotificationCount() {
        try {
            const result = await this.chatService.getUnreadCount();
            if (result.ok) {
                this.view.updateNotificationBadge(result.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Load notification count error:', error);
        }
    }

    async loadNotificationList() {
        try {
            const result = await this.chatService.getNotifications(1, 10);
            if (result.ok) {
                this.view.renderNotifications(result.data.notifications || []);
            }
        } catch (error) {
            console.error('Load notification list error:', error);
        }
    }

    async loadNotifications(page = 1) {
        try {
            this.notificationsPage = page;
            this.view.showNotificationsLoading();

            const result = await this.chatService.getNotifications(page, 10);
            if (result.ok) {
                this.view.renderNotifications(result.data.notifications || []);
                this.view.updateNotificationsPagination(result.data.pagination || {});
            } else {
                this.view.showNotificationsError(result.error || 'Failed to load notifications');
            }
        } catch (error) {
            console.error('Load notifications error:', error);
            this.view.showNotificationsError('Failed to load notifications');
        }
    }

    async markAllNotificationsAsRead() {
        try {
            const result = await this.chatService.getNotifications(1, 100);
            if (result.ok) {
                const notifications = result.data.notifications || [];
                const unreadNotifications = notifications.filter(n => !n.sent_at);
                
                for (const notif of unreadNotifications) {
                    await this.chatService.markNotificationAsRead(notif.id);
                }
                
                await this.loadNotificationCount();
                await this.loadNotifications(this.notificationsPage);
            }
        } catch (error) {
            console.error('Mark all as read error:', error);
        }
    }

    async loadChatHistory() {
        try {
            this.view.showChatHistoryLoading();

            // Get user orders first
            const { OrderService } = await import('../services/order.js');
            const orderService = new OrderService();
            const ordersResult = await orderService.getUserOrders(1, 50);

            if (ordersResult.ok) {
                const orders = ordersResult.data.orders || [];
                
                // Load chat for each order
                const chatHistory = [];
                for (const order of orders) {
                    try {
                        const chatResult = await this.chatService.getMessages(order.id);
                        if (chatResult.ok && chatResult.data.messages && chatResult.data.messages.length > 0) {
                            chatHistory.push({
                                order: order,
                                messages: chatResult.data.messages,
                                lastMessage: chatResult.data.messages[chatResult.data.messages.length - 1]
                            });
                        }
                    } catch (error) {
                        console.error(`Error loading chat for order ${order.id}:`, error);
                    }
                }

                this.view.renderChatHistory(chatHistory);
            } else {
                this.view.showChatHistoryError('Failed to load orders');
            }
        } catch (error) {
            console.error('Load chat history error:', error);
            this.view.showChatHistoryError('Failed to load chat history');
        }
    }

    async openChat(orderId) {
        this.currentOrderId = orderId;
        
        try {
            // Get order detail
            const { OrderService } = await import('../services/order.js');
            const orderService = new OrderService();
            const orderResult = await orderService.getOrderDetail(orderId);
            
            if (orderResult.ok) {
                this.view.showChatModal(orderResult.data.order);
                await this.loadChatMessages(orderId);
            }
        } catch (error) {
            console.error('Open chat error:', error);
        }
    }

    async loadChatMessages(orderId) {
        try {
            const result = await this.chatService.getMessages(orderId);
            if (result.ok) {
                const currentUserId = this.currentUser ? this.currentUser.id : null;
                this.view.renderChat(result.data.messages || [], currentUserId);
            }
        } catch (error) {
            console.error('Load chat messages error:', error);
        }
    }

    async sendMessage() {
        const message = this.view.getChatInput();
        if (!message || !this.currentOrderId) return;

        try {
            this.view.showLoading();
            const result = await this.chatService.sendMessageAPI(this.currentOrderId, message);
            
            if (result.ok) {
                this.view.clearChatInput();
                await this.loadChatMessages(this.currentOrderId);
            } else {
                this.view.showAlert(result.error || 'Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Send message error:', error);
            this.view.showAlert('Failed to send message', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    async refreshChat() {
        if (this.currentOrderId) {
            await this.loadChatMessages(this.currentOrderId);
        }
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

let profileController;

document.addEventListener('DOMContentLoaded', () => {
    profileController = new ProfileController();
    window.profileController = profileController;
});






