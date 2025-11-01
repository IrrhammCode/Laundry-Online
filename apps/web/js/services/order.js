// Order Service
export class OrderService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
    }

    async getServices() {
        try {
            const response = await fetch(`${this.baseURL}/services`);
            const result = await response.json();
            
            if (result.ok) {
                return result.data.services;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Get services error:', error);
            throw error;
        }
    }

    async createOrder(orderData) {
        try {
            console.log('Creating order with data:', orderData);
            console.log('Cookies being sent:', document.cookie);
            
            // Try to get token from localStorage as fallback
            const authToken = localStorage.getItem('authToken');
            let headers = {
                'Content-Type': 'application/json',
            };
            
            // Add Authorization header if we have token
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for authentication');
            }
            
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify(orderData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            // Handle authentication error
            if (response.status === 401) {
                throw new Error('Authentication required. Please login again.');
            }

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Create order error:', error);
            throw error;
        }
    }

    async getUserOrders(page = 1, limit = 10, status = null) {
        try {
            let url = `${this.baseURL}/orders/me?page=${page}&limit=${limit}`;
            if (status) {
                url += `&status=${status}`;
            }

            // Try to get token from localStorage as fallback
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            // Add Authorization header if we have token
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for getUserOrders');
            }

            const response = await fetch(url, {
                headers: headers,
                credentials: 'include'
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Get user orders error:', error);
            throw error;
        }
    }

    async getOrderDetail(orderId) {
        try {
            // Try to get token from localStorage as fallback
            const authToken = localStorage.getItem('authToken');
            let headers = {};
            
            // Add Authorization header if we have token
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for getOrderDetail');
            }

            const response = await fetch(`${this.baseURL}/orders/${orderId}`, {
                headers: headers,
                credentials: 'include'
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Get order detail error:', error);
            throw error;
        }
    }

    async confirmPayment(orderId, paymentData) {
        try {
            // Try to get token from localStorage as fallback
            const authToken = localStorage.getItem('authToken');
            let headers = {
                'Content-Type': 'application/json',
            };
            
            // Add Authorization header if we have token
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
                console.log('Using localStorage token for payment confirmation');
            }
            
            const response = await fetch(`${this.baseURL}/orders/${orderId}/payment/confirm`, {
                method: 'POST',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Confirm payment error:', error);
            throw error;
        }
    }

    calculateOrderTotal(items, services) {
        let total = 0;
        
        items.forEach(item => {
            const service = services.find(s => s.id === item.service_id);
            if (service) {
                total += service.base_price * item.qty;
            }
        });

        return total;
    }

    formatOrderStatus(status) {
        const statusMap = {
            'DIPESAN': 'Dipesan',
            'DIJEMPUT': 'Dijemput',
            'DICUCI': 'Dicuci',
            'DIKIRIM': 'Dikirim',
            'SELESAI': 'Selesai'
        };

        return statusMap[status] || status;
    }

    getStatusClass(status) {
        const classMap = {
            'DIPESAN': 'status-dipesan',
            'DIJEMPUT': 'status-dijemput',
            'DICUCI': 'status-dicuci',
            'DIKIRIM': 'status-dikirim',
            'SELESAI': 'status-selesai'
        };

        return classMap[status] || '';
    }
}


