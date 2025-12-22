// History Controller - MVC Pattern (Sesuai DPPL)
// Handles business logic and coordinates Model and View
import { AuthService } from '../models/AuthService.js';
import { RiwayatService } from '../models/RiwayatService.js';
import { ChatService } from '../services/chat.js';
import { ReviewService } from '../models/ReviewService.js';
import { HistoryView } from '../views/HistoryView.js';

export class HistoryController {
    constructor() {
        // Model layer - Sesuai DPPL
        this.authService = new AuthService();
        this.riwayatService = new RiwayatService();
        this.chatService = new ChatService();
        this.reviewService = new ReviewService();
        
        // View layer
        this.view = new HistoryView();
        
        // Business state
        this.currentPage = 1;
        this.currentStatus = '';
        this.currentOrderId = null;
        this.currentDeliveryOrderId = null;
        
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
                // Only CUSTOMER can access this page
                if (user.role !== 'CUSTOMER') {
                    if (user.role === 'ADMIN') {
                        this.view.redirect('admin/dashboard.html');
                    } else {
                        this.view.redirect('index.html');
                    }
                    return;
                }
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
                this.view.showUserNav(parsedUser);
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

    /**
     * Show delivery method selection modal
     */
    async chooseDeliveryMethod(orderId) {
        this.currentDeliveryOrderId = orderId;
        this.view.showDeliveryMethodModal();
        this.setupDeliveryMethodListeners();
    }

    setupDeliveryMethodListeners() {
        const selfPickupBtn = document.getElementById('selfPickupBtn');
        const deliveryBtn = document.getElementById('deliveryBtn');
        const cancelBtn = document.getElementById('cancelDeliveryMethodBtn');
        const closeBtn = document.getElementById('deliveryMethodModalClose');

        // Remove existing listeners by cloning
        if (selfPickupBtn) {
            const newSelfBtn = selfPickupBtn.cloneNode(true);
            selfPickupBtn.parentNode.replaceChild(newSelfBtn, selfPickupBtn);
            newSelfBtn.addEventListener('click', () => {
                if (this.currentDeliveryOrderId) {
                    this.chooseDelivery(this.currentDeliveryOrderId, 'SELF_PICKUP');
                    this.view.hideDeliveryMethodModal();
                }
            });
            newSelfBtn.addEventListener('mouseenter', () => {
                newSelfBtn.style.borderColor = '#28a745';
                newSelfBtn.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.2)';
            });
            newSelfBtn.addEventListener('mouseleave', () => {
                newSelfBtn.style.borderColor = '#ddd';
                newSelfBtn.style.boxShadow = 'none';
            });
        }

        if (deliveryBtn) {
            const newDeliveryBtn = deliveryBtn.cloneNode(true);
            deliveryBtn.parentNode.replaceChild(newDeliveryBtn, deliveryBtn);
            newDeliveryBtn.addEventListener('click', () => {
                if (this.currentDeliveryOrderId) {
                    this.chooseDelivery(this.currentDeliveryOrderId, 'DELIVERY');
                    this.view.hideDeliveryMethodModal();
                }
            });
            newDeliveryBtn.addEventListener('mouseenter', () => {
                newDeliveryBtn.style.borderColor = '#007bff';
                newDeliveryBtn.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.2)';
            });
            newDeliveryBtn.addEventListener('mouseleave', () => {
                newDeliveryBtn.style.borderColor = '#ddd';
                newDeliveryBtn.style.boxShadow = 'none';
            });
        }

        if (cancelBtn) {
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            newCancelBtn.addEventListener('click', () => {
                this.view.hideDeliveryMethodModal();
                this.currentDeliveryOrderId = null;
            });
        }

