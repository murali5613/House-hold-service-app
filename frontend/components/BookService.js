export default {
    template: `
        <div class="container mt-5">
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
            
            <div class="card shadow-sm">
                <div class="card-header">
                    <h3>Book a Service</h3>
                </div>
                <div class="card-body">
                    <!-- Search and Filter Section -->
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <label class="form-label">Service Type</label>
                            <select class="form-select" v-model="selectedService">
                                <option value="">Select a service</option>
                                <option v-for="service in services" :key="service.id" :value="service">
                                    {{ service.name }} - ₹{{ service.price }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Your Pincode</label>
                            <input type="text" class="form-control" v-model="userPincode" 
                                   placeholder="Enter your pincode" @input="checkAvailability">
                        </div>
                    </div>

                    <!-- Available Professionals Section -->
                    <div v-if="selectedService && userPincode" class="mt-4">
                        <h4>Available Professionals</h4>
                        <div v-if="loading" class="text-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                        <div v-else-if="availableProfessionals.length" class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Professional</th>
                                        <th>Experience</th>
                                        <th>Rating</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="prof in availableProfessionals" :key="prof.id">
                                        <td>{{ prof.username || prof.email }}</td>
                                        <td>{{ prof.experience_years }} years</td>
                                        <td>
                                            <i class="bi bi-star-fill text-warning"></i>
                                            {{ prof.rating || 'New' }}
                                        </td>
                                        <td>
                                            <button class="btn btn-primary btn-sm" 
                                                    @click="bookService(prof.id)"
                                                    :disabled="isBooking">
                                                {{ isBooking ? 'Booking...' : 'Book Now' }}
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else class="alert alert-info">
                            No professionals available in your area for this service.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            services: [],
            selectedService: null,
            userPincode: '',
            availableProfessionals: [],
            error: null,
            successMessage: null,
            loading: false,
            isBooking: false
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
                const data = await response.json();
                if (response.ok) {
                    this.services = data;
                } else {
                    this.error = 'Failed to fetch services';
                }
            } catch (err) {
                this.error = 'An error occurred while fetching services';
            }
        },

        async checkAvailability() {
            if (!this.selectedService || !this.userPincode || this.userPincode.length !== 6) {
                this.availableProfessionals = [];
                return;
            }

            this.loading = true;
            try {
                const response = await fetch(`/api/available-professionals`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': localStorage.getItem('auth-token')
                    },
                    body: JSON.stringify({
                        service_id: this.selectedService.id,
                        pincode: this.userPincode
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    this.availableProfessionals = data;
                    this.error = null;
                } else {
                    this.error = data.error;
                    this.availableProfessionals = [];
                }
            } catch (err) {
                this.error = 'Error checking service availability';
                this.availableProfessionals = [];
            } finally {
                this.loading = false;
            }
        },

        async bookService(professionalId) {
            this.isBooking = true;
            try {
                const response = await fetch('/api/book-service', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': localStorage.getItem('auth-token')
                    },
                    body: JSON.stringify({
                        service_id: this.selectedService.id,
                        professional_id: professionalId
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    this.successMessage = 'Service booked successfully!';
                    this.error = null;
                    // Reset form
                    this.selectedService = null;
                    this.userPincode = '';
                    this.availableProfessionals = [];
                } else {
                    this.error = data.error;
                    this.successMessage = null;
                }
            } catch (err) {
                this.error = 'Error booking service';
                this.successMessage = null;
            } finally {
                this.isBooking = false;
            }
        }
    },
    mounted() {
        this.fetchServices();
    },
    watch: {
        selectedService() {
            this.checkAvailability();
        }
    }
}
