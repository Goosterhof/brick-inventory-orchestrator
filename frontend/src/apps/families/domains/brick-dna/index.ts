import type {RouteRecordRaw} from 'vue-router';

export const routes = [
    {
        path: '/brick-dna',
        name: 'brick-dna',
        component: () => import('./pages/BrickDnaPage.vue'),
        meta: {authOnly: true, title: 'pageTitle.brickDna'},
    },
] as const satisfies readonly RouteRecordRaw[];
