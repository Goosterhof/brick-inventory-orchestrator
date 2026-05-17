import type {RouteRecordRaw} from 'vue-router';

import {createRouter, createWebHistory} from 'vue-router';

const routes = [
    {path: '/', name: 'showcase', component: () => import('../pages/ShowcaseHome.vue')},
    {path: '/playground', name: 'playground', component: () => import('../pages/PlaygroundPage.vue')},
] as const satisfies readonly RouteRecordRaw[];

export const showcaseRouter = createRouter({history: createWebHistory(import.meta.env.BASE_URL), routes: [...routes]});
