// AuthService Model - Sesuai DPPL
// Kelas untuk menangani autentikasi user
import { getAPIURL } from '../utils/api.js';

export class AuthService {
    constructor() {
        this.baseURL = getAPIURL();
    }

    /**
     * Algoritma #3: loginUser()
     * procedure loginUser(email, password)
     * 1. Cari data user berdasarkan email
     * 2. Jika user tidak ditemukan, return error
     * 3. Verifikasi password
     * 4. Jika cocok, buat session login
     * 5. Return status berhasil
     */
    async loginUser(email, password) {
        try {
            // 1. Cari data user berdasarkan email
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            // 2. Jika user tidak ditemukan, return error
            if (!response.ok) {
                const error = await response.json();
                return {
                    ok: false,
                    error: error.error || 'Email atau password salah'
                };
            }

            const result = await response.json();

            // 3. Verifikasi password (sudah dilakukan di backend)
            // 4. Jika cocok, buat session login
            if (result.ok && result.data.token) {
                localStorage.setItem('authToken', result.data.token);
                localStorage.setItem('userInfo', JSON.stringify(result.data.user));
            }

            // 5. Return status berhasil
            return result;
        } catch (error) {
            console.error('Error loginUser:', error);
            return {
                ok: false,
                error: error.message || 'Gagal melakukan login'
            };
        }
    }

    /**
     * Query #4: Mengambil data user berdasarkan email
     * SELECT * FROM user WHERE email = ?;
     */
    async getUserByEmail(email) {
        try {
            const response = await fetch(`${this.baseURL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                return result.data.user;
            }
            return null;
        } catch (error) {
            console.error('Error getUserByEmail:', error);
            return null;
        }
    }

    /**
     * Algoritma #19: resetPassword()
     * procedure resetPassword(email)
     * 1. Cek apakah email terdaftar
     * 2. Jika ya, buat token reset dan kirim ke email
     * 3. User klik link reset, lalu masukkan password baru
     * 4. Simpan password baru ke database setelah dienkripsi
     */
    async resetPassword(email) {
        try {
            // 1. Cek apakah email terdaftar
            const response = await fetch(`${this.baseURL}/auth/forgot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error resetPassword:', error);
            return {
                ok: false,
                error: error.message || 'Gagal mengirim email reset password'
            };
        }
    }

    async confirmResetPassword(token, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error confirmResetPassword:', error);
            return {
                ok: false,
                error: error.message || 'Gagal reset password'
            };
        }
    }

    async logout() {
        try {
            const response = await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');

            return await response.json();
        } catch (error) {
            console.error('Error logout:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
            return { ok: true };
        }
    }

    async getCurrentUser() {
        try {
            // Try to get from API first
            const authToken = localStorage.getItem('authToken');
            if (authToken) {
                const response = await fetch(`${this.baseURL}/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    },
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.ok && result.data.user) {
                        localStorage.setItem('userInfo', JSON.stringify(result.data.user));
                        return result.data.user;
                    }
                }
            }
        } catch (error) {
            // Error is normal if user is not authenticated - don't throw, just return null
            console.log('User not authenticated (this is normal for public pages)');
        }

        // Fallback to localStorage
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                return JSON.parse(userInfo);
            } catch (parseError) {
                // Invalid JSON in localStorage - clear it
                localStorage.removeItem('userInfo');
                return null;
            }
        }
        
        // No user found - return null (this is normal for public pages)
        return null;
    }
}

