export default {
    name: 'Users',
    template: `
        <div class="container mt-5">
            <div v-if="error" class="alert alert-danger"> {{ error }} </div>
            <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>
            
            <!-- Professionals Section -->
            <div class="row mb-5">
                <div class="col-12">
                    <h2>Professionals List</h2>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Experience</th>
                                    <th>Service Type</th>
                                    <th>Location</th>
                                    <th>Pincode</th>
                                    <th>Documents</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="user in professionalUsers" :key="user.id">
                                    <td>{{user.email}}</td>
                                    <td>{{user.username || 'Not Set'}}</td>
                                    <td>{{user.experience_years}} years</td>
                                    <td>{{user.service_type || 'Not Set'}}</td>
                                    <td>
                                        <span v-if="user.location">
                                            <i class="bi bi-geo-alt"></i> {{user.location}}
                                        </span>
                                        <span v-else class="text-muted">
                                            Not Set
                                        </span>
                                    </td>
                                    <td>
                                        <span v-if="user.pincode">
                                            {{user.pincode}}
                                        </span>
                                        <span v-else class="text-muted">
                                            Not Set
                                        </span>
                                    </td>
                                    <td>
                                        <a v-if="user.document_url" 
                                           :href="user.document_url" 
                                           target="_blank" 
                                           class="btn btn-sm btn-info">
                                            <i class="bi bi-file-earmark-text"></i> View
                                        </a>
                                        <span v-else class="text-muted">
                                            No docs
                                        </span>
                                    </td>
                                    <td>
                                        <span :class="['badge', user.active ? 'bg-success' : 'bg-danger']">
                                            {{user.active ? 'Active' : 'Inactive'}}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="btn-group">
                                            <button 
                                                @click="toggleActivation(user.id)"
                                                :class="['btn', 'btn-sm', user.active ? 'btn-danger' : 'btn-success']"
                                            >
                                                {{user.active ? 'Deactivate' : 'Activate'}}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Customers Section -->
            <div class="row">
                <div class="col-12">
                    <h2>Customers List</h2>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="user in customerUsers" :key="user.id">
                                    <td>{{user.email}}</td>
                                    <td>{{user.username || 'Not Set'}}</td>
                                    <td>
                                        <span :class="['badge', user.active ? 'bg-success' : 'bg-danger']">
                                            {{user.active ? 'Active' : 'Inactive'}}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            @click="toggleActivation(user.id)"
                                            :class="['btn', 'btn-sm', user.active ? 'btn-danger' : 'btn-success']"
                                        >
                                            {{user.active ? 'Deactivate' : 'Activate'}}
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
            allUsers: [],
            token: localStorage.getItem('auth-token'),
            error: null,
            successMessage: null
        }
    },
    computed: {
        professionalUsers() {
            return this.allUsers.filter(user => 
                user.roles.includes('professional') && !user.roles.includes('admin')
            );
        },
        customerUsers() {
            return this.allUsers.filter(user => 
                user.roles.includes('customer') && !user.roles.includes('admin')
            );
        }
    },
    methods: {
        async toggleActivation(userId) {
            try {
                const response = await fetch(`/activate/user/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Authentication-Token': this.token,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    // Update the user's active status in the local state
                    const userIndex = this.allUsers.findIndex(user => user.id === userId);
                    if (userIndex !== -1) {
                        this.allUsers[userIndex].active = !this.allUsers[userIndex].active;
                    }
                    this.successMessage = data.message;
                    this.error = null;
                    
                    // Hide success message after 3 seconds
                    setTimeout(() => {
                        this.successMessage = null;
                    }, 3000);
                } else {
                    this.error = data.error || 'Failed to toggle user activation';
                    this.successMessage = null;
                }
            } catch (err) {
                this.error = 'An error occurred while updating user status';
                this.successMessage = null;
            }
        }
    },
    async mounted() {
        try {
            const response = await fetch('/users', {
                headers: {
                    'Authentication-Token': this.token,
                }
            });
            const data = await response.json();
            if (response.ok) {
                this.allUsers = data;
            } else {
                this.error = data.error || 'Failed to fetch users';
            }
        } catch (err) {
            this.error = 'An error occurred while fetching users';
        }
    }
}
