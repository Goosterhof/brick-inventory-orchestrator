import type {RouteRecordRaw} from 'vue-router';

import {createHttpService} from '@script-development/fs-http';
import {createRouterService} from '@script-development/fs-router';
import {registerAuthErrorMiddleware} from '@shared/services/auth/middleware';
import {flushPromises} from '@vue/test-utils';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {computed, defineComponent, h, ref} from 'vue';

const HomeComponent = defineComponent({name: 'Home', render: () => h('div', 'Home')});
const LoginComponent = defineComponent({name: 'Login', render: () => h('div', 'Login')});
const DashboardComponent = defineComponent({name: 'Dashboard', render: () => h('div', 'Dashboard')});

const createTestRoutes = (): RouteRecordRaw[] => [
    {path: '/', name: 'home', component: HomeComponent},
    {path: '/login', name: 'login', component: LoginComponent, meta: {canSeeWhenLoggedIn: false}},
    {path: '/dashboard', name: 'dashboard', component: DashboardComponent, meta: {authOnly: true}},
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
        clearUser: vi.fn<() => void>(() => {
            isLoggedInRef.value = false;
        }),
        checkIfLoggedIn: vi.fn<() => Promise<void>>(),
    };
};

describe('auth error middleware', () => {
    const baseURL = 'https://api.example.com';
    let mock: MockAdapter;

    beforeEach(() => {
        Object.defineProperty(window, 'location', {value: {pathname: '/', search: ''}, writable: true});
        mock = new MockAdapter(axios);
    });

    afterEach(() => {
        mock.restore();
        vi.restoreAllMocks();
    });

    describe('registerAuthErrorMiddleware', () => {
        it('should return an unregister function', () => {
            // Arrange
            const routerService = createRouterService(createTestRoutes());
            const authService = createMockAuthService(true);
            const httpService = createHttpService(baseURL);

            // Act
            const unregister = registerAuthErrorMiddleware(authService, httpService, routerService, 'login');

            // Assert
            expect(typeof unregister).toBe('function');
        });

        it('should clear user and redirect to login on 401 while logged in on an authOnly route', async () => {
            // Arrange
            const routerService = createRouterService(createTestRoutes());
            const authService = createMockAuthService(true);
            const httpService = createHttpService(baseURL);
            registerAuthErrorMiddleware(authService, httpService, routerService, 'login');
            await routerService.goToRoute('dashboard');
            mock.onGet(`${baseURL}/data`).reply(401);

            // Act
            await expect(httpService.getRequest('/data')).rejects.toThrow(Error);
            await flushPromises();

            // Assert
            expect(authService.clearUser).toHaveBeenCalledTimes(1);
            expect(routerService.currentRouteRef.value.name).toBe('login');
        });

        it('should clear user but stay put on 401 while logged in on a public route', async () => {
            // Arrange
            const routerService = createRouterService(createTestRoutes());
            const authService = createMockAuthService(true);
            const httpService = createHttpService(baseURL);
            registerAuthErrorMiddleware(authService, httpService, routerService, 'login');
            await routerService.goToRoute('home');
            mock.onGet(`${baseURL}/data`).reply(401);

            // Act
            await expect(httpService.getRequest('/data')).rejects.toThrow(Error);
            await flushPromises();

            // Assert — chrome flips to logged out, no forced navigation
            expect(authService.clearUser).toHaveBeenCalledTimes(1);
            expect(routerService.currentRouteRef.value.name).toBe('home');
        });

        it('should not act on 401 while already logged out (boot /me probe, failed login)', async () => {
            // Arrange
            const routerService = createRouterService(createTestRoutes());
            const authService = createMockAuthService(false);
            const httpService = createHttpService(baseURL);
            registerAuthErrorMiddleware(authService, httpService, routerService, 'login');
            await routerService.goToRoute('home');
            mock.onGet(`${baseURL}/me`).reply(401);

            // Act
            await expect(httpService.getRequest('/me')).rejects.toThrow(Error);
            await flushPromises();

            // Assert — the boot probe's 401 must not clear anything or redirect
            expect(authService.clearUser).not.toHaveBeenCalled();
            expect(routerService.currentRouteRef.value.name).toBe('home');
        });

        it('should not act on a non-401 error response', async () => {
            // Arrange
            const routerService = createRouterService(createTestRoutes());
            const authService = createMockAuthService(true);
            const httpService = createHttpService(baseURL);
            registerAuthErrorMiddleware(authService, httpService, routerService, 'login');
            await routerService.goToRoute('dashboard');
            mock.onGet(`${baseURL}/data`).reply(500);

            // Act
            await expect(httpService.getRequest('/data')).rejects.toThrow(Error);
            await flushPromises();

            // Assert
            expect(authService.clearUser).not.toHaveBeenCalled();
            expect(routerService.currentRouteRef.value.name).toBe('dashboard');
        });

        it('should not act on an error without a response (network failure)', async () => {
            // Arrange
            const routerService = createRouterService(createTestRoutes());
            const authService = createMockAuthService(true);
            const httpService = createHttpService(baseURL);
            registerAuthErrorMiddleware(authService, httpService, routerService, 'login');
            await routerService.goToRoute('dashboard');
            mock.onGet(`${baseURL}/data`).networkError();

            // Act
            await expect(httpService.getRequest('/data')).rejects.toThrow(Error);
            await flushPromises();

            // Assert
            expect(authService.clearUser).not.toHaveBeenCalled();
            expect(routerService.currentRouteRef.value.name).toBe('dashboard');
        });

        it('should not act again on a repeat 401 after the first recovery', async () => {
            // Arrange
            const routerService = createRouterService(createTestRoutes());
            const authService = createMockAuthService(true);
            const httpService = createHttpService(baseURL);
            registerAuthErrorMiddleware(authService, httpService, routerService, 'login');
            await routerService.goToRoute('dashboard');
            mock.onGet(`${baseURL}/data`).reply(401);

            // Act — two parallel-ish 401s; clearUser flips isLoggedIn to false
            await expect(httpService.getRequest('/data')).rejects.toThrow(Error);
            await expect(httpService.getRequest('/data')).rejects.toThrow(Error);
            await flushPromises();

            // Assert — only the first 401 triggers the recovery
            expect(authService.clearUser).toHaveBeenCalledTimes(1);
            expect(routerService.currentRouteRef.value.name).toBe('login');
        });

        it('should not act after unregistering', async () => {
            // Arrange
            const routerService = createRouterService(createTestRoutes());
            const authService = createMockAuthService(true);
            const httpService = createHttpService(baseURL);
            const unregister = registerAuthErrorMiddleware(authService, httpService, routerService, 'login');
            await routerService.goToRoute('dashboard');
            mock.onGet(`${baseURL}/data`).reply(401);

            // Act
            unregister();
            await expect(httpService.getRequest('/data')).rejects.toThrow(Error);
            await flushPromises();

            // Assert
            expect(authService.clearUser).not.toHaveBeenCalled();
            expect(routerService.currentRouteRef.value.name).toBe('dashboard');
        });
    });
});
