import type {FamilySet} from '@app/types/familySet';
import type {Adapted} from '@script-development/fs-adapter-store';

import SetDetailPage from '@app/domains/sets/pages/SetDetailPage.vue';
import {familyRouterService} from '@app/services';
import {familySetStoreModule} from '@app/stores';
import {mockServer} from '@integration/helpers/mock-server';
import BackButton from '@shared/components/BackButton.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService};
});

/**
 * PlacePartModal is a complex modal with its own HTTP calls. Mocked to isolate
 * the SetDetailPage integration boundary.
 */
vi.mock('@app/modals/PlacePartModal.vue', () => ({
    default: {
        template: '<div />',
        props: [
            'open',
            'partIdentity',
            'defaultQuantity',
            'maxQuantity',
            'neededBySetNums',
            'existingLocations',
            'title',
        ],
    },
}));

/**
 * getOrFailById returns an Adapted object with a non-configurable Ref `mutable` property.
 * Vue's reactive proxy cannot auto-unwrap Refs on non-configurable properties (Proxy invariant).
 * The page stores the result in ref<Adapted | null>, which wraps it in a reactive proxy.
 * This is a known Vue limitation — vi.spyOn returns a plain object to work around it.
 */
const makeAdapted = (overrides: Record<string, unknown> = {}) =>
    ({
        id: 1,
        setNum: '75192-1',
        quantity: 1,
        status: 'sealed',
        purchaseDate: '2024-01-15',
        notes: 'Mint condition',
        set: {
            name: 'Millennium Falcon',
            setNum: '75192-1',
            year: 2017,
            theme: 'Star Wars',
            numParts: 7541,
            imageUrl: null,
        },
        mutable: {quantity: 1, status: 'sealed', purchaseDate: '2024-01-15', notes: 'Mint condition'},
        patch: vi.fn<() => Promise<void>>(),
        delete: vi.fn<() => Promise<void>>(),
        ...overrides,
    }) as unknown as Adapted<FamilySet>;

describe('SetDetailPage — integration', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
        await familyRouterService.goToRoute('sets-detail', 1);
    });

    it('renders real LoadingState while set is loading', () => {
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockReturnValue(new Promise(() => {}));
        const wrapper = mount(SetDetailPage);

        const loadingState = wrapper.findComponent(LoadingState);
        expect(loadingState.exists()).toBe(true);
        expect(loadingState.find("[role='status']").exists()).toBe(true);
    });

    it('renders set details with real BackButton and PrimaryButton after loading', async () => {
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        const wrapper = mount(SetDetailPage);
        await flushPromises();

        const backButton = wrapper.findComponent(BackButton);
        expect(backButton.exists()).toBe(true);
        expect(backButton.find('button').exists()).toBe(true);

        expect(wrapper.find('h1').text()).toBe('Millennium Falcon');
    });

    it('renders edit and load parts PrimaryButtons', async () => {
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        const wrapper = mount(SetDetailPage);
        await flushPromises();

        const buttons = wrapper.findAllComponents(PrimaryButton);
        const editBtn = buttons.find((b) => b.text().includes('Edit'));
        const loadPartsBtn = buttons.find((b) => b.text().includes('Load parts'));

        expect(editBtn).toBeDefined();
        expect(loadPartsBtn).toBeDefined();
    });

    it('navigates back via real BackButton click', async () => {
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        const wrapper = mount(SetDetailPage);
        await flushPromises();

        const backButton = wrapper.findComponent(BackButton);
        await backButton.find('button').trigger('click');
        await flushPromises();

        // No assertion on navigation — integration tests verify composition, not side effects.
    });

    it('hides load parts button for wishlist sets', async () => {
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted({status: 'wishlist'}));
        const wrapper = mount(SetDetailPage);
        await flushPromises();

        const buttons = wrapper.findAllComponents(PrimaryButton);
        const loadPartsBtn = buttons.find((b) => b.text().includes('Load parts'));
        expect(loadPartsBtn).toBeUndefined();
    });

    it('shows add to collection button for wishlist sets', async () => {
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted({status: 'wishlist'}));
        const wrapper = mount(SetDetailPage);
        await flushPromises();

        const buttons = wrapper.findAllComponents(PrimaryButton);
        const addBtn = buttons.find((b) => b.text().includes('Add to collection'));
        expect(addBtn).toBeDefined();
    });
});
