// Review Service - API calls untuk reviews
import API_CONFIG from '../config.js';

export class ReviewService {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
    }

    getAuthToken() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'token') {
                return value;
            }
        }
        return localStorage.getItem('authToken');
    }

    getHeaders() {
        const token = this.getAuthToken();
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    async submitReview(data) {
        try {
            const response = await fetch(`${this.baseURL}/reviews`, {
                method: 'POST',
                headers: this.getHeaders(),
                credentials: 'include',
                body: JSON.stringify(data)
            });

            return await response.json();
        } catch (error) {
            console.error('Submit review error:', error);
            throw error;
        }
    }

    async getOrderReviews(orderId) {
        try {
            const response = await fetch(`${this.baseURL}/reviews/order/${orderId}`, {
                headers: this.getHeaders(),
                credentials: 'include'
            });

            return await response.json();
        } catch (error) {
            console.error('Get order reviews error:', error);
            throw error;
        }
    }

    async getServiceReviews(serviceId, page = 1, limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/reviews/service/${serviceId}?page=${page}&limit=${limit}`, {
                headers: this.getHeaders(),
                credentials: 'include'
            });

            return await response.json();
        } catch (error) {
            console.error('Get service reviews error:', error);
            throw error;
        }
    }

    async getUserReviews(page = 1, limit = 10) {
        try {
            const response = await fetch(`${this.baseURL}/reviews/me?page=${page}&limit=${limit}`, {
                headers: this.getHeaders(),
                credentials: 'include'
            });

            return await response.json();
        } catch (error) {
            console.error('Get user reviews error:', error);
            throw error;
        }
    }
}

