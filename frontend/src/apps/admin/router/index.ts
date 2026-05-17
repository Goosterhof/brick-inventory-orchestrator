import type {RouteRecordRaw} from 'vue-router';

import {routes as homeRoutes} from '@app/domains/home';
import {createRouterService} from '@script-development/fs-router';

const routes = [...homeRoutes] as const satisfies readonly RouteRecordRaw[];

const routerService = createRouterService([...routes], {base: import.meta.env.BASE_URL});

export const adminRouterService = routerService;
export const AdminRouterView = routerService.RouterView;
