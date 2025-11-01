// Chat Service
export class ChatService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.socket = null;
    }

    connect() {
        if (this.socket) {
            return this.socket;
        }

        // Import socket.io-client dynamically
        import('https://cdn.socket.io/4.7.4/socket.io.esm.min.js').then(io => {
            this.socket = io.default('http://localhost:3001');
            this.setupSocketListeners();
        });

        return this.socket;
    }

    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Connected to chat server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from chat server');
        });

        this.socket.on('message:new', (message) => {
            this.handleNewMessage(message);
        });

        this.socket.on('order.status.updated', (data) => {
            this.handleStatusUpdate(data);
        });
    }

    joinOrderRoom(orderId) {
        if (this.socket) {
            this.socket.emit('join-order', orderId);
        }
    }

    leaveOrderRoom(orderId) {
        if (this.socket) {
            this.socket.emit('leave-order', orderId);
        }
    }

    sendMessage(orderId, message) {
        if (this.socket) {
            this.socket.emit('chat-message', {
                orderId,
                message,
                senderId: this.getCurrentUserId()
            });
        }
    }

    getCurrentUserId() {
        // This should be implemented to get current user ID
        // For now, return null - should be set by the app
        return this.currentUserId;
    }

    setCurrentUserId(userId) {
        this.currentUserId = userId;
    }

    async getMessages(orderId) {
        try {
            const response = await fetch(`${this.baseURL}/chat/orders/${orderId}/messages`, {
                credentials: 'include'
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Get messages error:', error);
            throw error;
        }
    }

    async sendMessageAPI(orderId, message) {
        try {
            const response = await fetch(`${this.baseURL}/chat/orders/${orderId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ message })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Send message API error:', error);
            throw error;
        }
    }

    async getNotifications(page = 1, limit = 20) {
        try {
            const response = await fetch(`${this.baseURL}/chat/notifications?page=${page}&limit=${limit}`, {
                credentials: 'include'
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Get notifications error:', error);
            throw error;
        }
    }

    async markNotificationAsRead(notificationId) {
        try {
            const response = await fetch(`${this.baseURL}/chat/notifications/${notificationId}/read`, {
                method: 'PATCH',
                credentials: 'include'
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Mark notification as read error:', error);
            throw error;
        }
    }

    async getUnreadCount() {
        try {
            const response = await fetch(`${this.baseURL}/chat/notifications/unread-count`, {
                credentials: 'include'
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Get unread count error:', error);
            throw error;
        }
    }

    handleNewMessage(message) {
        // Emit custom event for the UI to handle
        const event = new CustomEvent('chat:message', { detail: message });
        document.dispatchEvent(event);
    }

    handleStatusUpdate(data) {
        // Emit custom event for the UI to handle
        const event = new CustomEvent('chat:status-update', { detail: data });
        document.dispatchEvent(event);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}



