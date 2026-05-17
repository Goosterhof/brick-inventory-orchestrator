import BrickDnaPage from '@app/domains/brick-dna/pages/BrickDnaPage.vue';
import CardContainer from '@shared/components/CardContainer.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import SectionDivider from '@shared/components/SectionDivider.vue';
import StatCard from '@shared/components/StatCard.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {
    createMockAxios,
    createMockFsHelpers,
    createMockStringTs,
    createMockFamilyServices,
    createMockFormField,
    createMockFormLabel,
    createMockFormError,
} = await vi.hoisted(() => import('../../../../../../helpers'));

const {mockGetRequest} = vi.hoisted(() => ({mockGetRequest: vi.fn<() => Promise<unknown>>()}));

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());

vi.mock('@shared/components/forms/FormError.vue', () => createMockFormError());
vi.mock('@shared/components/forms/FormField.vue', () => createMockFormField());
vi.mock('@shared/components/forms/FormLabel.vue', () => createMockFormLabel());

vi.mock('@shared/components/EmptyState.vue', () => ({
    default: {name: 'EmptyState', template: '<span><slot /></span>', props: ['message']},
}));

vi.mock('@shared/components/PageHeader.vue', () => ({
    default: {name: 'PageHeader', template: '<header><h1>{{ title }}</h1><slot /></header>', props: ['title']},
}));

vi.mock('@shared/components/StatCard.vue', () => ({
    default: {
        name: 'StatCard',
        template: '<div><span>{{ label }}</span><span>{{ value }}</span><slot /></div>',
        props: ['label', 'value'],
    },
}));

vi.mock('@shared/components/CardContainer.vue', () => ({
    default: {name: 'CardContainer', template: '<div><slot /></div>'},
}));

vi.mock('@shared/components/SectionDivider.vue', () => ({default: {name: 'SectionDivider', template: '<hr />'}}));

vi.mock('@app/services', () => createMockFamilyServices({familyHttpService: {getRequest: mockGetRequest}}));

const mockBrickDnaResponse = {
    topColors: [
        {colorId: 1, name: 'Red', rgb: 'CC0000', isTransparent: false, totalQuantity: 150},
        {colorId: 2, name: 'Blue', rgb: '0000CC', isTransparent: false, totalQuantity: 120},
        {colorId: 3, name: 'White', rgb: 'FFFFFF', isTransparent: false, totalQuantity: 80},
    ],
    topPartTypes: [
        {partId: 10, partNum: '3001', name: 'Brick 2x4', category: 'Bricks', totalQuantity: 200},
        {partId: 20, partNum: '3023', name: 'Plate 1x2', category: 'Plates', totalQuantity: 180},
    ],
    rarestParts: [
        {
            partId: 30,
            partNum: '3850',
            partName: 'Chrome Gold Sword',
            colorId: 4,
            colorName: 'Chrome Gold',
            colorRgb: 'BBA53D',
            quantity: 1,
        },
        {
            partId: 40,
            partNum: '3024',
            partName: 'Transparent Neon Green 1x1',
            colorId: 5,
            colorName: 'Trans-Neon Green',
            colorRgb: 'C0FF00',
            quantity: 2,
        },
    ],
    diversityScore: 0.75,
    totalUniqueParts: 150,
    totalPartsQuantity: 4200,
};

