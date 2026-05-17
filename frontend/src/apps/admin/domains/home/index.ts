import type {RouteRecordRaw} from 'vue-router';

import HomePage from './pages/HomePage.vue';

export const routes = [{path: '/', name: 'home', component: HomePage}] as const satisfies readonly RouteRecordRaw[];
