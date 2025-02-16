export default {
    name: 'ServiceForm',
    template: `
        <div class="container mt-4">
            <div class="card mb-4 shadow-sm">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3 class="mb-0">Services List</h3>
                    <button class="btn btn-outline-light" @click="showForm = !showForm">
                        {{ showForm ? 'Hide Form' : 'Add New Service' }}
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Price</th>
                                    <th>Time Required</th>
                                    <th>Description</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="service in services" :key="service.id">
                                    <td>{{service.name}}</td>
                                    <td>{{service.price}}</td>
                                    <td>{{service.time_required}} Hours</td>
                                    <td>{{service.description}}</td>
                                    <td>
                                        <button class="btn btn-primary btn-sm me-2" @click="editService(service)">Edit</button>
                                        <button class="btn btn-danger btn-sm" @click="deleteService(service.id)">Delete</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div v-if="showForm" class="card">
                <div class="card-header bg-primary text-white">
                    <h3 class="mb-0">{{ isEditing ? 'Edit Service' : 'Add New Service' }}</h3>
                </div>
                <div class="card-body">
                    <form @submit.prevent="submitService" class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label text-dark">Service Name</label>
                            <input type="text" 
                                   class="form-control border-dark" 
                                   v-model="service.name" 
                                   required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Price</label>
                            <div class="input-group">
                                <span class="input-group-text">$</span>
                                <input type="number" step="0.01" class="form-control" v-model="service.price" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Time Required (minutes)</label>
                            <input type="number" class="form-control" v-model="service.time_required">
                        </div>
                        <div class="col-12">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" v-model="service.description" rows="3"></textarea>
                        </div>
                        <div class="col-12">
                            <button type="submit" class="btn btn-primary">
                                {{ isEditing ? 'Update Service' : 'Add Service' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            services: [],
            showForm: false,
            isEditing: false,
            service: {
                id: null,
                name: '',
                price: '',
                time_required: '',
                description: ''
            },
            error: '',
            successMessage: ''
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
                } else {
                    this.error = 'Failed to fetch services';
                }
            } catch (err) {
                this.error = 'An error occurred while fetching services';
            }
        },
        async submitService() {
            try {
                const url = this.isEditing ? `/api/service/${this.service.id}` : '/api/service';
                const method = this.isEditing ? 'PUT' : 'POST';
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': localStorage.getItem('auth-token')
                    },
                    body: JSON.stringify(this.service)
                });

                if (response.ok) {
                    this.successMessage = this.isEditing ? 'Service updated successfully' : 'Service added successfully';
                    this.error = '';
                    // Reset form
                    this.resetForm();
                    // Refresh services list
                    await this.fetchServices();
                    // Hide form after successful submission
                    this.showForm = false;
                } else {
                    const data = await response.json();
                    this.error = data.error || (this.isEditing ? 'Failed to update service' : 'Failed to add service');
                    this.successMessage = '';
                }
            } catch (err) {
                this.error = 'An error occurred while ' + (this.isEditing ? 'updating' : 'adding') + ' the service';
                this.successMessage = '';
            }
        },
        async deleteService(serviceId) {
            if (confirm('Are you sure you want to delete this service?')) {
                try {
                    const response = await fetch(`/api/service/${serviceId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authentication-Token': localStorage.getItem('auth-token'),
                            'role': localStorage.getItem('role')
                        }
                    });

                    if (response.ok) {
                        this.successMessage = 'Service deleted successfully';
                        this.error = '';
                        await this.fetchServices();
                    } else {
                        const data = await response.json();
                        this.error = data.error || 'Failed to delete service';
                        this.successMessage = '';
                    }
                } catch (err) {
                    this.error = 'An error occurred while deleting the service';
                    this.successMessage = '';
                }
            }
        },
        editService(service) {
            this.isEditing = true;
            this.service = { ...service };
            this.showForm = true;
        },
        resetForm() {
            this.service = {
                id: null,
                name: '',
                price: '',
                time_required: '',
                description: ''
            };
            this.isEditing = false;
        }
    },
    mounted() {
        this.fetchServices();
    }
};
