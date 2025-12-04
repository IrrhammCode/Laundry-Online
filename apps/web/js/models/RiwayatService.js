// RiwayatService Model - Sesuai DPPL
// Kelas untuk menangani riwayat pemesanan
export class RiwayatService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
    }

    /**
     * Algoritma #9: lihatRiwayat(userID)
     * procedure lihatRiwayat(userID)
     * 1. Ambil semua pesanan dari user berdasarkan userID
     * 2. Urutkan berdasarkan tanggal pemesanan terbaru
     * 3. Tampilkan ke user
     */
    async lihatRiwayat(userID, page = 1, limit = 10, status = '') {
        try {
            // 1. Ambil semua pesanan dari user berdasarkan userID
            // 2. Urutkan berdasarkan tanggal pemesanan terbaru (dilakukan di backend)
            let url = `${this.baseURL}/orders/me?page=${page}&limit=${limit}`;
            if (status) {
                url += `&status=${status}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil riwayat pesanan');
            }

            const result = await response.json();

            // 3. Tampilkan ke user (dilakukan di View)
            return result;
        } catch (error) {
            console.error('Error lihatRiwayat:', error);
            return {
                ok: false,
                error: error.message || 'Gagal mengambil riwayat pesanan'
            };
        }
    }

    /**
     * Query #10: Menampilkan riwayat seluruh pesanan dari user
     * SELECT * FROM pesanan WHERE user_id = ? ORDER BY tanggal_pesan DESC;
     */
    async getDetailPesanan(pesananID) {
        try {
            const response = await fetch(`${this.baseURL}/orders/${pesananID}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil detail pesanan');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error getDetailPesanan:', error);
            return {
                ok: false,
                error: error.message || 'Gagal mengambil detail pesanan'
            };
        }
    }
}


