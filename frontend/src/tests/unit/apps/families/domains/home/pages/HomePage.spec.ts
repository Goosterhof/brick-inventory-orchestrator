import YearDistributionChart from '@app/domains/home/components/YearDistributionChart.vue';
import HomePage from '@app/domains/home/pages/HomePage.vue';
import CardContainer from '@shared/components/CardContainer.vue';
import LegoBrick from '@shared/components/LegoBrick.vue';
import NavLink from '@shared/components/NavLink.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import StatCard from '@shared/components/StatCard.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {createMockAxios, createMockFsHelpers, createMockStringTs, createMockFamilyServices, createMockFamilyStores} =
    await vi.hoisted(() => import('../../../../../../helpers'));

const {mockGetRequest, mockGoToRoute, mockIsLoggedIn, mockRetrieveAll, mockGetAll} = vi.hoisted(() => ({
    mockGetRequest: vi.fn<() => Promise<unknown>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
    mockIsLoggedIn: {value: true},
    mockRetrieveAll: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    mockGetAll: {value: [] as {set?: {year?: number | null}}[]},
}));

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());
vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {getRequest: mockGetRequest},
        familyAuthService: {isLoggedIn: mockIsLoggedIn},
        familyRouterService: {goToRoute: mockGoToRoute},
    }),
);
vi.mock('@app/stores', () =>
    createMockFamilyStores({familySetStoreModule: {retrieveAll: mockRetrieveAll, getAll: mockGetAll}}),
);

const mockStatsResponse = {
    totalSets: 5,
    totalSetQuantity: 8,
    setsByStatus: {sealed: 2, built: 3},
    totalStorageLocations: 3,
    totalUniqueParts: 12,
    totalPartsQuantity: 150,
};

