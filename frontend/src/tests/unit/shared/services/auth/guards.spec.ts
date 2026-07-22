import type {RouteRecordRaw} from 'vue-router';

import {createRouterService} from '@script-development/fs-router';
import {registerAuthGuard} from '@shared/services/auth/guards';
import {flushPromises} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {computed, defineComponent, h, ref} from 'vue';

const HomeComponent = defineComponent({name: 'Home', render: () => h('div', 'Home')});
const LoginComponent = defineComponent({name: 'Login', render: () => h('div', 'Login')});
const DashboardComponent = defineComponent({name: 'Dashboard', render: () => h('div', 'Dashboard')});
const ProtectedComponent = defineComponent({name: 'Protected', render: () => h('div', 'Protected')});

const createTestRoutes = (): RouteRecordRaw[] => [
    {path: '/', name: 'home', component: HomeComponent},
    {path: '/login', name: 'login', component: LoginComponent, meta: {canSeeWhenLoggedIn: false}},
    {path: '/dashboard', name: 'dashboard', component: DashboardComponent, meta: {authOnly: true}},
    {path: '/protected', name: 'protected', component: ProtectedComponent, meta: {authOnly: true}},
];

const createMockAuthService = (isLoggedInValue: boolean) => {
    const isLoggedInRef = ref(isLoggedInValue);

    return {
        isLoggedIn: computed(() => isLoggedInRef.value),
        user: computed(() => (isLoggedInRef.value ? {id: 1} : null)),
        userId: vi.fn<() => number>(),
        register: vi.fn<() => Promise<void>>(),
        login: vi.fn<() => Promise<void>>(),
        logout: vi.fn<() => Promise<void>>(),
        clearUser: vi.fn<() => void>(),
        checkIfLoggedIn: vi.fn<() => Promise<void>>(),
        _setLoggedIn: (value: boolean) => {
            isLoggedInRef.value = value;
        },
    };
};

describe('auth guards', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'location', {value: {pathname: '/', search: ''}, writable: true});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('registerAuthGuard', () => {
        it('should return an unregister function', () => {
            // Arrange
            const routes = createTestRoutes();
            const routerService = createRouterService(routes);
            const authService = createMockAuthService(false);

            // Act
            const unregister = registerAuthGuard(authService, routerService, 'login', 'home');

            // Assert
            expect(typeof unregister).toBe('function');
        });

        it('should redirect to login when accessing authOnly route while not logged in', async () => {
            // Arrange
            const routes = createTestRoutes();
            const routerService = createRouterService(routes);
            const authService = createMockAuthService(false);
            registerAuthGuard(authService, routerService, 'login', 'home');

            // Act
            await routerService.goToRoute('dashboard');
            await flushPromises();

            // Assert
            expect(routerService.currentRouteRef.value.name).toBe('login');
        });

        it('should allow access to authOnly route when logged in', async () => {
            // Arrange
            const routes = createTestRoutes();
            const routerService = createRouterService(routes);
            const authService = createMockAuthService(true);
            registerAuthGuard(authService, routerService, 'login', 'home');

            // Act
            await routerService.goToRoute('dashboard');
            await flushPromises();

            // Assert
            expect(routerService.currentRouteRef.value.name).toBe('dashboard');
        });

        it('should redirect to dashboard when accessing canSeeWhenLoggedIn=false route while logged in', async () => {
            // Arrange
            const routes = createTestRoutes();
            const routerService = createRouterService(routes);
            const authService = createMockAuthService(true);
            registerAuthGuard(authService, routerService, 'login', 'dashboard');

            // Act
            await routerService.goToRoute('login');
            await flushPromises();

            // Assert
            expect(routerService.currentRouteRef.value.name).toBe('dashboard');
        });

        it('should allow access to canSeeWhenLoggedIn=false route when not logged in', async () => {
            // Arrange
            const routes = createTestRoutes();
            const routerService = createRouterService(routes);
            const authService = createMockAuthService(false);
            registerAuthGuard(authService, routerService, 'login', 'home');

            // Act
            await routerService.goToRoute('login');
            await flushPromises();

            // Assert
            expect(routerService.currentRouteRef.value.name).toBe('login');
        });

        it('should use the provided dashboard route name for redirect', async () => {
            // Arrange
            const routes = createTestRoutes();
            const routerService = createRouterService(routes);
            const authService = createMockAuthService(true);
            registerAuthGuard(authService, routerService, 'login', 'home');

            // Act
            await routerService.goToRoute('login');
            await flushPromises();

            // Assert
            expect(routerService.currentRouteRef.value.name).toBe('home');
        });

        it('should allow access to routes without meta when not logged in', async () => {
            // Arrange
            const routes = createTestRoutes();
            const routerService = createRouterService(routes);
            const authService = createMockAuthService(false);
            registerAuthGuard(authService, routerService, 'login', 'home');

            // Act
            await routerService.goToRoute('home');
            await flushPromises();

            // Assert
            expect(routerService.currentRouteRef.value.name).toBe('home');
        });

        it('should allow access to routes without meta when logged in', async () => {
            // Arrange
            const routes = createTestRoutes();
            const routerService = createRouterService(routes);
            const authService = createMockAuthService(true);
            registerAuthGuard(authService, routerService, 'login', 'home');

            // Act
            await routerService.goToRoute('home');
            await flushPromises();

            // Assert
            expect(routerService.currentRouteRef.value.name).toBe('home');
        });

        it('should not execute guard after unregistering', async () => {
            // Arrange
            const routes = createTestRoutes();
            const routerService = createRouterService(routes);
            const authService = createMockAuthService(false);
            const unregister = registerAuthGuard(authService, routerService, 'login', 'home');

            // Act
            unregister();
            await routerService.goToRoute('dashboard');
            await flushPromises();

            // Assert
            expect(routerService.currentRouteRef.value.name).toBe('dashboard');
        });

        it('cancels the original navigation (short-circuits later middleware) when redirecting an unauthorised authOnly visit', async () => {
            // Arrange
            const routes = createTestRoutes();
            const routerService = createRouterService(routes);
            const authService = createMockAuthService(false);
            registerAuthGuard(authService, routerService, 'login', 'home');
            // A follow-on middleware only runs for navigations the auth guard lets through:
            // returning a redirect object from the guard cancels the hop and short-circuits the
            // chain (0.2.0 middleware redirect-return; the bounce itself is dispatched by fs-router).
            const observed: string[] = [];
            routerService.registerBeforeRouteMiddleware((to) => {
                observed.push(String(to.name));
                return false;
            });

            // Act
            await routerService.goToRoute('dashboard');
            await flushPromises();

            // Assert — the blocked 'dashboard' hop must never reach the follow-on middleware
            // (a `return false` mutant on the redirect would let it through).
            expect(observed).not.toContain('dashboard');
            expect(routerService.currentRouteRef.value.name).toBe('login');
        });

        it('cancels the original navigation when redirecting a logged-in visit away from a guest-only route', async () => {
            // Arrange
            const routes = createTestRoutes();
            const routerService = createRouterService(routes);
            const authService = createMockAuthService(true);
            registerAuthGuard(authService, routerService, 'login', 'dashboard');
            const observed: string[] = [];
            routerService.registerBeforeRouteMiddleware((to) => {
                observed.push(String(to.name));
                return false;
            });

            // Act
            await routerService.goToRoute('login');
            await flushPromises();

            // Assert — the blocked 'login' hop must never reach the follow-on middleware.
            expect(observed).not.toContain('login');
            expect(routerService.currentRouteRef.value.name).toBe('dashboard');
        });
    });
});
