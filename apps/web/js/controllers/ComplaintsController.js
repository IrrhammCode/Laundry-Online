// Complaints List Controller - MVC Pattern
import { AuthService } from '../models/AuthService.js';
import { ComplaintService } from '../models/ComplaintService.js';
import { UI } from '../utils/ui.js';

export class ComplaintsController {
    constructor() {
        this.authService = new AuthService();
        this.complaintService = new ComplaintService();
        this.ui = new UI();
        
        this.currentPage = 1;
        this.currentStatus = '';
        
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadComplaints();
    }

    async checkAuth() {
        try {
            const user = await this.authService.getCurrentUser();
            if (!user || user.role !== 'CUSTOMER') {
                this.ui.redirect('index.html');
                return;
            }
            this.ui.updateNavbarForRole(user);
        } catch (error) {
            console.error('Auth check error:', error);
            this.ui.redirect('index.html');
        }
    }

    setupEventListeners() {
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentStatus = e.target.value;
                this.currentPage = 1;
                this.loadComplaints();
            });
        }

        const modalClose = document.getElementById('complaintDetailModalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.ui.hideModal('complaintDetailModal');
            });
        }
    }

    async loadComplaints() {
        const listContainer = document.getElementById('complaintsList');
        if (!listContainer) return;

        try {
            listContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading complaints...</p></div>';
            
            const result = await this.complaintService.getComplaints(this.currentPage, 10, this.currentStatus);
            
            if (result.ok) {
                this.renderComplaints(result.data.complaints || []);
                this.renderPagination(result.data.pagination || {});
            } else {
                listContainer.innerHTML = `<div class="empty-message">${result.error || 'Failed to load complaints'}</div>`;
            }
        } catch (error) {
            console.error('Load complaints error:', error);
            listContainer.innerHTML = '<div class="empty-message">Failed to load complaints. Please try again.</div>';
        }
    }

    renderComplaints(complaints) {
        const listContainer = document.getElementById('complaintsList');
        if (!listContainer) return;

        if (complaints.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-inbox"></i><br>
                    No complaints found.<br>
                    <a href="complaint.html" class="btn btn-primary" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Submit New Complaint
                    </a>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = complaints.map(complaint => `
            <div class="complaint-card" onclick="window.complaintsController.viewDetail(${complaint.id})">
                <div class="complaint-header">
                    <h3>${complaint.subject}</h3>
                    <span class="status-badge status-${complaint.status.toLowerCase()}">${this.formatStatus(complaint.status)}</span>
                </div>
                <div class="complaint-body">
                    <p>${complaint.message.substring(0, 150)}${complaint.message.length > 150 ? '...' : ''}</p>
                    ${complaint.order_number ? `<p><strong>Order:</strong> #${complaint.order_number}</p>` : ''}
                    <p><small><i class="fas fa-calendar"></i> ${new Date(complaint.created_at).toLocaleDateString('id-ID')}</small></p>
                </div>
            </div>
        `).join('');
    }

    renderPagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        if (pagination.total_pages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        paginationContainer.innerHTML = `
            <button class="btn btn-outline" ${this.currentPage <= 1 ? 'disabled' : ''} 
                    onclick="window.complaintsController.changePage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i> Prev
            </button>
            <span>Page ${this.currentPage} of ${pagination.total_pages}</span>
            <button class="btn btn-outline" ${this.currentPage >= pagination.total_pages ? 'disabled' : ''} 
                    onclick="window.complaintsController.changePage(${this.currentPage + 1})">
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    changePage(page) {
        this.currentPage = page;
        this.loadComplaints();
    }

    async viewDetail(id) {
        try {
            const result = await this.complaintService.getComplaintDetail(id);
            if (result.ok) {
                this.showDetailModal(result.data.complaint);
            }
        } catch (error) {
            console.error('View detail error:', error);
        }
    }

    showDetailModal(complaint) {
        const content = document.getElementById('complaintDetailContent');
        if (!content) return;

        content.innerHTML = `
            <div class="complaint-detail">
                <div class="detail-section">
                    <h4>Subject</h4>
                    <p>${complaint.subject}</p>
                </div>
                <div class="detail-section">
                    <h4>Message</h4>
                    <p>${complaint.message}</p>
                </div>
                ${complaint.order_number ? `
                <div class="detail-section">
                    <h4>Related Order</h4>
                    <p>Order #${complaint.order_number}</p>
                </div>
                ` : ''}
                <div class="detail-section">
                    <h4>Status</h4>
                    <span class="status-badge status-${complaint.status.toLowerCase()}">${this.formatStatus(complaint.status)}</span>
                </div>
                ${complaint.admin_response ? `
                <div class="detail-section">
                    <h4>Admin Response</h4>
                    <p>${complaint.admin_response}</p>
                </div>
                ` : ''}
                <div class="detail-section">
                    <h4>Submitted</h4>
                    <p>${new Date(complaint.created_at).toLocaleString('id-ID')}</p>
                </div>
                ${complaint.updated_at !== complaint.created_at ? `
                <div class="detail-section">
                    <h4>Last Updated</h4>
                    <p>${new Date(complaint.updated_at).toLocaleString('id-ID')}</p>
                </div>
                ` : ''}
            </div>
        `;

        this.ui.showModal('complaintDetailModal');
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
}

let complaintsController;

document.addEventListener('DOMContentLoaded', () => {
    complaintsController = new ComplaintsController();
    window.complaintsController = complaintsController;
});

