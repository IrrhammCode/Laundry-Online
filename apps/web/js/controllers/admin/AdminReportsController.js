// Admin Reports Controller
import { AuthService } from '../../services/auth.js';
import { AdminReportsView } from '../../views/admin/AdminReportsView.js';

export class AdminReportsController {
    constructor() {
        this.authService = new AuthService();
        this.view = new AdminReportsView();
        
        this.startDate = null;
        this.endDate = null;
        this.period = 'month';
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadReports();
    }

    async checkAuth() {
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user && user.role === 'ADMIN') {
                    this.view.showUserNav(user);
                    return;
                }
            }
            
            const user = await this.authService.getCurrentUser();
            if (user && user.role === 'ADMIN') {
                localStorage.setItem('userInfo', JSON.stringify(user));
                this.view.showUserNav(user);
            } else {
                this.view.redirect('login.html');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.view.redirect('login.html');
        }
    }

    setupEventListeners() {
        const applyFilterBtn = document.getElementById('applyFilterBtn');
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', () => this.applyFilter());
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Set default dates (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        if (startDateInput) startDateInput.value = startDate.toISOString().split('T')[0];
        if (endDateInput) endDateInput.value = endDate.toISOString().split('T')[0];
    }

    async applyFilter() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const periodSelect = document.getElementById('periodSelect');
        
        this.startDate = startDateInput?.value || null;
        this.endDate = endDateInput?.value || null;
        this.period = periodSelect?.value || 'month';
        
        await this.loadReports();
    }

    async loadReports() {
        try {
            this.view.showLoading();
            
            // Load all reports in parallel
            const [salesResult, customersResult, revenueResult] = await Promise.all([
                this.loadSalesReport(),
                this.loadCustomersReport(),
                this.loadRevenueReport()
            ]);
            
            if (salesResult.ok) {
                this.view.renderSalesReport(salesResult.data);
            }
            
            if (customersResult.ok) {
                this.view.renderCustomersReport(customersResult.data);
            }
            
            if (revenueResult.ok) {
                this.view.renderRevenueReport(revenueResult.data);
            }
            
        } catch (error) {
            console.error('Load reports error:', error);
            this.view.showAlert('Failed to load reports', 'error');
        } finally {
            this.view.hideLoading();
        }
    }

    async loadSalesReport() {
        try {
            const authToken = localStorage.getItem('authToken');
            let url = `${this.getAPIURL()}/admin/reports/sales?period=${this.period}`;
            
            if (this.startDate && this.endDate) {
                url += `&start_date=${this.startDate}&end_date=${this.endDate}`;
            }
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Load sales report error:', error);
            return { ok: false, error: error.message };
        }
    }

    async loadCustomersReport() {
        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`${this.getAPIURL()}/admin/reports/customers?limit=10`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Load customers report error:', error);
            return { ok: false, error: error.message };
        }
    }

    async loadRevenueReport() {
        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`${this.getAPIURL()}/admin/reports/revenue?period=${this.period}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
                credentials: 'include'
            });
            
            return await response.json();
        } catch (error) {
            console.error('Load revenue report error:', error);
            return { ok: false, error: error.message };
        }
    }

    exportReport() {
        // Simple CSV export
        const data = this.view.getReportData();
        if (!data) {
            this.view.showAlert('No data to export', 'error');
            return;
        }
        
        // Create CSV content
        let csv = 'Report Data\n\n';
        csv += 'Date,Orders,Revenue,Customers\n';
        
        if (data.sales_by_date) {
            data.sales_by_date.forEach(row => {
                csv += `${row.date},${row.order_count},${row.total_revenue},${row.unique_customers}\n`;
            });
        }
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    getAPIURL() {
        return (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
    }

    async logout() {
        try {
            await this.authService.logout();
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminInfo');
            window.location.href = '../../index.html';
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminInfo');
            window.location.href = '../../index.html';
        }
    }
}

let adminReportsController;

document.addEventListener('DOMContentLoaded', () => {
    adminReportsController = new AdminReportsController();
    window.adminReportsController = adminReportsController;
});

