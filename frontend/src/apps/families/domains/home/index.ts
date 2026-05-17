import type {RouteRecordRaw} from 'vue-router';

export const routes = [
    {path: '/', name: 'home', component: () => import('./pages/HomePage.vue'), meta: {title: 'pageTitle.home'}},
] as const satisfies readonly RouteRecordRaw[];
