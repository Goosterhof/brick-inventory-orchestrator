import type {RouteRecordRaw} from 'vue-router';

export const routes = [
    {
        path: '/settings',
        name: 'settings',
        component: () => import('./pages/SettingsPage.vue'),
        meta: {authOnly: true, title: 'pageTitle.settings'},
    },
] as const satisfies readonly RouteRecordRaw[];
