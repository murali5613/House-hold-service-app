export default {
    name: 'Login',
    template: `
    <div class="container mt-5">
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card shadow-sm">
                    <div class="card-header">
                        <h3 class="text-center mb-0">
                            <i class="bi bi-person-circle"></i> Login
                        </h3>
                    </div>
                    <div class="card-body bg-light">
                        <form @submit.prevent="login">
                            <div class="mb-3">
                                <label for="email" class="form-label text-dark">
                                    <i class="bi bi-envelope"></i> Email address
                                </label>
                                <input type="email" class="form-control border-dark" id="email" v-model="cred.email" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label text-dark">
                                    <i class="bi bi-lock"></i> Password
                                </label>
                                <input type="password" class="form-control border-dark" id="password" v-model="cred.password" required>
                            </div>
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">Login</button>
                            </div>
                            <div class="text-danger">{{error}}</div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            cred: {
                email: '',
                password: '',
                active: true
            },
            error: '',
            userId: null
        };
    },
    methods: {
        async login() {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.cred),
            });
            if (response.ok) {
                const data = await response.json();
                if (data.active) {
                    localStorage.setItem('auth-token', data.token);
                    localStorage.setItem('role', data.roles);
                    localStorage.setItem('user-id', data.id);
                    this.$router.push({ path: '/' });
                } else {
                    this.error = 'Your account is not active. Please contact administrator.';
                }
            } else {
                this.error = 'Invalid email or password';
            }
        },
    },
};