        if (closeBtn) {
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', () => {
                this.view.hideDeliveryMethodModal();
                this.currentDeliveryOrderId = null;
            });
        }
    }

    /**
     * Choose delivery method (SELF_PICKUP or DELIVERY)
     */
    async chooseDelivery(orderId, deliveryMethod) {
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
            
            const response = await fetch(`${apiURL}/orders/${orderId}/choose-delivery`, {
                method: 'PATCH',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify({ delivery_method: deliveryMethod })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (result.ok) {
                this.view.hideLoading();
                this.view.showAlert(result.message || 'Delivery method selected successfully!', 'success');
                // Reload order detail to show payment section if needed
                await this.loadOrderDetail(orderId);
                // Reload orders list
                await this.loadOrders();
            } else {
                this.view.hideLoading();
                this.view.showAlert(result.error || 'Failed to select delivery method', 'error');
            }
        } catch (error) {
            this.view.hideLoading();
            this.view.showAlert('Failed to select delivery method. Please try again.', 'error');
        }
    }

    /**
     * Pay QRIS (Mock Payment)
     */
    async payQRIS(orderId) {
        try {
            const confirmed = confirm('Konfirmasi pembayaran delivery fee? (Ini adalah mock payment)');
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
            const response = await fetch(`${apiURL}/orders/${orderId}/pay-qris`, {
                method: 'POST',
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
                this.view.showAlert('Pembayaran berhasil! Pesanan akan segera dikirim.', 'success');
                // Reload order detail
                await this.loadOrderDetail(orderId);
                // Reload orders list
                await this.loadOrders();
            } else {
                this.view.hideLoading();
                this.view.showAlert(result.error || 'Failed to process payment', 'error');
            }
        } catch (error) {
            this.view.hideLoading();
            this.view.showAlert('Failed to process payment. Please try again.', 'error');
        }
    }

    /**
     * Open chat modal untuk order tertentu
     */
    async openChat(orderId) {
        this.currentOrderId = orderId;
        
        try {
            // Load order detail untuk menampilkan info di chat header
            const result = await this.riwayatService.getDetailPesanan(orderId);
            if (result.ok) {
                this.view.showChatModal(result.data.order);
                await this.loadChatMessages(orderId);
            } else {
                this.view.showAlert('Failed to load order details', 'error');
            }
        } catch (error) {
            console.error('Failed to open chat:', error);
            this.view.showAlert('Failed to open chat', 'error');
        }
    }

    /**
     * Load chat messages (polling-based, tidak real-time)
     */
    async loadChatMessages(orderId) {
        try {
            const result = await this.chatService.getMessages(orderId);
            if (result.ok) {
                const currentUserId = await this.getCurrentUserId();
                this.view.renderChat(result.data.messages, currentUserId);
            } else {
                console.error('Failed to load messages:', result.error);
            }
        } catch (error) {
            console.error('Failed to load chat messages:', error);
            this.view.showAlert('Failed to load messages', 'error');
        }
    }

    /**
     * Send chat message
     */
    async sendMessage() {
        const message = this.view.getChatInput();
        if (!message) return;

        if (!this.currentOrderId) {
            this.view.showAlert('No order selected', 'error');
            return;
        }

        try {
            this.view.showLoading();
            const result = await this.chatService.sendMessageAPI(this.currentOrderId, message);
            
            if (result.ok) {
                this.view.clearChatInput();
                // Reload messages setelah kirim
                await this.loadChatMessages(this.currentOrderId);
            } else {
                this.view.showAlert(result.error || 'Failed to send message', 'error');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            this.view.showAlert('Failed to send message. Please try again.', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    /**
     * Refresh chat messages (untuk polling manual)
     */
    async refreshChat() {
        if (this.currentOrderId) {
            await this.loadChatMessages(this.currentOrderId);
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

    /**
     * Open review modal untuk order tertentu
     */
    async openReview(orderId) {
        this.currentOrderId = orderId;
        
        // Set order ID di form
        const reviewOrderIdInput = document.getElementById('reviewOrderId');
        if (reviewOrderIdInput) {
            reviewOrderIdInput.value = orderId;
        }
        
        // Reset form
        const ratingValueInput = document.getElementById('ratingValue');
        const reviewComment = document.getElementById('reviewComment');
        if (ratingValueInput) ratingValueInput.value = '';
        if (reviewComment) reviewComment.value = '';
        
        // Reset rating stars
        const ratingStars = document.querySelectorAll('#ratingInput .fas.fa-star');
        ratingStars.forEach(star => {
            star.classList.remove('active');
        });
        
        // Setup rating stars
        this.setupRatingStars();
        
        // Show modal
        this.view.showReviewModal();
    }

    /**
     * Setup rating stars interaction
     */
    setupRatingStars() {
        const ratingStars = document.querySelectorAll('#ratingInput .fas.fa-star');
        const ratingValueInput = document.getElementById('ratingValue');
        
        ratingStars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const rating = index + 1;
                
                // Update stars display
                ratingStars.forEach((s, i) => {
                    if (i < rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
                
                // Update hidden input
                if (ratingValueInput) {
                    ratingValueInput.value = rating;
                }
            });
            
            star.addEventListener('mouseenter', () => {
                const rating = index + 1;
                ratingStars.forEach((s, i) => {
                    if (i < rating) {
                        s.style.color = '#ffc107';
                    } else {
                        s.style.color = '#ddd';
                    }
                });
            });
        });
        
        // Reset on mouse leave
        const ratingInput = document.getElementById('ratingInput');
        if (ratingInput) {
            ratingInput.addEventListener('mouseleave', () => {
                const currentRating = ratingValueInput ? parseInt(ratingValueInput.value) : 0;
                ratingStars.forEach((s, i) => {
                    if (i < currentRating) {
                        s.style.color = '#ffc107';
                    } else {
                        s.style.color = '#ddd';
                    }
                });
            });
        }
    }

    /**
     * Submit review
     */
    async submitReview(e) {
        e.preventDefault();
        
        const reviewOrderIdInput = document.getElementById('reviewOrderId');
        const ratingValueInput = document.getElementById('ratingValue');
        const reviewComment = document.getElementById('reviewComment');
        
        if (!reviewOrderIdInput || !ratingValueInput) {
            this.view.showAlert('Form error', 'error');
            return;
        }
        
        const orderId = reviewOrderIdInput.value;
        const rating = parseInt(ratingValueInput.value);
        const comment = reviewComment ? reviewComment.value.trim() : '';
        
        if (!rating || rating < 1 || rating > 5) {
            this.view.showAlert('Please select a rating', 'error');
            return;
        }
        
        try {
            this.view.showLoading();
            
            const result = await this.reviewService.submitReview({
                order_id: parseInt(orderId),
                rating: rating,
                comment: comment || null
            });
            
            if (result.ok) {
                this.view.hideReviewModal();
                this.view.showAlert('Review submitted successfully!', 'success');
                // Reload orders
                await this.loadOrders();
            } else {
                this.view.showAlert(result.error || 'Failed to submit review', 'error');
            }
        } catch (error) {
            console.error('Submit review error:', error);
            this.view.showAlert('Failed to submit review. Please try again.', 'error');
        } finally {
            this.view.hideLoading();
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
                this.currentOrderId = null;
                this.view.hideChatModal();
            },
            onSendMessage: () => this.sendMessage(),
            onRefreshChat: () => this.refreshChat(),
            onReviewSubmit: (e) => this.submitReview(e),
            onReviewModalClose: () => {
                this.currentOrderId = null;
                this.view.hideReviewModal();
            }
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
    window.openReview = (orderId) => historyController.openReview(orderId);
    window.chooseDeliveryMethod = (orderId) => historyController.chooseDeliveryMethod(orderId);
    window.payQRIS = (orderId) => historyController.payQRIS(orderId);
});






