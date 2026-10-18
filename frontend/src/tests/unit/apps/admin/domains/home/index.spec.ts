import {describe, expect, it, vi} from 'vitest';

import {routes} from '../../../../../../apps/admin/domains/home';

vi.mock('../../../../../../apps/admin/domains/home/pages/HomePage.vue', () => ({default: {name: 'HomePage'}}));

describe('admin home routes', () => {
    it('should serve HomePage at the root path', () => {
        // Assert
        expect(routes).toHaveLength(1);
        expect(routes[0]).toStrictEqual({path: '/', name: 'home', component: {name: 'HomePage'}});
    });
});
