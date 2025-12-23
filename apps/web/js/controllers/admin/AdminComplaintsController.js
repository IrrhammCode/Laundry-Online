// Admin Complaints Controller - MVC Pattern
import { AdminAuthService } from '../../models/AdminAuthService.js';
import { ComplaintService } from '../../models/ComplaintService.js';

export class AdminComplaintsController {
    constructor() {
        this.adminAuthService = new AdminAuthService();
        this.complaintService = new ComplaintService();
        
        this.currentPage = 1;
        this.currentStatus = '';
        this.currentSearch = '';
        this.currentComplaintId = null;
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadComplaints();
    }

    async checkAuth() {
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                if (user && user.role === 'ADMIN') {
                    this.showUserNav(user);
                    return;
                }
            }
            
            const admin = this.adminAuthService.getCurrentAdmin();
            if (admin && admin.role === 'ADMIN') {
                localStorage.setItem('userInfo', JSON.stringify(admin));
                this.showUserNav(admin);
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = 'login.html';
        }
    }

    showUserNav(user) {
        const adminName = document.getElementById('adminName');
        if (adminName) {
            adminName.textContent = user.name || user.email;
        }
    }

    setupEventListeners() {
        // Filters
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }

        // Pagination
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');
        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => this.changePage(-1));
        }
        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => this.changePage(1));
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Modal close buttons
        const complaintDetailModalClose = document.getElementById('complaintDetailModalClose');
        if (complaintDetailModalClose) {
            complaintDetailModalClose.addEventListener('click', () => this.hideModal('complaintDetailModal'));
        }

        const updateStatusModalClose = document.getElementById('updateStatusModalClose');
        if (updateStatusModalClose) {
            updateStatusModalClose.addEventListener('click', () => this.hideModal('updateStatusModal'));
        }

        const cancelUpdateBtn = document.getElementById('cancelUpdateBtn');
        if (cancelUpdateBtn) {
            cancelUpdateBtn.addEventListener('click', () => this.hideModal('updateStatusModal'));
        }

        // Update status form
        const updateStatusForm = document.getElementById('updateStatusForm');
        if (updateStatusForm) {
            updateStatusForm.addEventListener('submit', (e) => this.handleUpdateStatus(e));
        }
    }

    async loadComplaints() {
        try {
            const tableBody = document.getElementById('complaintsTableBody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem;">
                            <div class="loading">
                                <div class="spinner"></div>
                                <p>Loading complaints...</p>
                            </div>
                        </td>
                    </tr>
                `;
            }

            const result = await this.complaintService.getAdminComplaints(
                this.currentPage,
                10,
                this.currentStatus,
                this.currentSearch
            );

            if (result.ok) {
                this.renderComplaints(result.data.complaints || []);
                this.updatePagination(result.data.pagination);
            } else {
                this.showAlert(result.error || 'Failed to load complaints', 'error');
                if (tableBody) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 2rem; color: #dc3545;">
                                ${result.error || 'Failed to load complaints'}
                            </td>
                        </tr>
                    `;
                }
            }
        } catch (error) {
            console.error('Load complaints error:', error);
            this.showAlert('Failed to load complaints', 'error');
            const tableBody = document.getElementById('complaintsTableBody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem; color: #dc3545;">
                            Failed to load complaints. Please try again.
                        </td>
                    </tr>
                `;
            }
        }
    }

    renderComplaints(complaints) {
        const tableBody = document.getElementById('complaintsTableBody');
        if (!tableBody) return;

        if (complaints.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        No complaints found.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = complaints.map(complaint => `
            <tr>
                <td>#${complaint.id}</td>
                <td>
                    <div>
                        <strong>${complaint.user_name || 'N/A'}</strong><br>
                        <small>${complaint.user_email || 'N/A'}</small>
                    </div>
                </td>
                <td>${this.escapeHtml(complaint.subject)}</td>
                <td>${this.escapeHtml(complaint.message.substring(0, 100))}${complaint.message.length > 100 ? '...' : ''}</td>
                <td>${complaint.order_number ? `#${complaint.order_number}` : 'N/A'}</td>
                <td><span class="status-badge status-${complaint.status.toLowerCase()}">${this.formatStatus(complaint.status)}</span></td>
                <td>${new Date(complaint.created_at).toLocaleDateString('id-ID')}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="window.adminComplaintsController.viewDetail(${complaint.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="window.adminComplaintsController.showUpdateStatusModal(${complaint.id})">
                        <i class="fas fa-edit"></i> Update
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async viewDetail(id) {
        try {
            // Get all complaints to find the one with matching ID
            // Note: In production, you might want to add a specific admin endpoint for single complaint
            const result = await this.complaintService.getAdminComplaints(1, 1000, '', '');
            if (result.ok) {
                const complaint = result.data.complaints.find(c => c.id === id);
                if (complaint) {
                    this.showDetailModal(complaint);
                } else {
                    this.showAlert('Complaint not found', 'error');
                }
            } else {
                this.showAlert(result.error || 'Failed to load complaint details', 'error');
            }
        } catch (error) {
            console.error('View detail error:', error);
            this.showAlert('Failed to load complaint details', 'error');
        }
    }

    showDetailModal(complaint) {
        const modal = document.getElementById('complaintDetailModal');
        const content = document.getElementById('complaintDetailContent');
        
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="complaint-detail">
                <div class="detail-section">
                    <h4>Complaint Information</h4>
                    <div class="detail-item">
                        <label>ID:</label>
                        <span>#${complaint.id}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge status-${complaint.status.toLowerCase()}">${this.formatStatus(complaint.status)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Created:</label>
                        <span>${new Date(complaint.created_at).toLocaleString('id-ID')}</span>
                    </div>
                    ${complaint.updated_at !== complaint.created_at ? `
                    <div class="detail-item">
                        <label>Updated:</label>
                        <span>${new Date(complaint.updated_at).toLocaleString('id-ID')}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="detail-section">
                    <h4>Customer Information</h4>
                    <div class="detail-item">
                        <label>Name:</label>
                        <span>${this.escapeHtml(complaint.user_name || 'N/A')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Email:</label>
                        <span>${this.escapeHtml(complaint.user_email || 'N/A')}</span>
                    </div>
                    ${complaint.order_number ? `
                    <div class="detail-item">
                        <label>Order ID:</label>
                        <span><a href="orders.html" style="color: #007bff;">#${complaint.order_number}</a></span>
                    </div>
                    ` : ''}
                </div>

                <div class="detail-section">
                    <h4>Complaint Details</h4>
                    <div class="detail-item">
                        <label>Subject:</label>
                        <span><strong>${this.escapeHtml(complaint.subject)}</strong></span>
                    </div>
                    <div class="detail-item">
                        <label>Message:</label>
                        <div style="background: #f8f9fa; padding: 1rem; border-radius: 5px; margin-top: 0.5rem;">
                            ${this.escapeHtml(complaint.message).replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>

                ${complaint.admin_response ? `
                <div class="detail-section">
                    <h4>Admin Response</h4>
                    <div style="background: #e7f3ff; padding: 1rem; border-radius: 5px; border-left: 4px solid #007bff;">
                        ${this.escapeHtml(complaint.admin_response).replace(/\n/g, '<br>')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        this.showModal('complaintDetailModal');
    }

    showUpdateStatusModal(id) {
        this.currentComplaintId = id;
        const modal = document.getElementById('updateStatusModal');
        const form = document.getElementById('updateStatusForm');
        
        if (!modal || !form) return;

        // Reset form
        form.reset();
        
        // Get current complaint status
        this.complaintService.getAdminComplaints(1, 1000).then(result => {
            if (result.ok) {
                const complaint = result.data.complaints.find(c => c.id === id);
                if (complaint) {
                    const statusSelect = document.getElementById('statusSelect');
                    const adminResponse = document.getElementById('adminResponse');
                    if (statusSelect) {
                        statusSelect.value = complaint.status;
                    }
                    if (adminResponse && complaint.admin_response) {
                        adminResponse.value = complaint.admin_response;
                    }
                }
            }
        });

        this.showModal('updateStatusModal');
    }

    async handleUpdateStatus(e) {
        e.preventDefault();
        
        if (!this.currentComplaintId) return;

        const form = e.target;
        const formData = new FormData(form);
        const status = formData.get('status');
        const adminResponse = formData.get('admin_response') || null;

        try {
            const result = await this.complaintService.updateComplaintStatus(
                this.currentComplaintId,
                status,
                adminResponse
            );

            if (result.ok) {
                this.showAlert('Complaint status updated successfully', 'success');
                this.hideModal('updateStatusModal');
                await this.loadComplaints();
            } else {
                this.showAlert(result.error || 'Failed to update complaint status', 'error');
            }
        } catch (error) {
            console.error('Update status error:', error);
            this.showAlert('Failed to update complaint status', 'error');
        }
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const searchInput = document.getElementById('searchInput');

        this.currentStatus = statusFilter ? statusFilter.value : '';
        this.currentSearch = searchInput ? searchInput.value.trim() : '';
        this.currentPage = 1;

        this.loadComplaints();
    }

    changePage(direction) {
        this.currentPage += direction;
        if (this.currentPage < 1) {
            this.currentPage = 1;
        }
        this.loadComplaints();
    }

    updatePagination(pagination) {
        const pageInfo = document.getElementById('pageInfo');
        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');

        if (pageInfo) {
            pageInfo.textContent = `Page ${pagination.page} of ${pagination.total_pages || 1}`;
        }

        if (prevPageBtn) {
            prevPageBtn.disabled = pagination.page <= 1;
        }

        if (nextPageBtn) {
            nextPageBtn.disabled = pagination.page >= (pagination.total_pages || 1);
        }
    }

    formatStatus(status) {
        const statusMap = {
            'PENDING': 'Pending',
            'IN_PROGRESS': 'In Progress',
            'RESOLVED': 'Resolved',
            'CLOSED': 'Closed'
        };
        return statusMap[status] || status;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        alert.style.cssText = 'position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 9999; padding: 1rem 2rem; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); min-width: 300px; max-width: 90%; text-align: center;';

        const header = document.querySelector('.header');
        if (header) {
            header.insertAdjacentElement('afterend', alert);
        } else {
            document.body.insertBefore(alert, document.body.firstChild);
        }

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    async handleLogout() {
        try {
            const apiURL = (typeof window !== 'undefined' && window.VITE_API_URL) || 'http://localhost:3001/api';
            await fetch(`${apiURL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        }
    }
}

// Initialize controller
let adminComplaintsController;
document.addEventListener('DOMContentLoaded', () => {
    adminComplaintsController = new AdminComplaintsController();
    window.adminComplaintsController = adminComplaintsController;
});

