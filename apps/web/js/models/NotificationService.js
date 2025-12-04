// NotificationService Model - Sesuai DPPL
// Kelas untuk menangani notifikasi
export class NotificationService {
    constructor() {
        this.baseURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
    }

    /**
     * Algoritma #17: kirimNotifikasi()
     * procedure kirimNotifikasi(userID, isiPesan)
     * 1. Simpan notifikasi ke tabel notifikasi
     * 2. Kirim ke perangkat user (jika real-time)
     */
    async kirimNotifikasi(userID, isiPesan) {
        try {
            // 1. Simpan notifikasi ke tabel notifikasi
            // 2. Kirim ke perangkat user (jika real-time) - dilakukan di backend via Socket.IO
            const response = await fetch(`${this.baseURL}/chat/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    user_id: userID,
                    message: isiPesan
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return {
                    ok: false,
                    error: error.error || 'Gagal mengirim notifikasi'
                };
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error kirimNotifikasi:', error);
            return {
                ok: false,
                error: error.message || 'Gagal mengirim notifikasi'
            };
        }
    }

    /**
     * Query #18: Menyimpan dan mengirimkan notifikasi ke user
     * INSERT INTO notifikasi (user_id, isi_pesan, waktu) 
     * VALUES (?, ?, CURRENT_TIMESTAMP);
     */
    async getNotifikasi(userID = null) {
        try {
            let url = `${this.baseURL}/chat/notifications`;
            if (userID) {
                url += `?user_id=${userID}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Gagal mengambil notifikasi');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error getNotifikasi:', error);
            return {
                ok: false,
                error: error.message || 'Gagal mengambil notifikasi'
            };
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationID) {
        try {
            const response = await fetch(`${this.baseURL}/chat/notifications/${notificationID}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Gagal menandai notifikasi sebagai dibaca');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error markAsRead:', error);
            return {
                ok: false,
                error: error.message || 'Gagal menandai notifikasi sebagai dibaca'
            };
        }
    }
}



