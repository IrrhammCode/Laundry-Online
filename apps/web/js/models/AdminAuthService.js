// AdminAuthService Model - Sesuai DPPL
// Kelas untuk menangani autentikasi admin
export class AdminAuthService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    }

    /**
     * Algoritma #11: loginAdmin()
     * procedure loginAdmin(username, password)
     * 1. Cek username admin
     * 2. Verifikasi password
     * 3. Jika benar, buat session admin
     * 4. Jika salah, return error
     */
    async loginAdmin(email, password) {
        try {
            // 1. Cek username admin
            // 2. Verifikasi password
            const response = await fetch(`${this.baseURL}/auth/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                // 4. Jika salah, return error
                return {
                    ok: false,
                    error: error.error || 'Email atau password admin salah'
                };
            }

            const result = await response.json();

            // 3. Jika benar, buat session admin
            if (result.ok && result.data.token) {
                localStorage.setItem('adminToken', result.data.token);
                localStorage.setItem('adminInfo', JSON.stringify(result.data.admin));
            }

            return result;
        } catch (error) {
            console.error('Error loginAdmin:', error);
            return {
                ok: false,
                error: error.message || 'Gagal melakukan login admin'
            };
        }
    }

    /**
     * Query #12: Mengambil data akun admin untuk autentikasi
     * SELECT * FROM admin WHERE username = ?;
     */
    async getAdminByEmail(email) {
        // Query dilakukan di backend saat login
        return null;
    }

    async logout() {
        try {
            const response = await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminInfo');

            return await response.json();
        } catch (error) {
            console.error('Error logout:', error);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminInfo');
            return { ok: true };
        }
    }

    getCurrentAdmin() {
        const adminInfo = localStorage.getItem('adminInfo');
        if (adminInfo) {
            return JSON.parse(adminInfo);
        }
        return null;
    }
}



