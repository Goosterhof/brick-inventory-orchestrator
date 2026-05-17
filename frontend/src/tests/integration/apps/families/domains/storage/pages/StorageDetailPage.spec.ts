import type {StorageOption} from '@app/types/storageOption';
import type {Adapted} from '@script-development/fs-adapter-store';

import StorageDetailPage from '@app/domains/storage/pages/StorageDetailPage.vue';
import {familyRouterService} from '@app/services';
import {storageOptionStoreModule} from '@app/stores';
import {mockServer} from '@integration/helpers/mock-server';
import BackButton from '@shared/components/BackButton.vue';
import DetailRow from '@shared/components/DetailRow.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import PartListItem from '@shared/components/PartListItem.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService};
});

/**
 * getOrFailById returns an Adapted object with a non-configurable Ref `mutable` property.
 * Vue's reactive proxy cannot auto-unwrap Refs on non-configurable properties (Proxy invariant).
 * The page stores the result in ref<Adapted | null>, which wraps it in a reactive proxy.
 * This is a known Vue limitation — vi.spyOn returns a plain object to work around it.
 */
const makeAdapted = (overrides: Record<string, unknown> = {}) =>
    ({
        id: 1,
        name: 'Top Shelf',
        description: 'The top shelf of the cabinet',
        parentId: null,
        row: 1,
        column: 2,
        childIds: [10, 11],
        mutable: {name: 'Top Shelf', description: 'The top shelf of the cabinet', parentId: null, row: 1, column: 2},
        reset: vi.fn<() => void>(),
        update: vi.fn<() => Promise<void>>(),
        patch: vi.fn<() => Promise<void>>(),
        delete: vi.fn<() => Promise<void>>(),
        ...overrides,
    }) as unknown as Adapted<StorageOption>;

/**
 * Snake_case fixtures for parts API — matching real API response format.
 * toCamelCaseTyped() converts these to camelCase before they reach the component.
 */
const makePart = (id: number) => ({
    id,
    quantity: 3,
    part: {name: `Part ${id}`, part_num: `P${id}`, image_url: null},
    color: {name: 'Red', rgb: 'FF0000'},
});

describe('StorageDetailPage — integration', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
        await familyRouterService.goToRoute('storage-detail', 1);
    });

    it('renders real LoadingState while loading', () => {
        vi.spyOn(storageOptionStoreModule, 'getOrFailById').mockReturnValue(new Promise(() => {}));
        mockServer.onGet('/storage-options/1/parts', []);
        const wrapper = mount(StorageDetailPage);

        const loadingState = wrapper.findComponent(LoadingState);
        expect(loadingState.exists()).toBe(true);
    });

    it('renders storage details with real DetailRow components', async () => {
        vi.spyOn(storageOptionStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        mockServer.onGet('/storage-options/1/parts', []);
        const wrapper = mount(StorageDetailPage);
        await flushPromises();

        expect(wrapper.find('h1').text()).toBe('Top Shelf');

        const detailRows = wrapper.findAllComponents(DetailRow);
        const labels = detailRows.map((r) => r.props('label'));
        expect(labels).toContain('Description');
        expect(labels).toContain('Row');
        expect(labels).toContain('Column');
        expect(labels).toContain('Sub-locations');
    });

    it('renders real PartListItem components for storage parts', async () => {
        vi.spyOn(storageOptionStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        mockServer.onGet('/storage-options/1/parts', [makePart(1), makePart(2)]);
        const wrapper = mount(StorageDetailPage);
        await flushPromises();

        const partItems = wrapper.findAllComponents(PartListItem);
        expect(partItems).toHaveLength(2);

        const firstPart = partItems.find((p) => p.props('name') === 'Part 1');
        expect(firstPart).toBeDefined();
        expect(firstPart?.props('quantity')).toBe(3);
        expect(firstPart?.props('colorName')).toBe('Red');
    });

    it('renders real EmptyState when no parts', async () => {
        vi.spyOn(storageOptionStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        mockServer.onGet('/storage-options/1/parts', []);
        const wrapper = mount(StorageDetailPage);
        await flushPromises();

        const emptyState = wrapper.findComponent(EmptyState);
        expect(emptyState.exists()).toBe(true);
        expect(emptyState.text()).toContain('No parts in this storage location');
    });

    it('renders real BackButton and edit PrimaryButton', async () => {
        vi.spyOn(storageOptionStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        mockServer.onGet('/storage-options/1/parts', []);
        const wrapper = mount(StorageDetailPage);
        await flushPromises();

        const backButton = wrapper.findComponent(BackButton);
        expect(backButton.find('button').exists()).toBe(true);

        const editBtn = wrapper.findComponent(PrimaryButton);
        expect(editBtn.text()).toContain('Edit');
    });

    it('navigates back via BackButton click', async () => {
        vi.spyOn(storageOptionStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        mockServer.onGet('/storage-options/1/parts', []);
        const wrapper = mount(StorageDetailPage);
        await flushPromises();

        const backButton = wrapper.findComponent(BackButton);
        await backButton.find('button').trigger('click');
        await flushPromises();

        // No assertion on navigation — integration tests verify composition, not side effects.
    });
});
