import BrickDnaPage from '@app/domains/brick-dna/pages/BrickDnaPage.vue';
import {mockServer} from '@integration/helpers/mock-server';
import CardContainer from '@shared/components/CardContainer.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import SectionDivider from '@shared/components/SectionDivider.vue';
import StatCard from '@shared/components/StatCard.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService};
});

/**
 * Snake_case fixtures — matching real API response format.
 * toCamelCaseTyped() converts these to camelCase before they reach the component.
 */
const mockDna = {
    diversity_score: 0.85,
    total_unique_parts: 150,
    total_parts_quantity: 4200,
    top_colors: [
        {color_id: 1, name: 'Red', rgb: 'FF0000', is_transparent: false, total_quantity: 120},
        {color_id: 2, name: 'Blue', rgb: '0000FF', is_transparent: false, total_quantity: 95},
    ],
    top_part_types: [{part_id: 10, part_num: '3001', name: 'Brick 2x4', category: 'Bricks', total_quantity: 200}],
    rarest_parts: [
        {
            part_id: 30,
            part_num: '3850',
            part_name: 'Chrome Gold Helmet',
            color_id: 4,
            color_name: 'Chrome Gold',
            color_rgb: 'BBA53D',
            quantity: 1,
        },
    ],
};

describe('BrickDnaPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    it('renders real PageHeader with title', async () => {
        mockServer.onGet('/family/brick-dna', mockDna);
        const wrapper = mount(BrickDnaPage);
        await flushPromises();

        const pageHeader = wrapper.findComponent(PageHeader);
        expect(pageHeader.exists()).toBe(true);
        expect(pageHeader.find('h1').text()).toBe('Brick DNA');
    });

    it('renders real EmptyState when API returns no data', async () => {
        // No route registered — the getRequest will reject, triggering the catch branch
        const wrapper = mount(BrickDnaPage);
        await flushPromises();

        const emptyState = wrapper.findComponent(EmptyState);
        expect(emptyState.exists()).toBe(true);
        expect(emptyState.text()).toContain('No collection data available yet');
    });

    it('renders real StatCards for top colors', async () => {
        mockServer.onGet('/family/brick-dna', mockDna);
        const wrapper = mount(BrickDnaPage);
        await flushPromises();

        const statCards = wrapper.findAllComponents(StatCard);
        const labels = statCards.map((c) => c.props('label'));
        expect(labels).toContain('Red');
        expect(labels).toContain('Blue');
    });

    it('renders real CardContainers for rarest parts', async () => {
        mockServer.onGet('/family/brick-dna', mockDna);
        const wrapper = mount(BrickDnaPage);
        await flushPromises();

        const cards = wrapper.findAllComponents(CardContainer);
        expect(cards.length).toBeGreaterThanOrEqual(1);
        expect(wrapper.text()).toContain('Chrome Gold Helmet');
    });

    it('renders real SectionDividers between sections', async () => {
        mockServer.onGet('/family/brick-dna', mockDna);
        const wrapper = mount(BrickDnaPage);
        await flushPromises();

        const dividers = wrapper.findAllComponents(SectionDivider);
        expect(dividers).toHaveLength(3);
    });

    it('displays diversity percentage from real component hierarchy', async () => {
        mockServer.onGet('/family/brick-dna', mockDna);
        const wrapper = mount(BrickDnaPage);
        await flushPromises();

        expect(wrapper.text()).toContain('85%');
        expect(wrapper.text()).toContain('Highly Diverse');
    });
});
