import type {RouteRecordRaw} from 'vue-router';

export const routes = [
    {
        path: '/login',
        name: 'login',
        component: () => import('./pages/LoginPage.vue'),
        meta: {canSeeWhenLoggedIn: false, title: 'pageTitle.logIn'},
    },
] as const satisfies readonly RouteRecordRaw[];
