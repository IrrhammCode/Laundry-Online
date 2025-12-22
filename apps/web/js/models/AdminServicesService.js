// Admin Services Service - API calls untuk admin services
import API_CONFIG from '../config.js';

export class AdminServicesService {
    constructor() {
        this.baseURL = API_CONFIG.baseURL;
    }

    /**
     * Get authentication token
     */
    getAuthToken() {
        // Try to get token from cookie
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'token') {
                return value;
            }
        }
        
        // Fallback to localStorage
        return localStorage.getItem('authToken');
    }

    /**
     * Get headers with authentication
     */
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

    /**
     * Get all services (admin)
     */
    async getAllServices() {
        try {
            const response = await fetch(`${this.baseURL}/admin/services`, {
                headers: this.getHeaders(),
                credentials: 'include'
            });

            const result = await response.json();
            
            if (result.ok) {
                return result.data.services;
            } else {
                throw new Error(result.error || 'Failed to fetch services');
            }
        } catch (error) {
            console.error('Get all services error:', error);
            throw error;
        }
    }

    /**
     * Create new service
     */
    async createService(serviceData) {
        try {
            const response = await fetch(`${this.baseURL}/admin/services`, {
                method: 'POST',
                headers: this.getHeaders(),
                credentials: 'include',
                body: JSON.stringify(serviceData)
            });

            const result = await response.json();
            
            if (result.ok) {
                return result.data.service;
            } else {
                throw new Error(result.error || 'Failed to create service');
            }
        } catch (error) {
            console.error('Create service error:', error);
            throw error;
        }
    }

    /**
     * Update service
     */
    async updateService(serviceId, serviceData) {
        try {
            const response = await fetch(`${this.baseURL}/admin/services/${serviceId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                credentials: 'include',
                body: JSON.stringify(serviceData)
            });

            const result = await response.json();
            
            if (result.ok) {
                return result;
            } else {
                throw new Error(result.error || 'Failed to update service');
            }
        } catch (error) {
            console.error('Update service error:', error);
            throw error;
        }
    }

    /**
     * Delete service
     */
    async deleteService(serviceId) {
        try {
            const response = await fetch(`${this.baseURL}/admin/services/${serviceId}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
                credentials: 'include'
            });

            const result = await response.json();
            
            if (result.ok) {
                return result;
            } else {
                throw new Error(result.error || 'Failed to delete service');
            }
        } catch (error) {
            console.error('Delete service error:', error);
            throw error;
        }
    }
}

