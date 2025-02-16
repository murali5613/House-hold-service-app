import router from './utils/router.js';
import Navbar from './components/Navbar.js';

router.beforeEach((to, from, next) => {
    const publicPages = ['Login', 'Register'];  // Add all public routes here
    const authRequired = !publicPages.includes(to.name);
    const isAuthenticated = !!localStorage.getItem('auth-token');

    if (authRequired && !isAuthenticated) {
        next({ name: 'Login' });
    } else {
        next();
    }
});

const app = Vue.createApp({
    template: `<div>
    <navbar :key="$route.fullPath" />
    <router-view /></div>`,
});

app.use(router);
app.component('navbar', Navbar);
app.mount('#app');