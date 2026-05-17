import type {RouteRecordRaw} from 'vue-router';

export const routes = [
    {
        path: '/storage',
        name: 'storage',
        component: () => import('./pages/StorageOverviewPage.vue'),
        meta: {authOnly: true, title: 'pageTitle.storage'},
    },
    {
        path: '/storage/add',
        name: 'storage-add',
        component: () => import('./pages/AddStoragePage.vue'),
        meta: {authOnly: true, title: 'pageTitle.addStorage'},
    },
    {
        path: '/storage/:id',
        name: 'storage-detail',
        component: () => import('./pages/StorageDetailPage.vue'),
        meta: {authOnly: true, title: 'pageTitle.storageDetail'},
    },
    {
        path: '/storage/:id/edit',
        name: 'storage-edit',
        component: () => import('./pages/EditStoragePage.vue'),
        meta: {authOnly: true, title: 'pageTitle.editStorage'},
    },
] as const satisfies readonly RouteRecordRaw[];
