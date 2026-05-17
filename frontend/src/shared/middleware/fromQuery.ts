import type {RouterService, UnregisterMiddleware} from '@script-development/fs-router';
import type {RouteRecordRaw} from 'vue-router';

export const registerFromQueryMiddleware = <Routes extends RouteRecordRaw[]>(
    routerService: RouterService<Routes>,
): UnregisterMiddleware =>
    routerService.registerBeforeRouteMiddleware((to) => {
        if (to.meta?.ignoreFrom) return false;

        const fromQuery = routerService.currentRouteRef.value.query.from;
        if (fromQuery) {
            if (fromQuery.toString() === to.name) return false;
            void routerService.goToRoute(fromQuery.toString());
            return true;
        }

        return false;
    });
