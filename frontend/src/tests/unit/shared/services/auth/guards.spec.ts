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
    });
});
