import type {RouteRecordRaw} from 'vue-router';

import {createRouterService} from '@script-development/fs-router';
import {registerFromQueryMiddleware} from '@shared/middleware/fromQuery';
import {flushPromises} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {defineComponent, h} from 'vue';

const HomeComponent = defineComponent({name: 'Home', render: () => h('div', 'Home')});
const AboutComponent = defineComponent({name: 'About', render: () => h('div', 'About')});
const IgnoreFromComponent = defineComponent({name: 'IgnoreFrom', render: () => h('div', 'IgnoreFrom')});

const createTestRoutes = (): RouteRecordRaw[] => [
    {path: '/', name: 'home', component: HomeComponent},
    {path: '/about', name: 'about', component: AboutComponent},
    {path: '/ignore-from', name: 'ignore-from', component: IgnoreFromComponent, meta: {ignoreFrom: true}},
];

describe('registerFromQueryMiddleware', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'location', {value: {pathname: '/', search: ''}, writable: true});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should redirect to the route specified in the from query param', async () => {
        // Arrange
        const routes = createTestRoutes();
        const service = createRouterService(routes);
        registerFromQueryMiddleware(service);
        await service.goToRoute('home', undefined, {from: 'about'});
        await flushPromises();

        // Act
        await service.goToRoute('home');
        await flushPromises();

        // Assert
        expect(service.currentRouteRef.value.name).toBe('about');
    });

    it('should skip redirect when ignoreFrom meta is set', async () => {
        // Arrange
        const routes = createTestRoutes();
        const service = createRouterService(routes);
        registerFromQueryMiddleware(service);
        await service.goToRoute('home', undefined, {from: 'about'});
        await flushPromises();

        // Act
        await service.goToRoute('ignore-from');
        await flushPromises();

        // Assert
        expect(service.currentRouteRef.value.name).toBe('ignore-from');
    });

    it('should skip redirect when from query matches destination', async () => {
        // Arrange
        const routes = createTestRoutes();
        const service = createRouterService(routes);
        registerFromQueryMiddleware(service);
        await service.goToRoute('home', undefined, {from: 'about'});
        await flushPromises();

        // Act
        await service.goToRoute('about');
        await flushPromises();

        // Assert
        expect(service.currentRouteRef.value.name).toBe('about');
    });

    it('should return an unregister function', () => {
        // Arrange
        const routes = createTestRoutes();
        const service = createRouterService(routes);

        // Act
        const unregister = registerFromQueryMiddleware(service);

        // Assert
        expect(unregister).toBeTypeOf('function');
    });
});
