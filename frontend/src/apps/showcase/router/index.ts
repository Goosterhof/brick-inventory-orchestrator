import type {RouteRecordRaw} from 'vue-router';

import {createRouterService} from '@script-development/fs-router';

const routes = [
    {path: '/', name: 'showcase', component: () => import('../pages/ShowcaseHome.vue')},
    {path: '/playground', name: 'playground', component: () => import('../pages/PlaygroundPage.vue')},
] as const satisfies readonly RouteRecordRaw[];

const routerService = createRouterService([...routes], {base: import.meta.env.BASE_URL});

export const showcaseRouterService = routerService;
export const ShowcaseRouterView = routerService.RouterView;
export const ShowcaseRouterLink = routerService.RouterLink;
