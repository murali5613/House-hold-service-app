import BookService from './BookService.js';

export default {
    components: {
        BookService
    },
    template: `
        <div class="container mt-4">
            <div class="card mb-4 shadow-sm">
                <div class="card-header">
                    <h3 class="mb-0">Available Services</h3>
                </div>
                <div class="card-body bg-light">
                    <div class="mb-3">
                        <input v-model="searchQuery" 
                               @input="searchServices" 
                               class="form-control border-dark" 
                               type="text" 
                               placeholder="Search services...">
                    </div>
                    <div class="row g-4">
                        <div v-for="service in filteredServices" 
                             :key="service.id" 
                             class="col-md-4">
                            <div class="card h-100 shadow-sm">
                                <div class="card-body">
                                    <h5 class="card-title text-dark">{{service.name}}</h5>
                                    <div class="card-text">
                                        <p class="mb-1 text-secondary">
                                            <i class="bi bi-currency-dollar"></i> 
                                            <strong>Price:</strong> $ {{service.price}}
                                        </p>
                                        <p class="mb-1 text-secondary">
                                            <i class="bi bi-clock"></i> 
                                            <strong>Duration:</strong> {{service.time_required}} Hours
                                        </p>
                                        <p class="mb-3 text-secondary">
                                            <i class="bi bi-info-circle"></i> 
                                            {{service.description}}
                                        </p>
                                    </div>
                                    <button @click="bookService(service.id)" class="btn btn-primary w-100">
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card shadow-sm">
                <div class="card-header">
                    <h3 class="mb-0">My Service Requests</h3>
                </div>
                <div class="card-body">
                    <div v-if="error" class="alert alert-danger">{{ error }}</div>
                    <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Service Name</th>
                                    <th>Date Requested</th>
                                    <th>Status</th>
                                    <th>Professional ID</th>
                                    <th>Completion Date</th>
                                    <th>Review</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="service in myServices" :key="service.id">
                                    <td>{{ service.service_name }}</td>
                                    <td>{{ service.date_requested }}</td>
                                    <td>
                                        <span :class="getStatusClass(service.status)">
                                            {{ service.status }}
                                        </span>
                                    </td>
                                    <td>{{ service.professional_id }}</td>
                                    <td>{{ service.date_completed || 'Pending' }}</td>
                                    <td>
                                        <div v-if="service.status === 'completed'">
                                            <div v-if="!service.review">
                                                <textarea v-model="service.reviewText" class="form-control" rows="2"></textarea>
                                                <button @click="submitReview(service.id, service.reviewText)" 
                                                        class="btn btn-primary btn-sm mt-1">
                                                    Submit Review
                                                </button>
                                            </div>
                                            <div v-else>
                                                <div v-if="service.isEditingReview">
                                                    <textarea v-model="service.editedReview" class="form-control" rows="2"></textarea>
                                                    <button @click="saveReviewEdit(service)" class="btn btn-success btn-sm mt-1">
                                                        Save
                                                    </button>
                                                    <button @click="cancelReviewEdit(service)" class="btn btn-secondary btn-sm mt-1 ms-1">
                                                        Cancel
                                                    </button>
                                                </div>
                                                <div v-else>
                                                    <span>{{ service.review }}</span>
                                                    <button @click="startReviewEdit(service)" class="btn btn-warning btn-sm ms-2">
                                                        Edit Review
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <span v-else>-</span>
                                    </td>
                                    <td>
                                        <button 
                                            v-if="service.status === 'pending'"
                                            @click="cancelService(service.id)"
                                            class="btn btn-danger btn-sm"
                                        >
                                            Cancel
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            services: [],
            myServices: [],
            error: null,
            successMessage: null,
            searchQuery: '',
            filteredServices: []
        };
    },
    methods: {
        async fetchServices() {
            try {
                const response = await fetch('/api/service', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });
                if (response.ok) {
                    this.services = await response.json();
                    this.filteredServices = this.services;
                } else {
                    this.error = 'Failed to fetch services';
                }
            } catch (err) {
                this.error = 'An error occurred while fetching services';
            }
        },
        async bookService(serviceId) {
            try {
                const response = await fetch(`/book/${serviceId}`, {
                    method: 'POST',
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token'),
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    this.successMessage = 'Service booked successfully!';
                    this.error = null;
                    await this.fetchMyServices(); // Refresh the services list
                } else {
                    const data = await response.json();
                    this.error = data.error || 'Failed to book service';
                    this.successMessage = null;
                }
            } catch (err) {
                this.error = 'An error occurred while booking the service';
                this.successMessage = null;
            }
        },
        startReviewEdit(service) {
            service.isEditingReview = true;
            service.editedReview = service.review;
        },
        cancelReviewEdit(service) {
            service.isEditingReview = false;
            service.editedReview = '';
        },
        async saveReviewEdit(service) {
            try {
                const response = await fetch(`/api/request/${service.id}/review`, {
                    method: 'PUT',
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token'),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ review: service.editedReview })
                });

                const data = await response.json();

                if (response.ok) {
                    service.review = service.editedReview;
                    service.isEditingReview = false;
                    this.successMessage = 'Review updated successfully';
                    this.error = null;
                    await this.fetchMyServices(); // Refresh services after update
                } else {
                    this.error = data.error || 'Failed to update review';
                    this.successMessage = null;
                }
            } catch (err) {
                this.error = 'An error occurred while updating the review';
                this.successMessage = null;
            }
        },
        async submitReview(requestId, reviewText) {
            try {
                const response = await fetch(`/api/request/${requestId}/review`, {
                    method: 'PUT',
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token'),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ review: reviewText })
                });

                const data = await response.json();

                if (response.ok) {
                    await this.fetchMyServices(); // Refresh services after submitting review
                    this.successMessage = 'Review submitted successfully';
                    this.error = null;
                } else {
                    this.error = data.error || 'Failed to submit review';
                    this.successMessage = null;
                }
            } catch (err) {
                this.error = 'An error occurred while submitting the review';
                this.successMessage = null;
            }
        },
        async cancelService(requestId) {
            if (confirm('Are you sure you want to cancel this service request?')) {
                try {
                    const response = await fetch(`/api/request/${requestId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Authentication-Token': localStorage.getItem('auth-token'),
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: 'cancelled' })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        this.successMessage = 'Service request cancelled successfully';
                        this.error = null;
                        await this.fetchMyServices();
                    } else {
                        this.error = data.error || 'Failed to cancel service request';
                        this.successMessage = null;
                    }
                } catch (err) {
                    this.error = 'An error occurred while cancelling the service request';
                    this.successMessage = null;
                }
            }
        },
        async fetchMyServices() {
            try {
                const response = await fetch('/api/my-services', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch services');
                }
                const data = await response.json();
                
                this.myServices = data.map(service => ({
                    ...service,
                    isEditingReview: false,
                    editedReview: '',
                    reviewText: '',
                    review: service.review || '' // Ensure review is initialized
                }));
                this.error = null;
            } catch (err) {
                this.error = err.message || 'An error occurred while fetching services';
                this.myServices = [];
            }
        },
        getStatusClass(status) {
            const classes = {
                'pending': 'badge bg-secondary',
                'in_progress': 'badge bg-dark',
                'completed': 'badge bg-success',
                'cancelled': 'badge bg-danger'
            };
            return classes[status] || 'badge bg-secondary';
        },
        searchServices() {
            if (this.searchQuery) {
                this.filteredServices = this.services.filter(service => 
                    service.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                    service.description.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            } else {
                this.filteredServices = this.services;
            }
        }
    },
    mounted() {
        this.fetchServices();
        this.fetchMyServices();
    }
}
