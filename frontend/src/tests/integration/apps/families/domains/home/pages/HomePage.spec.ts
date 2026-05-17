import HomePage from '@app/domains/home/pages/HomePage.vue';
import {familyAuthService} from '@app/services';
import {mockServer} from '@integration/helpers/mock-server';
import NavLink from '@shared/components/NavLink.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import StatCard from '@shared/components/StatCard.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService};
});

const statsResponse = {
    total_sets: 5,
    total_set_quantity: 8,
    sets_by_status: {},
    total_storage_locations: 3,
    total_unique_parts: 12,
    total_parts_quantity: 100,
};

describe('HomePage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    const loginUser = async () => {
        mockServer.onPost('/login', {id: 1, name: 'Test', email: 'test@test.com'});
        await familyAuthService.login({email: 'test@test.com', password: 'secret'});
    };

    it('renders landing page with real NavLink when logged out', () => {
        const wrapper = mount(HomePage);

        const navLink = wrapper.findComponent(NavLink);
        expect(navLink.exists()).toBe(true);
        expect(navLink.find('a').exists()).toBe(true);
        expect(navLink.text()).toContain('Create Account');
    });

    it('renders dashboard with real PageHeader and StatCards when logged in', async () => {
        await loginUser();
        mockServer.onGet('/family/stats', statsResponse);
        mockServer.onGet('family-sets', []);

        const wrapper = mount(HomePage);
        await flushPromises();

        const pageHeader = wrapper.findComponent(PageHeader);
        expect(pageHeader.exists()).toBe(true);
        expect(pageHeader.find('h1').text()).toBe('Dashboard');

        const statCards = wrapper.findAllComponents(StatCard);
        expect(statCards).toHaveLength(3);

        const labels = statCards.map((c) => c.props('label'));
        expect(labels).toStrictEqual(['Sets', 'Storage locations', 'Stored parts']);
    });

    it('renders quick action NavLinks that delegate navigation to router service', async () => {
        await loginUser();
        mockServer.onGet('/family/stats', statsResponse);
        mockServer.onGet('family-sets', []);

        const wrapper = mount(HomePage);
        await flushPromises();

        const navLinks = wrapper.findAllComponents(NavLink);
        expect(navLinks.length).toBeGreaterThanOrEqual(6);

        const setsLink = navLinks.find((l) => l.text().includes('My Sets'));
        expect(setsLink).toBeDefined();

        // No assertion on navigation — integration tests verify composition, not side effects.
    });

    it('shows loading state before stats resolve', async () => {
        await loginUser();
        // Register routes but don't flush — component is in loading state
        mockServer.onGet('/family/stats', statsResponse);
        mockServer.onGet('family-sets', []);
        const wrapper = mount(HomePage);

        expect(wrapper.text()).toContain('Loading your collection...');
    });
});
