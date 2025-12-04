// PembayaranService Model - Sesuai DPPL
// Kelas untuk menangani konfirmasi pembayaran
export class PembayaranService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
    }

    /**
     * Algoritma #7: konfirmasiPembayaran()
     * procedure konfirmasiPembayaran(pesananID, metodeBayar, bukti)
     * 1. Validasi pesananID
     * 2. Simpan data pembayaran ke tabel pembayaran
     * 3. Ubah status pesanan jadi "Menunggu Konfirmasi"
     * 4. Kirim notifikasi ke admin
     */
    async konfirmasiPembayaran(pesananID, metodeBayar, bukti = null) {
        try {
            // 1. Validasi pesananID
            if (!pesananID) {
                return {
                    ok: false,
                    error: 'ID pesanan tidak valid'
                };
            }

            // 2. Simpan data pembayaran ke tabel pembayaran
            // 3. Ubah status pesanan jadi "Menunggu Konfirmasi"
            // 4. Kirim notifikasi ke admin (dilakukan di backend)
            const response = await fetch(`${this.baseURL}/orders/${pesananID}/payment/confirm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    method: metodeBayar,
                    amount: null, // Akan dihitung di backend
                    proof: bukti
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    ok: false,
                    error: error.error || 'Gagal konfirmasi pembayaran'
                };
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error konfirmasiPembayaran:', error);
            return {
                ok: false,
                error: error.message || 'Gagal konfirmasi pembayaran'
            };
        }
    }

    /**
     * Query #8: Menyimpan data konfirmasi pembayaran
     * INSERT INTO pembayaran (pesanan_id, metode, bukti_transfer, status) 
     * VALUES (?, ?, ?, 'Menunggu Verifikasi');
     */
    async simpanPembayaran(pesananID, metode, bukti) {
        // Query dilakukan di backend
        return await this.konfirmasiPembayaran(pesananID, metode, bukti);
    }
}



