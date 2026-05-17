import PartUsageModal from '@app/domains/parts/modals/PartUsageModal.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import ListItemButton from '@shared/components/ListItemButton.vue';
import ModalDialog from '@shared/components/ModalDialog.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {createMockAxios, createMockFsHelpers, createMockStringTs, createMockFamilyServices} = await vi.hoisted(
    () => import('../../../../../../helpers'),
);

const {mockGetRequest, mockGoToRoute} = vi.hoisted(() => ({
    mockGetRequest: vi.fn<() => Promise<unknown>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
}));

vi.mock('@phosphor-icons/vue', () => ({PhX: {template: '<i />'}}));
vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());

vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {getRequest: mockGetRequest},
        familyAuthService: {isLoggedIn: {value: true}},
        familyRouterService: {goToRoute: mockGoToRoute},
    }),
);

const mockUsageResponse = {
    partNum: '3001',
    partName: 'Brick 2 x 4',
    partImageUrl: 'https://example.com/3001.jpg',
    colorId: 1,
    colorName: 'Red',
    colorHex: 'CC0000',
    usages: [
        {
            familySetId: 42,
            setNum: '10024-1',
            setName: 'Red Baron',
            status: 'sealed' as const,
            quantityNeeded: 4,
            quantityStored: 1,
            shortfall: 3,
        },
        {
            familySetId: 99,
            setNum: '8043-1',
            setName: 'Motorized Excavator',
            status: 'wishlist' as const,
            quantityNeeded: 2,
            quantityStored: 2,
            shortfall: 0,
        },
    ],
};

const mountModal = (open = true, partNum = '3001', colorId = 1) =>
    shallowMount(PartUsageModal, {props: {open, partNum, colorId}});

describe('PartUsageModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not fetch when closed', async () => {
        // Arrange & Act
        mountModal(false);
        await flushPromises();

        // Assert
        expect(mockGetRequest).not.toHaveBeenCalled();
    });

    it('fetches usage data when opened with the documented endpoint shape', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: mockUsageResponse});

        // Act
        mountModal();
        await flushPromises();

        // Assert
        expect(mockGetRequest).toHaveBeenCalledWith('/family/parts/3001/1/usage');
    });

    it('shows loading state while fetching', () => {
        // Arrange
        mockGetRequest.mockReturnValue(new Promise(() => {}));

        // Act
        const wrapper = mountModal();

        // Assert
        expect(wrapper.find("[data-testid='usage-loading']").exists()).toBe(true);
    });

    it('renders part header with name, image, and color when populated', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: mockUsageResponse});

        // Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert
        const header = wrapper.find("[data-testid='usage-part-header']");
        expect(header.exists()).toBe(true);
        expect(header.text()).toContain('Brick 2 x 4');
        expect(header.text()).toContain('3001');
        expect(header.text()).toContain('Red');
    });

    it('falls back to part number when partName is null', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({
            data: {...mockUsageResponse, partName: null, colorName: null, colorHex: null, partImageUrl: null},
        });

        // Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert
        const header = wrapper.find("[data-testid='usage-part-header']");
        expect(header.text()).toContain('3001');
    });

    it('renders one ListItemButton per usage entry with set details and status badge', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: mockUsageResponse});

        // Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert
        const items = wrapper.findAllComponents(ListItemButton);
        expect(items).toHaveLength(2);

        const firstText = items[0]?.text() ?? '';
        expect(firstText).toContain('Red Baron');
        expect(firstText).toContain('10024-1');
        expect(firstText).toContain('sets.sealed');
        // The translation mock returns keys verbatim; assert the mocked label appears for each metric
        expect(firstText).toContain('parts.usageNeeded');
        expect(firstText).toContain('parts.usageStored');
        expect(firstText).toContain('parts.usageShortfall');

        const secondText = items[1]?.text() ?? '';
        expect(secondText).toContain('Motorized Excavator');
        expect(secondText).toContain('sets.wishlist');
        // shortfall is 0 → shortfall pill is not rendered
        expect(secondText).not.toContain('parts.usageShortfall');
    });

    it('navigates to the set detail page when a usage row is clicked', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: mockUsageResponse});
        const wrapper = mountModal();
        await flushPromises();

        // Act
        const items = wrapper.findAllComponents(ListItemButton);
        items[0]?.vm.$emit('click');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('sets-detail', 42);
        expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('shows the empty state when usages is empty', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: {...mockUsageResponse, usages: []}});

        // Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert
        const empty = wrapper.findComponent(EmptyState);
        expect(empty.exists()).toBe(true);
        expect(empty.props('message')).toBe('parts.usageEmpty');
    });

    it('shows error state with retry when fetch fails, and retry refetches', async () => {
        // Arrange
        mockGetRequest.mockRejectedValueOnce(new Error('boom'));
        const wrapper = mountModal();
        await flushPromises();

        // Assert — error state visible
        const errorBox = wrapper.find("[data-testid='usage-error']");
        expect(errorBox.exists()).toBe(true);
        expect(errorBox.text()).toContain('parts.usageLoadError');

        // Act — retry succeeds
        mockGetRequest.mockResolvedValueOnce({data: mockUsageResponse});
        await wrapper.find("[data-testid='usage-retry']").trigger('click');
        await flushPromises();

        // Assert — moved to populated state
        expect(wrapper.find("[data-testid='usage-error']").exists()).toBe(false);
        expect(wrapper.findAllComponents(ListItemButton)).toHaveLength(2);
        expect(mockGetRequest).toHaveBeenCalledTimes(2);
    });

    it('emits close when ModalDialog emits close', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue({data: mockUsageResponse});
        const wrapper = mountModal();
        await flushPromises();

        // Act
        wrapper.findComponent(ModalDialog).vm.$emit('close');

        // Assert
        expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('clears stale data when reopening with a different part to avoid flicker', async () => {
        // Arrange — first open populated
        mockGetRequest.mockResolvedValueOnce({data: mockUsageResponse});
        const wrapper = mountModal(true, '3001', 1);
        await flushPromises();
        expect(wrapper.findAllComponents(ListItemButton)).toHaveLength(2);

        // Act — second fetch hangs while we change props
        mockGetRequest.mockReturnValueOnce(new Promise(() => {}));
        await wrapper.setProps({partNum: '3002', colorId: 5});

        // Assert — list cleared while reloading; loading visible
        expect(wrapper.findAllComponents(ListItemButton)).toHaveLength(0);
        expect(wrapper.find("[data-testid='usage-loading']").exists()).toBe(true);
    });
});
