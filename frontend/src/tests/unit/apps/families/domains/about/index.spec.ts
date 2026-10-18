import {routes} from '@app/domains/about';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@app/domains/about/pages/AboutPage.vue', () => ({default: {name: 'AboutPage'}}));

describe('about routes', () => {
    it('should declare the about route', () => {
        // Assert
        expect(routes).toHaveLength(1);
        expect(routes[0]).toMatchObject({path: '/about', name: 'about', meta: {title: 'pageTitle.about'}});
    });

    it('should lazy-load AboutPage as the route component', async () => {
        // Act
        const page = await routes[0].component();

        // Assert
        expect(page.default).toStrictEqual({name: 'AboutPage'});
    });
});
