import type {HttpService} from '@script-development/fs-http';
import type {RouteName, RouterService, UnregisterMiddleware} from '@script-development/fs-router';
import type {RouteRecordRaw} from 'vue-router';

import type {AuthService} from './types';

/**
 * Registers a response-error middleware that recovers from mid-session
 * authentication loss. When any API call fails with 401 while the local auth
 * state still says "logged in", the server-side session has expired: clear the
 * local user state and, when the user is sitting on an authOnly page, send
 * them to the login route.
 *
 * Guards:
 * - No-op while logged out — the boot-time `/me` probe (`checkIfLoggedIn`) and
 *   failed login attempts reject before any user state exists, and repeat 401s
 *   after the first recovery must not re-fire. This makes registration order
 *   at app boot a non-issue.
 * - Redirect only from authOnly routes — on public routes the chrome simply
 *   flips to logged-out in place; login/register stay undisturbed, so no
 *   redirect loops are possible.
 */
export const registerAuthErrorMiddleware = <Profile, Routes extends RouteRecordRaw[]>(
    authService: AuthService<Profile>,
    httpService: HttpService,
    routerService: RouterService<Routes>,
    loginRouteName: RouteName<Routes>,
): UnregisterMiddleware =>
    httpService.registerResponseErrorMiddleware((error) => {
        if (error.response?.status !== 401 || !authService.isLoggedIn.value) return;

        authService.clearUser();

        if (routerService.currentRouteRef.value.meta.authOnly) void routerService.goToRoute(loginRouteName);
    });
