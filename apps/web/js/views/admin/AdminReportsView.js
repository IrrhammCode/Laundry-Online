// Admin Reports View
import { UI } from '../../utils/ui.js';

export class AdminReportsView {
    constructor() {
        this.ui = new UI();
        this.revenueChart = null;
        this.serviceChart = null;
        this.statusChart = null;
        this.reportData = null;
    }

    showUserNav(user) {
        const adminName = document.getElementById('adminName');
        if (adminName) {
            adminName.textContent = user.name || 'Admin';
        }
    }

    showLoading() {
        // Loading is handled per section
    }

    hideLoading() {
        // Loading is handled per section
    }

    showAlert(message, type) {
        this.ui.showAlert(message, type);
    }

    redirect(url) {
        window.location.href = url;
    }

    renderSalesReport(data) {
        this.reportData = data;
        
        // Render summary cards
        this.renderSummaryCards(data);
        
        // Render service chart
        this.renderServiceChart(data.sales_by_service || []);
        
        // Render status chart
        this.renderStatusChart(data.sales_by_status || []);
    }

    renderRevenueReport(data) {
        // Render revenue trend chart
        this.renderRevenueChart(data.revenue_trend || []);
        
        // Update summary with revenue data
        if (data.summary) {
            this.updateSummaryCards(data.summary);
        }
    }

    renderCustomersReport(data) {
        this.renderTopCustomers(data.top_customers || []);
    }

    renderSummaryCards(data) {
        const summaryCards = document.getElementById('summaryCards');
        if (!summaryCards) return;

        const salesByDate = data.sales_by_date || [];
        const totalRevenue = salesByDate.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);
        const totalOrders = salesByDate.reduce((sum, item) => sum + parseInt(item.order_count || 0), 0);
        const uniqueCustomers = new Set(salesByDate.flatMap(item => item.unique_customers || [])).size;

        summaryCards.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon" style="color: #28a745;">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-content">
                    <h3>Rp ${totalRevenue.toLocaleString('id-ID')}</h3>
                    <p>Total Revenue</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: #007bff;">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <div class="stat-content">
                    <h3>${totalOrders}</h3>
                    <p>Total Orders</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: #17a2b8;">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-content">
                    <h3>${uniqueCustomers}</h3>
                    <p>Unique Customers</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color: #ffc107;">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-content">
                    <h3>Rp ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(0) : 0}</h3>
                    <p>Average Order Value</p>
                </div>
            </div>
        `;
    }

    updateSummaryCards(summary) {
        // Update with revenue summary data if available
        const summaryCards = document.getElementById('summaryCards');
        if (!summaryCards || !summary) return;

        const cards = summaryCards.querySelectorAll('.stat-card');
        if (cards.length >= 2 && summary.avg_order_value) {
            const avgCard = cards[3];
            if (avgCard) {
                const content = avgCard.querySelector('.stat-content h3');
                if (content) {
                    content.textContent = `Rp ${parseFloat(summary.avg_order_value).toLocaleString('id-ID')}`;
                }
            }
        }
    }

    renderRevenueChart(data) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        // Destroy existing chart if exists
        if (this.revenueChart) {
            this.revenueChart.destroy();
        }

        // Check if data is empty
        if (!data || data.length === 0) {
            ctx.parentElement.innerHTML = '<p class="empty-message">No revenue data available for the selected period</p>';
            return;
        }

        const labels = data.map(item => {
            if (item.period && item.period.includes('-')) {
                // Month format (e.g., "2025-12")
                const [year, month] = item.period.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${monthNames[parseInt(month) - 1]} ${year}`;
            }
            if (item.period) {
                return new Date(item.period).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
            }
            return item.period || 'Unknown';
        });
        
        const revenueData = data.map(item => parseFloat(item.total_revenue || 0));
        const orderData = data.map(item => parseInt(item.order_count || 0));

        this.revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Revenue (Rp)',
                        data: revenueData,
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#007bff',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        yAxisID: 'y',
                        tension: 0.4,
                        showLine: true
                    },
                    {
                        label: 'Orders',
                        data: orderData,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#28a745',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        yAxisID: 'y1',
                        tension: 0.4,
                        showLine: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                elements: {
                    line: {
                        borderJoinStyle: 'round',
                        borderCapStyle: 'round'
                    },
                    point: {
                        hoverRadius: 6,
                        hoverBorderWidth: 2
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Period'
                        },
                        grid: {
                            display: true,
                            drawBorder: true
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Revenue (Rp)'
                        },
                        beginAtZero: true,
                        grid: {
                            display: true,
                            drawBorder: true
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Orders'
                        },
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false,
                            drawBorder: true
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });
    }

    renderServiceChart(data) {
        const ctx = document.getElementById('serviceChart');
        if (!ctx) return;

        if (this.serviceChart) {
            this.serviceChart.destroy();
        }

        const labels = data.map(item => item.name);
        const revenueData = data.map(item => parseFloat(item.total_revenue || 0));

        this.serviceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue (Rp)',
                    data: revenueData,
                    backgroundColor: [
                        'rgba(0, 123, 255, 0.8)',
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(220, 53, 69, 0.8)',
                        'rgba(108, 117, 125, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue (Rp)'
                        }
                    }
                }
            }
        });
    }

    renderStatusChart(data) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        if (this.statusChart) {
            this.statusChart.destroy();
        }

        const labels = data.map(item => this.formatStatus(item.status));
        const countData = data.map(item => parseInt(item.count || 0));

        this.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: countData,
                    backgroundColor: [
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(0, 123, 255, 0.8)',
                        'rgba(23, 162, 184, 0.8)',
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(108, 117, 125, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'right'
                    }
                }
            }
        });
    }

    renderTopCustomers(customers) {
        const tableBody = document.getElementById('topCustomersTable');
        if (!tableBody) return;

        if (customers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-message">No customer data available</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = customers.map(customer => `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.order_count}</td>
                <td>Rp ${parseFloat(customer.total_spent || 0).toLocaleString('id-ID')}</td>
                <td>${customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString('id-ID') : 'N/A'}</td>
            </tr>
        `).join('');
    }

    formatStatus(status) {
        const statusMap = {
            'DIPESAN': 'Dipesan',
            'DIJEMPUT': 'Dijemput',
            'DICUCI': 'Dicuci',
            'DIKIRIM': 'Dikirim',
            'SELESAI': 'Selesai'
        };
        return statusMap[status] || status;
    }

    getReportData() {
        return this.reportData;
    }
}

