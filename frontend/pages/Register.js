export default {
    name: 'Register',
    template: `
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card shadow-sm">
                    <div class="card-header">
                        <h3 class="text-center mb-0">
                            <i class="bi bi-person-plus"></i> Register
                        </h3>
                    </div>
                    <div class="card-body bg-light">
                        <form @submit.prevent="register">
                            <div class="mb-3">
                                <label class="form-label text-dark">
                                    <i class="bi bi-person-badge"></i> Register as
                                </label>
                                <select class="form-select border-dark" v-model="user.role" required>
                                    <option value="customer">Customer</option>
                                    <option value="professional">Professional</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label text-dark">
                                    <i class="bi bi-envelope"></i> Email address
                                </label>
                                <input type="email" class="form-control border-dark" v-model="user.email" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label text-dark">
                                    <i class="bi bi-person"></i> Username
                                </label>
                                <input type="text" class="form-control border-dark" v-model="user.username" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label text-dark">
                                    <i class="bi bi-lock"></i> Password
                                </label>
                                <input type="password" class="form-control border-dark" v-model="user.password" required>
                            </div>

                            <!-- Location and Pincode for both roles -->
                            <div class="mb-3">
                                <label class="form-label text-dark">
                                    <i class="bi bi-geo-alt"></i> Location
                                </label>
                                <input type="text" class="form-control border-dark" v-model="user.location" required>
                            </div>

                            <div class="mb-3">
                                <label class="form-label text-dark">
                                    <i class="bi bi-pin-map"></i> Pincode
                                </label>
                                <input type="text" class="form-control border-dark" v-model="user.pincode" 
                                       pattern="[0-9]{6}" title="Please enter a valid 6-digit pincode" required>
                            </div>

                            <!-- Professional specific fields -->
                            <div v-if="user.role === 'professional'">
                                <div class="mb-3">
                                    <label class="form-label text-dark">
                                        <i class="bi bi-tools"></i> Service Type
                                    </label>
                                    <select class="form-select border-dark" v-model="user.service_type" required>
                                        <option v-for="service in services" :key="service.id" :value="service.name">
                                            {{service.name}}
                                        </option>
                                    </select>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label text-dark">
                                        <i class="bi bi-clock-history"></i> Experience (years)
                                    </label>
                                    <input type="number" class="form-control border-dark" v-model="user.experience_years" 
                                           min="0" required>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label text-dark">
                                        <i class="bi bi-file-earmark-text"></i> Document URL
                                    </label>
                                    <input type="url" class="form-control border-dark" v-model="user.document_url" 
                                           placeholder="https://example.com/document.pdf" required>
                                </div>
                            </div>

                            <div v-if="error" class="alert alert-danger">{{ error }}</div>

                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            user: {
                email: '',
                username: '',
                password: '',
                role: 'customer',
                location: '',
                pincode: '',
                service_type: '',
                experience_years: 0,
                document_url: ''
            },
            services: [],
            error: ''
        };
    },
    methods: {
        async register() {
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(this.user),
                });
                if (response.ok) {
                    // Handle successful registration
                    this.$router.push('/login');
                } else {
                    const data = await response.json();
                    this.error = data.error;
                }
            } catch (error) {
                this.error = 'An error occurred. Please try again later.';
            }
        },
        async getServices() {
            try {
                const response = await fetch('/api/service');
                if (response.ok) {
                    const data = await response.json();
                    this.services = data;
                } else {
                    this.error = 'Failed to fetch services';
                }
            } catch (error) {
                this.error = 'An error occurred while fetching services';
            }
        }
    },
    created() {
        this.getServices();
    }
};
