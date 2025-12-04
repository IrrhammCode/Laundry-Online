// LaundryService Model - Sesuai DPPL
// Kelas untuk menangani operasi pemesanan laundry
export class LaundryService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    }

    /**
     * Algoritma #1: buatPesanan()
     * procedure buatPesanan(userID, jenisLayanan, berat)
     * 1. Validasi input berat dan jenis layanan
     * 2. Hitung total harga
     * 3. Simpan data pesanan ke database
     * 4. Kembalikan ID pesanan dan status
     */
    async buatPesanan(userID, items, pickupMethod, notes) {
        try {
            // 1. Validasi input
            if (!items || items.length === 0) {
                throw new Error('Minimal satu item layanan diperlukan');
            }

            // 2. Hitung total harga (dilakukan di backend)
            // 3. Simpan data pesanan ke database
            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    pickup_method: pickupMethod,
                    items: items,
                    notes: notes
                })
            });

            if (!response.ok) {
                const error = await response.json();
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



