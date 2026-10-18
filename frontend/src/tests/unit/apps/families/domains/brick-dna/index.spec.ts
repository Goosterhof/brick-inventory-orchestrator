import {routes} from '@app/domains/brick-dna';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@app/domains/brick-dna/pages/BrickDnaPage.vue', () => ({default: {name: 'BrickDnaPage'}}));

describe('brick-dna routes', () => {
    it('should declare the brick-dna route', () => {
        // Assert
        expect(routes).toHaveLength(1);
        expect(routes[0]).toMatchObject({
            path: '/brick-dna',
            name: 'brick-dna',
            meta: {authOnly: true, title: 'pageTitle.brickDna'},
        });
    });

    it('should lazy-load BrickDnaPage as the route component', async () => {
        // Act
        const page = await routes[0].component();

        // Assert
        expect(page.default).toStrictEqual({name: 'BrickDnaPage'});
    });
});
