export default {
    template: `
        <div class="container mt-5">
            <div class="row mb-4">
                <div class="col">
                    <h2>Admin Dashboard</h2>
                    <button @click="exportCSV" class="btn btn-primary" :disabled="isExporting">
                        {{ isExporting ? 'Exporting...' : 'Export Completed Services to CSV' }}
                    </button>
                    <div v-if="exportStatus" :class="['alert', 'mt-2', exportStatus.type]">
                        {{ exportStatus.message }}
                    </div>
                </div>
            </div>

            <h3>Closed Services</h3>
            <div class="table-responsive">
                <table class="table table-striped" v-if="closedServices.length">
                    <thead>
                        <tr>
                            <th>Service Name</th>
                            <th>Date Closed</th>
                            <th>Status</th>
                            <th>Customer Email</th>
                            <th>Professional Email</th>
                            <th>Review</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="service in closedServices" :key="service.id">
                            <td>{{ service.service_name }}</td>
                            <td>{{ service.date_completed }}</td>
                            <td>{{ service.status }}</td>
                            <td>{{ service.customer_email }}</td>
                            <td>{{ service.professional_email }}</td>
                            <td>{{ service.review || 'No review' }}</td>
                        </tr>
                    </tbody>
                </table>
                <div v-else class="alert alert-info">
                    No closed services found
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            closedServices: [],
            error: null,
            users: [],
            isExporting: false,
            exportStatus: null,
            checkStatusInterval: null
        }
    },
    methods: {
        async exportCSV() {
            try {
                this.isExporting = true;
                this.exportStatus = { type: 'alert-info', message: 'Starting export...' };

                const response = await fetch('/download-csv', {
                    method: 'GET',
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token'),
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        this.exportStatus = { type: 'alert-danger', message: 'Authentication required' };
                        return;
                    }
                    throw new Error('Failed to start export');
                }

                const data = await response.json();
                this.checkExportStatus(data['task-id']);

            } catch (error) {
                this.exportStatus = { type: 'alert-danger', message: 'Export failed: ' + error.message };
                this.isExporting = false;
            }
        },

        async checkExportStatus(taskId) {
            if (this.checkStatusInterval) {
                clearInterval(this.checkStatusInterval);
            }

            this.checkStatusInterval = setInterval(async () => {
                try {
                    const response = await fetch(`/get-csv/${taskId}`, {
                        headers: {
                            'Authentication-Token': localStorage.getItem('auth-token'),
                            'Accept': 'application/json, text/csv'
                        }
                    });

                    if (response.status === 200) {
                        clearInterval(this.checkStatusInterval);
                        this.isExporting = false;
                        this.exportStatus = { type: 'alert-success', message: 'Export complete!' };
                        
                        // Handle file download
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `completed_services_${new Date().toISOString().slice(0,10)}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);

                    } else if (response.status === 202) {
                        this.exportStatus = { type: 'alert-info', message: 'Export in progress...' };
                    } else if (response.status === 401) {
                        clearInterval(this.checkStatusInterval);
                        this.isExporting = false;
                        this.exportStatus = { type: 'alert-danger', message: 'Authentication required' };
                    } else {
                        throw new Error('Export failed');
                    }

                } catch (error) {
                    clearInterval(this.checkStatusInterval);
                    this.isExporting = false;
                    this.exportStatus = { type: 'alert-danger', message: 'Export failed: ' + error.message };
                }
            }, 2000);
        }
    },
    async created() {
        try {
            // Fetch all users first
            const usersResponse = await fetch('/users', {
                headers: {
                    'Authentication-Token': localStorage.getItem('auth-token')
                }
            });
            if (!usersResponse.ok) {
                throw new Error('Failed to fetch users');
            }
            this.users = await usersResponse.json();

            // Fetch closed services
            const response = await fetch('/api/services/closed', {
                headers: {
                    'Authentication-Token': localStorage.getItem('auth-token')
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch closed services');
            }
            const data = await response.json();

            // Map services with user emails
            this.closedServices = data.map(service => {
                const customer = this.users.find(user => user.id === service.customer_id);
                const professional = this.users.find(user => user.id === service.professional_id);
                
                return {
                    ...service,
                    customer_email: customer ? customer.email : 'Unable to load',
                    professional_email: professional ? professional.email : 'Unable to load'
                };
            });

            this.error = null;
        } catch (error) {
            console.error('Error fetching data:', error);
            this.error = 'Failed to load data. Please try again later.';
            this.closedServices = [];
        }
    },
    beforeDestroy() {
        // Clean up interval when component is destroyed
        if (this.checkStatusInterval) {
            clearInterval(this.checkStatusInterval);
        }
    }
};
