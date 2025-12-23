// Complaint Service - API calls untuk complaints
import API_CONFIG from '../config.js';

export class ComplaintService {
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

    async submitComplaint(data) {
        try {
            const response = await fetch(`${this.baseURL}/complaints`, {
                method: 'POST',
                headers: this.getHeaders(),
                credentials: 'include',
                body: JSON.stringify(data)
            });

            return await response.json();
        } catch (error) {
            console.error('Submit complaint error:', error);
            throw error;
        }
    }

    async getComplaints(page = 1, limit = 10, status = '') {
        try {
            let url = `${this.baseURL}/complaints/me?page=${page}&limit=${limit}`;
            if (status) {
                url += `&status=${status}`;
            }

            const response = await fetch(url, {
                headers: this.getHeaders(),
                credentials: 'include'
            });

            return await response.json();
        } catch (error) {
            console.error('Get complaints error:', error);
            throw error;
        }
    }

    async getComplaintDetail(id) {
        try {
            const response = await fetch(`${this.baseURL}/complaints/${id}`, {
                headers: this.getHeaders(),
                credentials: 'include'
            });

            return await response.json();
        } catch (error) {
            console.error('Get complaint detail error:', error);
            throw error;
        }
    }

    // Admin methods
    async getAdminComplaints(page = 1, limit = 10, status = '', search = '') {
        try {
            let url = `${this.baseURL}/complaints/admin/all?page=${page}&limit=${limit}`;
            if (status) {
                url += `&status=${status}`;
            }
            if (search) {
                url += `&search=${encodeURIComponent(search)}`;
            }

            const response = await fetch(url, {
                headers: this.getHeaders(),
                credentials: 'include'
            });

            return await response.json();
        } catch (error) {
            console.error('Get admin complaints error:', error);
            throw error;
        }
    }

    async updateComplaintStatus(complaintId, status, adminResponse = null) {
        try {
            const response = await fetch(`${this.baseURL}/complaints/admin/${complaintId}/status`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    status,
                    admin_response: adminResponse || null
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Update complaint status error:', error);
            throw error;
        }
    }
}

