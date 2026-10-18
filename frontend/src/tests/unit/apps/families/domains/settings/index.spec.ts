import {routes} from '@app/domains/settings';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@app/domains/settings/pages/SettingsPage.vue', () => ({default: {name: 'SettingsPage'}}));

describe('settings routes', () => {
    it('should declare the settings route', () => {
        // Assert
        expect(routes).toHaveLength(1);
        expect(routes[0]).toMatchObject({
            path: '/settings',
            name: 'settings',
            meta: {authOnly: true, title: 'pageTitle.settings'},
        });
    });

    it('should lazy-load SettingsPage as the route component', async () => {
        // Act
        const page = await routes[0].component();

        // Assert
        expect(page.default).toStrictEqual({name: 'SettingsPage'});
    });
});
