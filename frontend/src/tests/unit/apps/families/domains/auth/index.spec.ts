import {routes} from '@app/domains/auth';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@app/domains/auth/pages/LoginPage.vue', () => ({default: {name: 'LoginPage'}}));

describe('auth routes', () => {
    it('should declare the login route', () => {
        // Assert
        expect(routes).toHaveLength(1);
        expect(routes[0]).toMatchObject({
            path: '/login',
            name: 'login',
            meta: {canSeeWhenLoggedIn: false, title: 'pageTitle.logIn'},
        });
    });

    it('should lazy-load LoginPage as the route component', async () => {
        // Act
        const page = await routes[0].component();

        // Assert
        expect(page.default).toStrictEqual({name: 'LoginPage'});
    });
});
