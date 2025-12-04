// UserService Model - Sesuai DPPL
// Kelas untuk menangani registrasi user
export class UserService {
    constructor() {
        this.baseURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
    }

    /**
     * Algoritma #5: registrasiUser()
     * procedure registrasiUser(nama, email, password)
     * 1. Validasi format email dan password
     * 2. Cek apakah email sudah terdaftar
     * 3. Enkripsi password
     * 4. Simpan user baru ke database
     * 5. Return status berhasil
     */
    async registrasiUser(nama, email, password, phone = null, address = null) {
        try {
            // 1. Validasi format email dan password (dilakukan di backend)
            // 2. Cek apakah email sudah terdaftar (dilakukan di backend)
            // 3. Enkripsi password (dilakukan di backend)
            // 4. Simpan user baru ke database
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: nama,
                    email: email,
                    password: password,
                    phone: phone,
                    address: address
                })
            });

            if (!response.ok) {
                const error = await response.json();
                // Handle 409 Conflict (email already registered)
                if (response.status === 409) {
                    return {
                        ok: false,
                        error: error.message || error.error || 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
                        message: error.message || error.error || 'Email sudah terdaftar. Silakan gunakan email lain atau login.'
                    };
                }
                return {
                    ok: false,
                    error: error.message || error.error || 'Gagal registrasi',
                    message: error.message || error.error || 'Gagal registrasi'
                };
            }

            const result = await response.json();

            // Simpan token dan user info
            if (result.ok && result.data.token) {
                localStorage.setItem('authToken', result.data.token);
                localStorage.setItem('userInfo', JSON.stringify(result.data.user));
            }

            // 5. Return status berhasil
            return result;
        } catch (error) {
            console.error('Error registrasiUser:', error);
            return {
                ok: false,
                error: error.message || 'Gagal melakukan registrasi'
            };
        }
    }

    /**
     * Query #6: Mengecek apakah email sudah terdaftar
     * SELECT COUNT(*) FROM user WHERE email = ?;
     */
    async cekEmailTerdaftar(email) {
        try {
            // Email check dilakukan saat registrasi di backend
            // Method ini untuk informasi saja
            return false;
        } catch (error) {
            console.error('Error cekEmailTerdaftar:', error);
            return false;
        }
    }
}


