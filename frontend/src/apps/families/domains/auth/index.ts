import type {RouteRecordRaw} from 'vue-router';

export const routes = [
    {
        path: '/register',
        name: 'register',
        component: () => import('./pages/RegisterPage.vue'),
        meta: {canSeeWhenLoggedIn: false, title: 'pageTitle.register'},
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('./pages/LoginPage.vue'),
        meta: {canSeeWhenLoggedIn: false, title: 'pageTitle.logIn'},
    },
] as const satisfies readonly RouteRecordRaw[];
