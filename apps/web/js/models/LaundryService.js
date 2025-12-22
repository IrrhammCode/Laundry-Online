// LaundryService Model - Sesuai DPPL
// Kelas untuk menangani operasi pemesanan laundry
export class LaundryService {
    constructor() {
        this.baseURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
    }

    /**
     * Algoritma #1: buatPesanan()
     * procedure buatPesanan(userID, jenisLayanan, berat)
     * 1. Validasi input berat dan jenis layanan
     * 2. Hitung total harga
     * 3. Simpan data pesanan ke database
     * 4. Kembalikan ID pesanan dan status
     */
    async buatPesanan(userID, items, pickupMethod, notes, notificationEmail = null) {
        try {
            // 1. Validasi input
            if (!items || items.length === 0) {
                throw new Error('Minimal satu item layanan diperlukan');
            }

            // Validate pickup_method
            if (!pickupMethod || !['PICKUP', 'SELF'].includes(pickupMethod)) {
                throw new Error('Metode pengambilan harus PICKUP atau SELF');
            }

            // 2. Hitung total harga (dilakukan di backend)
            // 3. Simpan data pesanan ke database
            // Ensure service_id and qty are integers
            const formattedItems = items.map(item => {
                const serviceId = parseInt(item.service_id);
                const qty = parseInt(item.qty);
                
                if (isNaN(serviceId) || serviceId <= 0) {
                    throw new Error(`Invalid service_id: ${item.service_id}`);
                }
                if (isNaN(qty) || qty <= 0) {
                    throw new Error(`Invalid qty: ${item.qty}`);
                }
                
                return {
                    service_id: serviceId,
                    qty: qty
                };
            });
            
            console.log('Formatted items for order:', formattedItems);
            console.log('Pickup method:', pickupMethod);
            
            // Prepare request body
            const requestBody = {
                pickup_method: pickupMethod,
                items: formattedItems,
                notes: (notes && notes.trim()) || null,
                notification_email: (notificationEmail && notificationEmail.trim()) || null
            };
            
            // Remove null notification_email if empty
            if (!requestBody.notification_email) {
                delete requestBody.notification_email;
            }
            
            console.log('Request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                credentials: 'include',
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Order creation error response:', error);
                console.error('Request body sent:', JSON.stringify({
                    pickup_method: pickupMethod,
                    items: formattedItems,
                    notes: notes || null,
                    notification_email: notificationEmail || null
                }, null, 2));
                
                // Show detailed validation errors if available
                if (error.details && Array.isArray(error.details)) {
                    const errorMessages = error.details.map(d => `${d.param}: ${d.msg}`).join(', ');
                    throw new Error(`Validation failed: ${errorMessages}`);
                }
                
                throw new Error(error.error || 'Gagal membuat pesanan');
            }

            const result = await response.json();
            
            // 4. Kembalikan ID pesanan dan status
            return {
                ok: true,
                data: {
                    orderId: result.data.order.id,
                    status: result.data.order.status
                }
            };
        } catch (error) {
            console.error('Error buatPesanan:', error);
            return {
                ok: false,
                error: error.message || 'Gagal membuat pesanan'
            };
        }
    }

    /**
     * Query #2: Mengambil semua pesanan milik user
     * SELECT * FROM pesanan WHERE user_id = ? ORDER BY tanggal_pesan DESC;
     */
    async getPesananByUser(userID) {
        try {
            const response = await fetch(`${this.baseURL}/orders/me`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil pesanan');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error getPesananByUser:', error);
            return {
                ok: false,
                error: error.message
            };
        }
    }
}



