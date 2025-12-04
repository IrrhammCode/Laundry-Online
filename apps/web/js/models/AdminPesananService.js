// AdminPesananService Model - Sesuai DPPL
// Kelas untuk menangani kelola pesanan admin
export class AdminPesananService {
    constructor() {
        this.baseURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
    }

    /**
     * Algoritma #13: lihatSemuaPesanan()
     * procedure lihatSemuaPesanan()
     * 1. Ambil semua data pesanan dari database
     * 2. Tampilkan daftar untuk admin (status, user, layanan, dsb)
     */
    async lihatSemuaPesanan(page = 1, limit = 10, status = '') {
        try {
            // 1. Ambil semua data pesanan dari database
            let url = `${this.baseURL}/admin/orders?page=${page}&limit=${limit}`;
            if (status) {
                url += `&status=${status}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil data pesanan');
            }

            const result = await response.json();

            // 2. Tampilkan daftar untuk admin (dilakukan di View)
            return result;
        } catch (error) {
            console.error('Error lihatSemuaPesanan:', error);
            return {
                ok: false,
                error: error.message || 'Gagal mengambil data pesanan'
            };
        }
    }

    /**
     * Query #14: Mengambil semua pesanan diurutkan berdasarkan status dan tanggal
     * SELECT * FROM pesanan ORDER BY status, tanggal_pesan ASC;
     */
    async getDetailPesanan(pesananID) {
        try {
            const response = await fetch(`${this.baseURL}/admin/orders/${pesananID}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
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

    /**
     * Algoritma #15: ubahStatusPesanan()
     * procedure ubahStatusPesanan(pesananID, statusBaru)
     * 1. Validasi pesananID
     * 2. Update status pesanan di database
     * 3. Kirim notifikasi ke user
     */
    async ubahStatusPesanan(pesananID, statusBaru) {
        try {
            // 1. Validasi pesananID
            if (!pesananID || !statusBaru) {
                return {
                    ok: false,
                    error: 'ID pesanan dan status baru harus diisi'
                };
            }

            // 2. Update status pesanan di database
            // 3. Kirim notifikasi ke user (dilakukan di backend)
            const response = await fetch(`${this.baseURL}/admin/orders/${pesananID}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                credentials: 'include',
                body: JSON.stringify({ status: statusBaru })
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    ok: false,
                    error: error.error || 'Gagal mengubah status pesanan'
                };
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error ubahStatusPesanan:', error);
            return {
                ok: false,
                error: error.message || 'Gagal mengubah status pesanan'
            };
        }
    }

    /**
     * Query #16: Memperbarui status pesanan
     * UPDATE pesanan SET status = ? WHERE id = ?;
     */
    async updateStatus(pesananID, statusBaru) {
        return await this.ubahStatusPesanan(pesananID, statusBaru);
    }
}



