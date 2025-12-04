// StatusLaundry Model - Sesuai DPPL
// Kelas untuk menangani update status laundry
export class StatusLaundry {
    constructor() {
        this.baseURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
    }

    /**
     * Update status pesanan
     * @param {string} orderID - ID pesanan
     * @param {string} statusTerbaru - Status baru
     * @param {DateTime} waktuUpdate - Waktu update
     */
    async updateStatus(orderID, statusTerbaru) {
        try {
            const response = await fetch(`${this.baseURL}/admin/orders/${orderID}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    status: statusTerbaru,
                    waktuUpdate: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    ok: false,
                    error: error.error || 'Gagal update status'
                };
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error updateStatus:', error);
            return {
                ok: false,
                error: error.message || 'Gagal update status'
            };
        }
    }

    /**
     * Get status history untuk pesanan
     * @param {string} orderID - ID pesanan
     */
    async getStatusHistory(orderID) {
        try {
            const response = await fetch(`${this.baseURL}/orders/${orderID}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil history status');
            }

            const result = await response.json();
            
            // Extract status history dari order detail
            if (result.ok && result.data.order) {
                return {
                    ok: true,
                    data: {
                        currentStatus: result.data.order.status,
                        orderId: result.data.order.id,
                        createdAt: result.data.order.created_at,
                        updatedAt: result.data.order.updated_at
                    }
                };
            }

            return result;
        } catch (error) {
            console.error('Error getStatusHistory:', error);
            return {
                ok: false,
                error: error.message || 'Gagal mengambil history status'
            };
        }
    }
}



