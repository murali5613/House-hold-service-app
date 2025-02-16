export default {
    name: 'Navbar',
    template: `
    <nav class="navbar navbar-expand-lg navbar-dark mb-4">
        <div class="container">
            <router-link class="navbar-brand" to="/">
                <i class="bi bi-grid"></i> Service Portal
            </router-link>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <router-link class="nav-link" to="/">
                            <i class="bi bi-house"></i> Home
                        </router-link>
                    </li>
                    <li class="nav-item" v-if="!isLoggedIn">
                        <router-link class="nav-link" to="/login">
                            <i class="bi bi-person"></i> Login
                        </router-link>
                    </li>
                    <li class="nav-item" v-if="role === 'admin'">
                        <router-link class="nav-link" to="/users">
                            <i class="bi bi-people"></i> Users
                        </router-link>
                    </li>
                    <li class="nav-item" v-if="role === 'admin'">
                        <router-link class="nav-link" to="/service">
                            <i class="bi bi-tools"></i> Service
                        </router-link>
                    </li>
                    <li class="nav-item" v-if="!isLoggedIn">
                        <router-link class="nav-link" to="/register">
                            <i class="bi bi-person-plus"></i> Register
                        </router-link>
                    </li>
                </ul>
                <ul class="navbar-nav">
                    <li class="nav-item" v-if="isLoggedIn">
                        <a href="#" class="nav-link" @click.prevent="logout">
                            <i class="bi bi-box-arrow-right"></i> Logout
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
    `,
    data() {
        return {
            role: localStorage.getItem('role'),
            };
    },
    computed: {
        isLoggedIn() {
            return !!localStorage.getItem('auth-token');
        }
    },
    methods: {
        logout() {
            localStorage.removeItem('auth-token');
            localStorage.removeItem('role');
            localStorage.removeItem('user-id');  
            this.$router.push('/login');
            this.$forceUpdate();
        },
    },
};