describe('HomePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsLoggedIn.value = true;
        mockGetAll.value = [];
    });

    describe('when logged out', () => {
        it('should show landing page', () => {
            // Arrange
            mockIsLoggedIn.value = false;

            // Act
            const wrapper = shallowMount(HomePage);

            // Assert
            expect(wrapper.text()).toContain('home.brandTitle');
            expect(wrapper.text()).toContain('home.tagline');
            expect(wrapper.findComponent(NavLink).exists()).toBe(true);
        });

        it('should render three LegoBricks in hero section', () => {
            // Arrange
            mockIsLoggedIn.value = false;

            // Act
            const wrapper = shallowMount(HomePage);

            // Assert
            const bricks = wrapper.findAllComponents(LegoBrick);
            expect(bricks).toHaveLength(3);
            expect(bricks.find((b) => b.props('color') === '#F5C518')).toBeTruthy();
            expect(bricks.find((b) => b.props('color') === '#C41A16')).toBeTruthy();
            expect(bricks.find((b) => b.props('color') === '#0055BF')).toBeTruthy();
        });

        it('should not fetch stats', () => {
            // Arrange
            mockIsLoggedIn.value = false;

            // Act
            shallowMount(HomePage);

            // Assert
            expect(mockGetRequest).not.toHaveBeenCalled();
        });
    });

    describe('when logged in', () => {
        it('should fetch stats on mount', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});

            // Act
            shallowMount(HomePage);
            await flushPromises();

            // Assert
            expect(mockGetRequest).toHaveBeenCalledWith('/family/stats');
        });

        it('should show loading state while fetching', () => {
            // Arrange
            mockGetRequest.mockReturnValue(new Promise(() => {}));

            // Act
            const wrapper = shallowMount(HomePage);

            // Assert
            expect(wrapper.text()).toContain('home.loadingStats');
        });

        it('should render dashboard title', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});

            // Act
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Assert
            expect(wrapper.findComponent(PageHeader).props('title')).toBe('home.dashboardTitle');
        });

        it('should render stat cards with correct values', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});

            // Act
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Assert
            const statCards = wrapper.findAllComponents(StatCard);
            expect(statCards.length).toBeGreaterThanOrEqual(3);
            expect(statCards[0]?.props('value')).toBe('5');
            expect(statCards[1]?.props('value')).toBe('3');
            expect(statCards[2]?.props('value')).toBe('12');
        });

        it('should show total quantity when different from total sets', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});

            // Act
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('home.totalIncludingDuplicates');
        });

        it('should not show total quantity when equal to total sets', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: {...mockStatsResponse, totalSets: 5, totalSetQuantity: 5}});

            // Act
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).not.toContain('home.totalIncludingDuplicates');
        });

        it('should render sets by status', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});

            // Act
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Assert
            const statusCards = wrapper.findAllComponents(StatCard).filter((c) => {
                const label = c.props('label');
                return label === 'sets.sealed' || label === 'sets.built';
            });
            expect(statusCards.length).toBe(2);
        });

        it('should render quick action links', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});

            // Act
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Assert
            const navLinks = wrapper.findAllComponents(NavLink);
            expect(navLinks.length).toBe(6);
            expect(wrapper.text()).toContain('navigation.sets');
            expect(wrapper.text()).toContain('navigation.storage');
            expect(wrapper.text()).toContain('navigation.parts');
            expect(wrapper.text()).toContain('home.actionScan');
            expect(wrapper.text()).toContain('home.actionIdentify');
            expect(wrapper.text()).toContain('home.actionImport');
        });

        it('should navigate to sets when quick action is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Act
            const navLinks = wrapper.findAllComponents(NavLink);
            const setsLink = navLinks.find((link) => link.text().includes('navigation.sets'));
            await setsLink?.trigger('click');
            await flushPromises();

            // Assert
            expect(mockGoToRoute).toHaveBeenCalledWith('sets');
        });

        it('should navigate to storage when quick action is clicked', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Act
            const navLinks = wrapper.findAllComponents(NavLink);
            const storageLink = navLinks.find((link) => link.text().includes('navigation.storage'));
            await storageLink?.trigger('click');
            await flushPromises();

            // Assert
            expect(mockGoToRoute).toHaveBeenCalledWith('storage');
        });

        it('should handle empty stats', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({
                data: {
                    totalSets: 0,
                    totalSetQuantity: 0,
                    setsByStatus: {},
                    totalStorageLocations: 0,
                    totalUniqueParts: 0,
                    totalPartsQuantity: 0,
                },
            });

            // Act
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).not.toContain('home.setsByStatus');
            expect(wrapper.text()).toContain('home.quickActions');
        });

        it('should fetch sets on mount', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});

            // Act
            shallowMount(HomePage);
            await flushPromises();

            // Assert
            expect(mockRetrieveAll).toHaveBeenCalled();
        });

        it('should not fetch sets when logged out', () => {
            // Arrange
            mockIsLoggedIn.value = false;

            // Act
            shallowMount(HomePage);

            // Assert
            expect(mockRetrieveAll).not.toHaveBeenCalled();
        });

        it('should render year distribution chart when sets have year data', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});
            mockGetAll.value = [{set: {year: 2020}}, {set: {year: 2020}}, {set: {year: 2015}}];

            // Act
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('home.yearDistribution');
            expect(wrapper.findComponent(YearDistributionChart).exists()).toBe(true);
            expect(wrapper.findComponent(CardContainer).exists()).toBe(true);
        });

        it('should pass correct distribution to chart', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});
            mockGetAll.value = [{set: {year: 2020}}, {set: {year: 2020}}, {set: {year: 2015}}];

            // Act
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Assert
            const chart = wrapper.findComponent(YearDistributionChart);
            const distribution = chart.props('distribution') as Map<number, number>;
            expect(distribution.get(2020)).toBe(2);
            expect(distribution.get(2015)).toBe(1);
        });

        it('should show empty message when no sets have year data', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});
            mockGetAll.value = [];

            // Act
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('home.yearDistributionEmpty');
            expect(wrapper.findComponent(YearDistributionChart).exists()).toBe(false);
        });

        it('should filter out sets with null year', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: mockStatsResponse});
            mockGetAll.value = [{set: {year: 2020}}, {set: {year: null}}, {set: {year: undefined}}, {set: undefined}];

            // Act
            const wrapper = shallowMount(HomePage);
            await flushPromises();

            // Assert
            const chart = wrapper.findComponent(YearDistributionChart);
            const distribution = chart.props('distribution') as Map<number, number>;
            expect(distribution.size).toBe(1);
            expect(distribution.get(2020)).toBe(1);
        });

        it('should not show year distribution while sets are loading', () => {
            // Arrange
            mockGetRequest.mockReturnValue(new Promise(() => {}));
            mockGetAll.value = [{set: {year: 2020}}];

            // Act
            const wrapper = shallowMount(HomePage);

            // Assert
            expect(wrapper.findComponent(YearDistributionChart).exists()).toBe(false);
            expect(wrapper.text()).not.toContain('home.yearDistribution');
        });
    });
});
