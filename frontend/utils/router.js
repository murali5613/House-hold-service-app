// utils/router.js
const { createRouter, createWebHistory } = VueRouter;

import Login from '../pages/Login.js';
import Home from '../pages/Home.js';
import Register from '../pages/Register.js';
import Users from '../components/Users.js';
import ServiceForm from '../components/ServiceForm.js';
const routes = [
    {
        path: '/',
        component: Home,
    },
    {
        path: '/login',
        component: Login,
        name: 'Login',
    },
    {
        path: '/register',
        component: Register,
        name: 'Register',
    },
    {
        path: '/users',
        component: Users,
        name: 'Users',
    },
    {
        path: '/service',
        component: ServiceForm,
        name: 'ServiceForm',
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
