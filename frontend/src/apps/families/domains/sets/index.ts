import type {RouteRecordRaw} from 'vue-router';

export const routes = [
    {
        path: '/sets',
        name: 'sets',
        component: () => import('./pages/SetsOverviewPage.vue'),
        meta: {authOnly: true, title: 'pageTitle.sets'},
    },
    {
        path: '/sets/add',
        name: 'sets-add',
        component: () => import('./pages/AddSetPage.vue'),
        meta: {authOnly: true, title: 'pageTitle.addSet'},
    },
    {
        path: '/sets/scan',
        name: 'sets-scan',
        component: () => import('./pages/ScanSetPage.vue'),
        meta: {authOnly: true, title: 'pageTitle.scanSet'},
    },
    {
        path: '/sets/identify',
        name: 'sets-identify',
        component: () => import('./pages/IdentifyBrickPage.vue'),
        meta: {authOnly: true, title: 'pageTitle.identifyBrick'},
    },
    {
        path: '/sets/:id',
        name: 'sets-detail',
        component: () => import('./pages/SetDetailPage.vue'),
        meta: {authOnly: true, title: 'pageTitle.setDetail'},
    },
    {
        path: '/sets/:id/edit',
        name: 'sets-edit',
        component: () => import('./pages/EditSetPage.vue'),
        meta: {authOnly: true, title: 'pageTitle.editSet'},
    },
] as const satisfies readonly RouteRecordRaw[];
