export default {
    template: `
        <div class="container mt-5">
            <h2>My Service Requests</h2>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <div class="table-responsive">
                <table class="table table-striped" v-if="services.length">
                    <thead>
                        <tr>
                            <th>Service Name</th>
                            <th>Date Requested</th>
                            <th>Status</th>
                            <th>Professional ID</th>
                            <th>Completion Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="service in services" :key="service.id">
                            <td>{{ service.service_name }}</td>
                            <td>{{ service.date_requested }}</td>
                            <td>
                                <span :class="getStatusClass(service.status)">
                                    {{ service.status }}
                                </span>
                            </td>
                            <td>{{ service.professional_id }}</td>
                            <td>{{ service.date_completed || 'Pending' }}</td>
                        </tr>
                    </tbody>
                </table>
                <div v-else class="alert alert-info">
                    No service requests found
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            services: [],
            error: null
        };
    },
    methods: {
        async fetchServices() {
            try {
                const response = await fetch('/api/my-services', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });
                const data = await response.json();
                
                if (response.ok) {
                    this.services = data;
                    this.error = null;
                } else {
                    this.error = data.error || 'Failed to fetch services';
                }
            } catch (err) {
                this.error = 'An error occurred while fetching services';
            }
        },
        getStatusClass(status) {
            const classes = {
                'pending': 'badge bg-warning',
                'in_progress': 'badge bg-primary',
                'completed': 'badge bg-success',
                'cancelled': 'badge bg-danger'
            };
            return classes[status] || 'badge bg-secondary';
        }
    },
    mounted() {
        this.fetchServices();
    }
}
