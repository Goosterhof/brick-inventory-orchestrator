import HomePage from '@app/domains/home/pages/HomePage.vue';
import {familyAuthService, familyHttpService, familyRouterService} from '@app/services';
import {mockServer} from '@integration/helpers/mock-server';
import NavLink from '@shared/components/NavLink.vue';
import {registerAuthGuard} from '@shared/services/auth/guards';
import {registerAuthErrorMiddleware} from '@shared/services/auth/middleware';
import {flushPromises, mount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {guarded, mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService, guarded};
});

/**
 * Auth session resilience flows (BIO-0026 / BIO-0027).
 *
 * Replicates the production wiring from `apps/families/main.ts` — auth guard
 * plus 401 response-error middleware on the real services — and drives the
 * session lifecycle through the mock transport.
 */
describe('auth session resilience — integration', () => {
    let unregisterGuard: () => void;
    let unregisterAuthError: () => void;

    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
        unregisterGuard = registerAuthGuard(familyAuthService, familyRouterService, 'login', 'home');
        unregisterAuthError = registerAuthErrorMiddleware(
            familyAuthService,
            familyHttpService,
            familyRouterService,
            'login',
        );
    });

    afterEach(() => {
        unregisterGuard();
        unregisterAuthError();
        familyAuthService.clearUser();
    });

    const loginUser = async () => {
        mockServer.onPost('/login', {id: 1, name: 'Test', email: 'test@test.com'});
        await familyAuthService.login({email: 'test@test.com', password: 'secret'});
    };

    it('ends logged out at the login page when a mid-session 401 hits on an authOnly page', async () => {
        // A logged-in user sits on the authOnly sets page
        await loginUser();
        await familyRouterService.goToRoute('sets');
        await flushPromises();
        expect(familyRouterService.currentRouteRef.value.name).toBe('sets');

        // The Sanctum session expires server-side; the next API call 401s
        mockServer.onGetError('family-sets', 401, {message: 'Unauthenticated.'});
        await expect(familyHttpService.getRequest('family-sets')).rejects.toThrow(Error);
        await flushPromises();

        // The middleware clears the user state and lands the user on login
        expect(familyAuthService.isLoggedIn.value).toBe(false);
        expect(familyAuthService.user.value).toBeNull();
        // The login redirect lazy-imports the LoginPage chunk; wait for the
        // navigation to settle instead of racing the dynamic import.
        await vi.waitFor(() => expect(familyRouterService.currentRouteRef.value.name).toBe('login'));
    });

    it('leaves the boot /me probe undisturbed — a logged-out 401 neither clears nor redirects', async () => {
        await familyRouterService.goToRoute('home');
        await flushPromises();

        // Boot sequence: middleware is registered, then the /me probe 401s
        mockServer.onGetError('/me', 401, {message: 'Unauthenticated.'});
        await expect(familyAuthService.checkIfLoggedIn()).resolves.toBeUndefined();
        await flushPromises();

        expect(mockServer.callsTo('GET', '/me')).toHaveLength(1);
        expect(familyAuthService.isLoggedIn.value).toBe(false);
        expect(familyRouterService.currentRouteRef.value.name).toBe('home');
    });

    it('still boots into a public route when /me fails with a non-401 error', async () => {
        // The backend is unreachable at boot: /me answers 500
        mockServer.onGetError('/me', 500, {message: 'Server Error'});

        // The boot probe resolves as "not logged in" instead of rejecting —
        // main.ts's top-level await proceeds to mount the app
        await expect(familyAuthService.checkIfLoggedIn()).resolves.toBeUndefined();
        expect(mockServer.callsTo('GET', '/me')).toHaveLength(1);
        expect(familyAuthService.isLoggedIn.value).toBe(false);

        // The public landing page renders logged out
        await familyRouterService.goToRoute('home');
        const wrapper = mount(HomePage);
        await flushPromises();

        const navLink = wrapper.findComponent(NavLink);
        expect(navLink.exists()).toBe(true);
        expect(navLink.text()).toContain('Create Account');
    });
});
