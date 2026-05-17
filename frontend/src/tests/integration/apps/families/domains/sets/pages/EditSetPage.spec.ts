import type {FamilySet} from '@app/types/familySet';
import type {Adapted} from '@script-development/fs-adapter-store';

import EditSetPage from '@app/domains/sets/pages/EditSetPage.vue';
import {familyRouterService} from '@app/services';
import {familySetStoreModule} from '@app/stores';
import {mockServer} from '@integration/helpers/mock-server';
import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import DangerButton from '@shared/components/DangerButton.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import SelectInput from '@shared/components/forms/inputs/SelectInput.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService};
});

const mockPatch = vi.fn<() => Promise<void>>();
const mockDelete = vi.fn<() => Promise<void>>();

/**
 * getOrFailById returns an Adapted object with a non-configurable Ref `mutable` property.
 * Vue's reactive proxy cannot auto-unwrap Refs on non-configurable properties (Proxy invariant).
 * The page stores the result in ref<Adapted | null>, which wraps it in a reactive proxy.
 * This is a known Vue limitation — the spy returns a plain object to work around it.
 */
const makeAdapted = () =>
    ({
        id: 1,
        setNum: '75192-1',
        status: 'sealed',
        set: {name: 'Millennium Falcon', setNum: '75192-1'},
        mutable: {quantity: 1, status: 'sealed', purchaseDate: null, notes: ''},
        patch: mockPatch,
        delete: mockDelete,
    }) as unknown as Adapted<FamilySet>;

describe('EditSetPage — integration', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
        await familyRouterService.goToRoute('sets-edit', 1);
    });

    it('renders real LoadingState while loading', () => {
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockReturnValue(new Promise(() => {}));
        const wrapper = mount(EditSetPage);

        const loadingState = wrapper.findComponent(LoadingState);
        expect(loadingState.exists()).toBe(true);
        expect(loadingState.find("[role='status']").exists()).toBe(true);
    });

    it('renders form with real input components after loading', async () => {
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        const wrapper = mount(EditSetPage);
        await flushPromises();

        expect(wrapper.findComponent(NumberInput).exists()).toBe(true);
        expect(wrapper.findComponent(SelectInput).exists()).toBe(true);
    });

    it('renders real PrimaryButton and DangerButton for actions', async () => {
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        const wrapper = mount(EditSetPage);
        await flushPromises();

        const primaryBtn = wrapper.findComponent(PrimaryButton);
        expect(primaryBtn.find('button').attributes('type')).toBe('submit');

        const dangerBtn = wrapper.findComponent(DangerButton);
        expect(dangerBtn.exists()).toBe(true);
        expect(dangerBtn.text()).toContain('Delete');
    });

    it('opens real ConfirmDialog when clicking delete', async () => {
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        const wrapper = mount(EditSetPage);
        await flushPromises();

        const dangerBtn = wrapper.findComponent(DangerButton);
        await dangerBtn.find('button').trigger('click');

        const confirmDialog = wrapper.findComponent(ConfirmDialog);
        expect(confirmDialog.props('open')).toBe(true);
        expect(confirmDialog.props('title')).toBe('Delete');
    });

    it('submits edit through real component tree', async () => {
        mockPatch.mockResolvedValue(undefined);
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        const wrapper = mount(EditSetPage);
        await flushPromises();

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(mockPatch).toHaveBeenCalled();
        // No assertion on navigation — integration tests verify composition, not side effects.
    });

    it('renders set name in subtitle after loading', async () => {
        vi.spyOn(familySetStoreModule, 'getOrFailById').mockResolvedValue(makeAdapted());
        const wrapper = mount(EditSetPage);
        await flushPromises();

        expect(wrapper.text()).toContain('Millennium Falcon');
        expect(wrapper.text()).toContain('75192-1');
    });
});
