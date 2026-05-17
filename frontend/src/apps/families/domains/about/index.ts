import type {RouteRecordRaw} from 'vue-router';

export const routes = [
    {path: '/about', name: 'about', component: () => import('./pages/AboutPage.vue'), meta: {title: 'pageTitle.about'}},
] as const satisfies readonly RouteRecordRaw[];
