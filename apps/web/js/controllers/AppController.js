// App Controller - MVC Pattern (Sesuai DPPL)
import { AuthService } from '../models/AuthService.js';
import { UserService } from '../models/UserService.js';
import { OrderService } from '../services/order.js';
import { ChatService } from '../services/chat.js';
import { AppView } from '../views/AppView.js';

export class AppController {
    constructor() {
        // Model layer - Sesuai DPPL
        this.authService = new AuthService();
        this.userService = new UserService();
        this.orderService = new OrderService();
        this.chatService = new ChatService();
        
        // View layer
        this.view = new AppView();
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadServices();
        
        // Load notifications if user is authenticated
        try {
            const user = await this.authService.getCurrentUser();
            if (user) {
                await this.loadNotifications();
            }
        } catch (error) {
            // User not authenticated, skip notifications
        }
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (user) {
                this.view.showUserNav(user);
                this.view.hideAuthNav();
                // Load notifications after auth check (only for customer)
                if (user.role === 'CUSTOMER') {
                    await this.loadNotifications();
                }
            } else {
                // User not logged in - show auth buttons, hide user nav
                this.view.showAuthNav();
                this.view.hideUserNav();
            }
        } catch (error) {
            // User not authenticated - this is normal for public pages
            // Just show auth buttons, don't redirect
            console.log('User not authenticated - showing public view');
            this.view.showAuthNav();
            this.view.hideUserNav();
        }
    }

    /**
     * Load notifications
     */
    async loadNotifications() {
        try {
            const result = await this.chatService.getUnreadCount();
            if (result.ok) {
                this.view.updateNotificationBadge(result.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to load notification count:', error);
        }
    }

    /**
     * Load notification list for dropdown
     */
    async loadNotificationList() {
        try {
            const result = await this.chatService.getNotifications(1, 10);
            if (result.ok) {
                this.view.renderNotifications(result.data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            const list = document.getElementById('notificationList');
            if (list) {
                list.innerHTML = '<div class="notification-error">Failed to load notifications</div>';
            }
        }
    }

    /**
     * Mark notification as read
     */
    async markNotificationAsRead(notificationId) {
        try {
            await this.chatService.markNotificationAsRead(notificationId);
            // Reload notifications
            await this.loadNotifications();
            await this.loadNotificationList();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllNotificationsAsRead() {
        try {
            const result = await this.chatService.getNotifications(1, 100);
            if (result.ok) {
                const notifications = result.data.notifications || [];
                const unreadNotifications = notifications.filter(n => !n.sent_at);
                
                // Mark each unread notification
                for (const notif of unreadNotifications) {
                    await this.chatService.markNotificationAsRead(notif.id);
                }
                
                // Reload notifications
                await this.loadNotifications();
                await this.loadNotificationList();
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }

    async loadServices() {
        try {
            const services = await this.orderService.getServices();
            this.view.renderServices(services);
        } catch (error) {
            console.error('Failed to load services:', error);
        }
    }

    /**
     * Handle login menggunakan AuthService.loginUser() sesuai Algoritma #3 DPPL
     * 
     * Alur function:
     * 1. Cegah reload halaman saat form submit
     * 2. Ambil data email dan password dari form
     * 3. Validasi data, jika kosong langsung stop
     * 4. Tampilkan loading indicator
     * 5. Kirim data ke server untuk proses login
     * 6. Jika berhasil: tutup modal, tampilkan sukses, update UI, redirect
     * 7. Jika gagal: tampilkan pesan error
     * 8. Selalu hide loading di akhir (baik sukses maupun error)
     * 
     * @param {Event} e - Event object dari form submit
     */
    async handleLogin(e) {
        // 1. Cegah behavior default form submit (reload halaman)
        // Tanpa ini, halaman akan reload dan proses login tidak bisa dikontrol
        e.preventDefault();
        
        // 2. Ambil data dari form login (email dan password)
        // Method getLoginFormData() mengambil nilai dari input form
        const data = this.view.getLoginFormData();
        
        // 3. Validasi: jika data tidak ada atau kosong, langsung stop
        // Early return untuk menghindari proses yang tidak perlu
        if (!data) return;

        // 4. Gunakan try-catch untuk menangani error yang mungkin terjadi
        try {
            // 5. Tampilkan loading indicator ke user
            // Memberi feedback bahwa proses sedang berjalan
            this.view.showLoading();
            
            // 6. Proses login: kirim email dan password ke server
            // Menggunakan AuthService.loginUser() sesuai DPPL Algoritma #3
            // await = tunggu sampai proses selesai (karena async)
            const result = await this.authService.loginUser(data.email, data.password);
            
            // 7. Cek hasil login: jika result.ok = true berarti login berhasil
            if (result.ok) {
                // 7a. Tutup modal/form login karena sudah berhasil
                this.view.hideLoginModal();
                
                // 7b. Tampilkan pesan sukses ke user (alert hijau)
                this.view.showAlert('Login successful!', 'success');
                
                // 7c. Update UI: refresh status autentikasi dan tampilkan info user
                // await = tunggu sampai proses selesai
                await this.checkAuth();
                
                // 7d. Reset form: kosongkan input email dan password
                // Untuk keamanan dan user experience yang lebih baik
                this.view.resetForm('loginForm');
                
                // 7e. Redirect ke dashboard setelah 1 detik
                // setTimeout memberi jeda agar user sempat membaca pesan sukses
                setTimeout(() => {
                    this.view.redirect('dashboard.html');
                }, 1000);
            } else {
                // 8. Jika login gagal: tampilkan pesan error
                // result.error = pesan error dari server (jika ada)
                // || 'Login failed' = fallback jika error tidak ada
                this.view.showAlert(result.error || 'Login failed', 'error');
            }
        } catch (error) {
            // 9. Tangani error yang tidak terduga (misalnya koneksi internet putus)
            // Error ini berbeda dengan login gagal (baris 77)
            // Ini untuk error teknis seperti network error, server down, dll
            this.view.showAlert('Login failed. Please try again.', 'error');
        } finally {
            // 10. Blok finally SELALU dijalankan (baik sukses maupun error)
            // Pastikan loading indicator selalu di-hide
            // Mencegah loading terus muncul jika ada error
            this.view.hideLoading();
        }
    }

    /**
     * Handle register menggunakan UserService.registrasiUser() sesuai Algoritma #5 DPPL
     */
    async handleRegister(e) {
        e.preventDefault();
        
        const data = this.view.getRegisterFormData();
        if (!data) return;

        // Validasi nomor telepon jika diisi
        if (data.phone && data.phone.trim() !== '') {
            // Hapus semua karakter non-angka
            const phoneDigits = data.phone.replace(/\D/g, '');
            
            // Validasi format nomor Indonesia (08xxxxxxxxxx, 10-13 digit)
            if (!/^08\d{8,11}$/.test(phoneDigits)) {
                this.view.showAlert('Nomor telepon tidak valid. Format: 08xxxxxxxxxx (10-13 digit, hanya angka)', 'error');
                return;
            }
            
            // Update data dengan nomor yang sudah dibersihkan
            data.phone = phoneDigits;
        }

        try {
            this.view.showLoading();
            
            // Menggunakan UserService.registrasiUser() sesuai DPPL Algoritma #5
            const result = await this.userService.registrasiUser(
                data.name,
                data.email,
                data.password,
                data.phone,
                data.address
            );
            
            if (result.ok) {
                this.view.hideRegisterModal();
                this.view.showAlert('Registration successful!', 'success');
                await this.checkAuth();
                this.view.resetForm('registerForm');
                
                setTimeout(() => {
                    this.view.redirect('dashboard.html');
                }, 1000);
            } else {
                const errorMsg = result.message || result.error || 'Registration failed';
                this.view.showAlert(errorMsg, 'error');
            }
        } catch (error) {
            // Show specific error message if available
            let errorMsg = 'Registration failed. Please check your input and try again.';
            
            if (error.message) {
                errorMsg = error.message;
            } else if (error.result) {
                errorMsg = error.result.message || error.result.error || errorMsg;
            }
            
            console.error('Registration error:', error);
            console.log('Displaying error message:', errorMsg);
            this.view.showAlert(errorMsg, 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    /**
     * Handle forgot password - Step 1: Verify email
     */
    async handleForgotPassword(e) {
        e.preventDefault();
        
        const data = this.view.getForgotPasswordFormData();
        if (!data) return;

        try {
            this.view.showLoading();
            
            // Verifikasi email terdaftar
            const result = await this.authService.verifyEmailForReset(data.email);
            
            if (result.ok) {
                // Email cocok, tampilkan form reset password
                this.view.showResetPasswordForm(data.email);
            } else {
                this.view.showAlert(result.error || 'Email tidak ditemukan', 'error');
            }
        } catch (error) {
            this.view.showAlert('Gagal verifikasi email. Silakan coba lagi.', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    /**
     * Handle reset password - Step 2: Reset password dengan email
     */
    async handleResetPassword(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        // Validasi password match
        if (password !== confirmPassword) {
            this.view.showAlert('Password tidak cocok. Silakan cek kembali.', 'error');
            return;
        }

        // Validasi password length
        if (password.length < 6) {
            this.view.showAlert('Password harus minimal 6 karakter.', 'error');
            return;
        }

        try {
            this.view.showLoading();
            
            // Reset password dengan email
            const result = await this.authService.resetPasswordByEmail(email, password);
            
            if (result.ok) {
                this.view.hideForgotPasswordModal();
                this.view.showAlert('Password berhasil diubah! Silakan login dengan password baru.', 'success');
                this.view.resetForm('forgotPasswordForm');
                this.view.resetForm('resetPasswordForm');
                // Reset modal ke step 1
                this.view.resetForgotPasswordModal();
            } else {
                this.view.showAlert(result.error || 'Gagal reset password', 'error');
            }
        } catch (error) {
            this.view.showAlert('Gagal reset password. Silakan coba lagi.', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    async logout() {
        try {
            await this.authService.logout();
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            this.view.showAuthNav();
            this.view.hideUserNav();
            this.view.showAlert('Logged out successfully', 'success');
        } catch (error) {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            this.view.showAlert('Logout failed', 'error');
        }
    }

    async resetRateLimit() {
        try {
            this.view.showAlert('Resetting rate limit...', 'info');
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            const response = await fetch(`${apiURL}/reset-rate-limit`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.view.showAlert('Rate limit reset successfully! You can now try logging in again.', 'success');
            } else {
                this.view.showAlert('Failed to reset rate limit', 'error');
            }
        } catch (error) {
            this.view.showAlert('Failed to reset rate limit', 'error');
        }
    }

    handleOrderNow() {
        this.authService.getCurrentUser().then(user => {
            if (user) {
                this.view.redirect('order.html');
            } else {
                this.view.showLoginModal();
            }
        }).catch(() => {
            this.view.showLoginModal();
        });
    }

    setupEventListeners() {
        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.view.toggleNotificationDropdown();
                // Load notifications when dropdown opens
                if (document.getElementById('notificationDropdown')?.classList.contains('show')) {
                    this.loadNotificationList();
                }
            });
        }

        // Mark all as read button
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllNotificationsAsRead();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            const btn = document.getElementById('notificationBtn');
            if (dropdown && btn && !dropdown.contains(e.target) && !btn.contains(e.target)) {
                this.view.hideNotificationDropdown();
            }
        });

        // Handle notification item clicks
        document.addEventListener('click', (e) => {
            const notificationItem = e.target.closest('.notification-item');
            if (notificationItem) {
                const notificationId = notificationItem.dataset.id;
                if (notificationId) {
                    this.markNotificationAsRead(notificationId);
                }
            }
        });
        this.view.setupEventListeners({
            onLogin: (e) => this.handleLogin(e),
            onRegister: (e) => this.handleRegister(e),
            onForgotPassword: (e) => this.handleForgotPassword(e),
            onResetPassword: (e) => this.handleResetPassword(e),
            onResetRateLimit: () => this.resetRateLimit(),
            onOrderNow: () => this.handleOrderNow(),
            onLogout: () => this.logout()
        });
    }
}

let appController;

document.addEventListener('DOMContentLoaded', () => {
    appController = new AppController();
    window.appController = appController;
});




