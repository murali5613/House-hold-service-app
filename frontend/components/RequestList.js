export default {
    template: `
        <div class="container mt-5">
            <h2>Service Requests</h2>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
            <div class="table-responsive">
                <table class="table table-striped" v-if="activeRequests.length">
                    <thead>
                        <tr>
                            <th>Service Name</th>
                            <th>Customer Name</th>
                            <th>Location</th>
                            <th>Date Requested</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="request in activeRequests" :key="request.id">
                            <td>{{ request.service_name }}</td>
                            <td>{{ request.username }}</td>
                            <td>{{ request.location }}</td>
                            <td>{{ request.date_requested }}</td>
                            <td>
                                <span :class="getStatusClass(request.status)">
                                    {{ request.status }}
                                </span>
                            </td>
                            <td>
                                <select 
                                    class="form-select form-select-sm" 
                                    v-model="request.newStatus"
                                    @change="updateStatus(request.id, request.newStatus)"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-else class="alert alert-info">
                    No active service requests found
                </div>
            </div>

            <h2 class="mt-5">Closed Requests</h2>
            <div class="table-responsive">
                <table class="table table-striped" v-if="closedRequests.length">
                    <thead>
                        <tr>
                            <th>Service Name</th>
                            <th>Customer Name</th>
                            <th>Location</th>
                            <th>Date Requested</th>
                            <th>Date Completed</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="request in closedRequests" :key="request.id">
                            <td>{{ request.service_name }}</td>
                            <td>{{ request.username }}</td>
                            <td>{{ request.location }}</td>
                            <td>{{ request.date_requested }}</td>
                            <td>{{ request.date_completed }}</td>
                            <td>
                                <span :class="getStatusClass(request.status)">
                                    {{ request.status }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-else class="alert alert-info">
                    No closed service requests found
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            requests: [],
            error: null,
            successMessage: null
        };
    },
    computed: {
        activeRequests() {
            return this.requests.filter(req => !['completed', 'cancelled'].includes(req.status));
        },
        closedRequests() {
            return this.requests.filter(req => ['completed', 'cancelled'].includes(req.status));
        }
    },
    methods: {
        async fetchRequests() {
            try {
                const response = await fetch('/api/my-requests', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });
                const data = await response.json();
                
                if (response.ok) {
                    this.requests = data.map(req => ({
                        ...req,
                        newStatus: req.status
                    }));
                    this.error = null;
                } else {
                    this.error = data.error || 'Failed to fetch requests';
                }
            } catch (err) {
                this.error = 'An error occurred while fetching requests';
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
        },
        async updateStatus(requestId, newStatus) {
            try {
                const response = await fetch(`/api/request/${requestId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token'),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                const data = await response.json();

                if (response.ok) {
                    this.successMessage = data.message;
                    this.error = null;
                    await this.fetchRequests();
                } else {
                    this.error = data.error || 'Failed to update status';
                    this.successMessage = null;
                }
            } catch (err) {
                this.error = 'An error occurred while updating status';
                this.successMessage = null;
            }
        }
    },
    mounted() {
        this.fetchRequests();
    }
}
