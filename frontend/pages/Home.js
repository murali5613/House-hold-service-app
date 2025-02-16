import AdminDashboard from '../components/AdminDashboard.js';
import CustomerDashboard from '../components/CustomerDashboard.js';
import ProfessionalDashboard from '../components/ProfessionalDashboard.js'; 


export default {
    template: `<div>
    <CustomerDashboard v-if="userRole === 'customer'" />
    <ProfessionalDashboard v-else-if="userRole === 'professional'" />
    <AdminDashboard v-else-if="userRole === 'admin'" />
    </div>`,
    data() {
        return {
            userRole: localStorage.getItem('role'),
        };
    },

    components: {
        AdminDashboard,
        CustomerDashboard,
        ProfessionalDashboard,
    }, 
};
