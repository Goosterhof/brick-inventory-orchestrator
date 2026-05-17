import type {RouteRecordRaw} from 'vue-router';

import {routes as aboutRoutes} from '@app/domains/about';
import {routes as authRoutes} from '@app/domains/auth';
import {routes as brickDnaRoutes} from '@app/domains/brick-dna';
import {routes as homeRoutes} from '@app/domains/home';
import {routes as partsRoutes} from '@app/domains/parts';
import {routes as setsRoutes} from '@app/domains/sets';
import {routes as settingsRoutes} from '@app/domains/settings';
import {routes as storageRoutes} from '@app/domains/storage';
import {createRouterService} from '@script-development/fs-router';

const routes = [
    ...homeRoutes,
    ...aboutRoutes,
    ...authRoutes,
    ...setsRoutes,
    ...storageRoutes,
    ...partsRoutes,
    ...brickDnaRoutes,
    ...settingsRoutes,
] as const satisfies readonly RouteRecordRaw[];

export type FamilyAppRoutes = typeof routes;

const routerService = createRouterService([...routes], {base: import.meta.env.BASE_URL});

export const familyRouterService = routerService;
export const FamilyRouterView = routerService.RouterView;
export const FamilyRouterLink = routerService.RouterLink;