describe('BrickDnaPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render page header', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

        // Act
        const wrapper = shallowMount(BrickDnaPage);
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(PageHeader).props('title')).toBe('brickDna.title');
    });

    it('should fetch brick dna data on mount', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

        // Act
        shallowMount(BrickDnaPage);
        await flushPromises();

        // Assert
        expect(mockGetRequest).toHaveBeenCalledWith('/family/brick-dna');
    });

    it('should show loading state initially', () => {
        // Arrange
        mockGetRequest.mockReturnValue(new Promise(() => {}));

        // Act
        const wrapper = shallowMount(BrickDnaPage);

        // Assert
        expect(wrapper.text()).toContain('common.loading');
    });

    it('should show empty state when data is null after error', async () => {
        // Arrange
        mockGetRequest.mockRejectedValue(new Error('Network error'));

        // Act
        const wrapper = shallowMount(BrickDnaPage);
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(EmptyState).props('message')).toBe('brickDna.empty');
    });

    describe('diversity score', () => {
        it('should display the diversity percentage', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('75%');
        });

        it('should show high diversity label for score >= 0.8', async () => {
            // Arrange
            const highDiversityData = {...mockBrickDnaResponse, diversityScore: 0.85};
            mockGetRequest.mockResolvedValue({data: highDiversityData});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('brickDna.diversityHigh');
        });

        it('should show medium diversity label for score >= 0.5 and < 0.8', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('brickDna.diversityMedium');
        });

        it('should show low diversity label for score < 0.5', async () => {
            // Arrange
            const lowDiversityData = {...mockBrickDnaResponse, diversityScore: 0.3};
            mockGetRequest.mockResolvedValue({data: lowDiversityData});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('brickDna.diversityLow');
        });

        it('should render diversity bar with correct width', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            const bar = wrapper.find("[bg='baseplate-green']");
            expect(bar.attributes('style')).toContain('width: 75%');
        });

        it('should display diversity section heading', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('brickDna.diversityTitle');
        });
    });

    describe('top colors', () => {
        it('should display top colors as stat cards with totalQuantity', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            const statCards = wrapper.findAllComponents(StatCard);
            const redCard = statCards.find((c) => c.props('label') === 'Red');
            expect(redCard?.props('value')).toBe('150');

            const blueCard = statCards.find((c) => c.props('label') === 'Blue');
            expect(blueCard?.props('value')).toBe('120');

            const whiteCard = statCards.find((c) => c.props('label') === 'White');
            expect(whiteCard?.props('value')).toBe('80');
        });

        it('should render color swatches with correct rgb color', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            const swatches = wrapper.findAll("[rounded='full']");
            const redSwatch = swatches.find((s) => s.attributes('style')?.includes('#CC0000'));
            expect(redSwatch?.exists()).toBe(true);

            const blueSwatch = swatches.find((s) => s.attributes('style')?.includes('#0000CC'));
            expect(blueSwatch?.exists()).toBe(true);
        });

        it('should display top colors section heading', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('brickDna.topColorsTitle');
        });
    });

    describe('top part types', () => {
        it('should display top part types as stat cards', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            const statCards = wrapper.findAllComponents(StatCard);
            const brickCard = statCards.find((c) => c.props('label') === 'Brick 2x4');
            expect(brickCard?.props('value')).toBe('200');

            const plateCard = statCards.find((c) => c.props('label') === 'Plate 1x2');
            expect(plateCard?.props('value')).toBe('180');
        });

        it('should show category text for part types', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('Bricks');
            expect(wrapper.text()).toContain('Plates');
        });

        it('should display top part types section heading', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('brickDna.topPartTypesTitle');
        });
    });

    describe('rarest parts', () => {
        it('should display rarest parts with names', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('Chrome Gold Sword');
            expect(wrapper.text()).toContain('Transparent Neon Green 1x1');
        });

        it('should display rarest parts with color names', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('Chrome Gold');
            expect(wrapper.text()).toContain('Trans-Neon Green');
        });

        it('should display rarest parts with quantities', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('1x');
            expect(wrapper.text()).toContain('2x');
        });

        it('should render rarest parts in card containers', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            const cards = wrapper.findAllComponents(CardContainer);
            // 1 for diversity + 2 for rarest parts = 3
            expect(cards).toHaveLength(3);
        });

        it('should display rarest parts section heading', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('brickDna.rarestPartsTitle');
        });
    });

    describe('section dividers', () => {
        it('should render section dividers between sections', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockBrickDnaResponse});

            // Act
            const wrapper = shallowMount(BrickDnaPage);
            await flushPromises();

            // Assert
            expect(wrapper.findAllComponents(SectionDivider)).toHaveLength(3);
        });
    });
});
