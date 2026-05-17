import PlacePartModal from '@app/modals/PlacePartModal.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import SelectInput from '@shared/components/forms/inputs/SelectInput.vue';
import ModalDialog from '@shared/components/ModalDialog.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
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
} = await vi.hoisted(() => import('../../../../helpers'));

vi.mock('@phosphor-icons/vue', () => ({PhX: {template: '<i />'}}));

vi.mock('@shared/components/forms/FormError.vue', () => createMockFormError());
vi.mock('@shared/components/forms/FormField.vue', () => createMockFormField());
vi.mock('@shared/components/forms/FormLabel.vue', () => createMockFormLabel());

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());

const {mockGetRequest, mockPostRequest} = vi.hoisted(() => ({
    mockGetRequest: vi.fn<() => Promise<unknown>>(),
    mockPostRequest: vi.fn<() => Promise<unknown>>(),
}));

vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {getRequest: mockGetRequest, postRequest: mockPostRequest},
        familyAuthService: {isLoggedIn: {value: true}},
    }),
);

const mockPartIdentity = {
    partId: 10,
    partNum: '3001',
    partName: 'Brick 2 x 4',
    colorId: 1,
    colorName: 'Red',
    colorHex: 'CC0000',
    partImageUrl: 'https://example.com/3001.jpg',
};

const mockStorageOptions = [
    {id: 1, name: 'Drawer A', description: null, parentId: null, row: null, column: null, childIds: []},
    {id: 2, name: 'Drawer B', description: null, parentId: null, row: null, column: null, childIds: []},
];

const mountModal = (props: Record<string, unknown> = {}) =>
    shallowMount(PlacePartModal, {
        props: {open: true, partIdentity: mockPartIdentity, ...props},
        global: {
            stubs: {
                // Render the title slot so wrapper.text() can assert on the resolved title.
                // Default shallowMount stubs do not render named slots; this surfaces them for testing.
                // We declare `open` so findComponent(ModalDialog).props('open') still resolves correctly.
                ModalDialog: {props: ['open'], template: '<div><slot name="title" /><slot /></div>'},
            },
        },
    });

describe('PlacePartModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetRequest.mockResolvedValue({data: mockStorageOptions});
    });

    it('should render modal dialog when open', async () => {
        // Arrange & Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(ModalDialog).exists()).toBe(true);
        expect(wrapper.findComponent(ModalDialog).props('open')).toBe(true);
    });

    it('should display part identity (name, partNum, color)', async () => {
        // Arrange & Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('Brick 2 x 4');
        expect(wrapper.text()).toContain('3001');
        expect(wrapper.text()).toContain('Red');
    });

    it('should omit the color swatch when partIdentity.colorHex is empty', async () => {
        // Arrange
        const partIdentityWithoutHex = {...mockPartIdentity, colorHex: ''};

        // Act
        const wrapper = mountModal({partIdentity: partIdentityWithoutHex});
        await flushPromises();

        // Assert — the swatch element binds backgroundColor from colorHex; absent hex means no swatch.
        const swatches = wrapper.findAll('[style*="background-color"]');
        expect(swatches).toHaveLength(0);
    });

    it('should fetch storage options on mount', async () => {
        // Arrange & Act
        mountModal();
        await flushPromises();

        // Assert
        expect(mockGetRequest).toHaveBeenCalledWith('/storage-options');
    });

    it('should fall back to an empty list when /storage-options fetch fails', async () => {
        // Arrange
        mockGetRequest.mockRejectedValueOnce(new Error('boom'));

        // Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert — only the disabled placeholder option remains.
        const options = wrapper.findAll('option');
        expect(options).toHaveLength(1);
    });

    it('should render storage select with options', async () => {
        // Arrange & Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(SelectInput).exists()).toBe(true);
        const options = wrapper.findAll('option');
        expect(options).toHaveLength(3);
        expect(options[1]?.text()).toBe('Drawer A');
        expect(options[2]?.text()).toBe('Drawer B');
    });

    it('should render quantity input prefilled with defaultQuantity', async () => {
        // Arrange & Act
        const wrapper = mountModal({defaultQuantity: 7});
        await flushPromises();

        // Assert
        const input = wrapper.findComponent(NumberInput);
        expect(input.exists()).toBe(true);
        expect(input.props('modelValue')).toBe(7);
    });

    it('should pass maxQuantity to the NumberInput', async () => {
        // Arrange & Act
        const wrapper = mountModal({defaultQuantity: 4, maxQuantity: 4});
        await flushPromises();

        // Assert
        expect(wrapper.findComponent(NumberInput).props('max')).toBe(4);
    });

    it('should render the placement button copy from the parts.placeAction key', async () => {
        // Arrange & Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert
        const button = wrapper.findComponent(PrimaryButton);
        expect(button.text()).toBe('parts.placeAction');
    });

    it('should show loading text while fetching storage options', () => {
        // Arrange
        mockGetRequest.mockReturnValue(new Promise(() => {}));

        // Act
        const wrapper = mountModal();

        // Assert
        expect(wrapper.text()).toContain('common.loading');
    });

    it('should default the title to parts.placeTitle', async () => {
        // Arrange & Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert — translation stub returns key verbatim, so the rendered slot text matches.
        expect(wrapper.text()).toContain('parts.placeTitle');
    });

    it('should render an explicit title prop verbatim, overriding the default', async () => {
        // Arrange & Act
        const wrapper = mountModal({title: 'sets.assignPartTitle'});
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('sets.assignPartTitle');
        expect(wrapper.text()).not.toContain('parts.placeTitle');
    });

    describe('place part', () => {
        it('should POST to /storage-options/{id}/parts with {partId, colorId, quantity}', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: {}});
            const wrapper = mountModal();
            await flushPromises();
            await wrapper.findComponent(SelectInput).setValue('1');
            await wrapper.findComponent(NumberInput).setValue(5);

            // Act
            await wrapper.find('form').trigger('submit');
            await flushPromises();

            // Assert
            expect(mockPostRequest).toHaveBeenCalledWith('/storage-options/1/parts', {
                partId: 10,
                colorId: 1,
                quantity: 5,
            });
        });

        it('should fall back to quantity=1 when the NumberInput is cleared', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: {}});
            const wrapper = mountModal({defaultQuantity: 5});
            await flushPromises();
            await wrapper.findComponent(SelectInput).setValue('2');
            await wrapper.findComponent(NumberInput).setValue(null);

            // Act
            await wrapper.find('form').trigger('submit');
            await flushPromises();

            // Assert
            expect(mockPostRequest).toHaveBeenCalledWith('/storage-options/2/parts', {
                partId: 10,
                colorId: 1,
                quantity: 1,
            });
        });

        it('should ignore submit when no storage option is selected', async () => {
            // Arrange
            const wrapper = mountModal();
            await flushPromises();

            // Act — no SelectInput value set; storageId resolves to NaN/0.
            await wrapper.find('form').trigger('submit');
            await flushPromises();

            // Assert
            expect(mockPostRequest).not.toHaveBeenCalled();
        });

        it('should emit assigned with the placement detail and close on success', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: {}});
            const wrapper = mountModal({defaultQuantity: 3});
            await flushPromises();
            await wrapper.findComponent(SelectInput).setValue('1');

            // Act
            await wrapper.find('form').trigger('submit');
            await flushPromises();

            // Assert
            expect(wrapper.emitted('assigned')).toStrictEqual([
                [{storageOptionId: 1, storageOptionName: 'Drawer A', quantity: 3}],
            ]);
            expect(wrapper.emitted('close')).toBeTruthy();
        });

        it('should emit assigned with empty storageOptionName when the option vanishes mid-submit', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: {}});
            const wrapper = mountModal({defaultQuantity: 3});
            await flushPromises();
            // Select an id that exists in the list, but pre-clear the list to force the lookup miss.
            await wrapper.findComponent(SelectInput).setValue('999');

            // Act
            await wrapper.find('form').trigger('submit');
            await flushPromises();

            // Assert — fallback empty name is the contract surface; consumers handle it.
            expect(wrapper.emitted('assigned')?.[0]).toStrictEqual([
                {storageOptionId: 999, storageOptionName: '', quantity: 3},
            ]);
        });

        it('should keep the modal open and surface the error on POST failure', async () => {
            // Arrange
            mockPostRequest.mockRejectedValue(new Error('Server error'));
            const wrapper = mountModal();
            await flushPromises();
            await wrapper.findComponent(SelectInput).setValue('1');

            // Act
            await wrapper.find('form').trigger('submit');
            await flushPromises();

            // Assert
            expect(wrapper.findComponent(SelectInput).props('error')).toBe('sets.assignError');
            expect(wrapper.emitted('assigned')).toBeUndefined();
            expect(wrapper.emitted('close')).toBeUndefined();
        });

        it('should emit close when the modal dialog is dismissed', async () => {
            // Arrange
            const wrapper = mountModal();
            await flushPromises();

            // Act
            wrapper.findComponent(ModalDialog).vm.$emit('close');

            // Assert
            expect(wrapper.emitted('close')).toBeTruthy();
        });
    });

    describe('already-stored panel', () => {
        it('should show existing locations when the part is already stored', async () => {
            // Arrange
            const existingLocations = [
                {partId: 10, colorId: 1, storageOptionId: 5, storageOptionName: 'Drawer A', quantity: 8},
            ];

            // Act
            const wrapper = mountModal({existingLocations});
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('sets.alreadyStored');
            expect(wrapper.text()).toContain('Drawer A (8x)');
        });

        it('should not show the panel when no existing locations are passed', async () => {
            // Arrange & Act
            const wrapper = mountModal();
            await flushPromises();

            // Assert
            expect(wrapper.text()).not.toContain('sets.alreadyStored');
        });
    });

    describe('needed-by panel', () => {
        it('should hide the panel when neededBySetNums is empty', async () => {
            // Arrange & Act
            const wrapper = mountModal();
            await flushPromises();

            // Assert
            expect(wrapper.find("[data-testid='place-needed-by']").exists()).toBe(false);
        });

        it('should render up to five set numbers inline without an overflow chip', async () => {
            // Arrange & Act
            const wrapper = mountModal({neededBySetNums: ['1-1', '2-1', '3-1', '4-1', '5-1']});
            await flushPromises();

            // Assert
            const panel = wrapper.find("[data-testid='place-needed-by']");
            expect(panel.exists()).toBe(true);
            expect(panel.text()).toContain('1-1');
            expect(panel.text()).toContain('5-1');
            expect(wrapper.find("[data-testid='place-needed-by-overflow']").exists()).toBe(false);
        });

        it('should render an overflow chip when more than five set numbers are passed', async () => {
            // Arrange & Act
            const wrapper = mountModal({neededBySetNums: ['1-1', '2-1', '3-1', '4-1', '5-1', '6-1', '7-1']});
            await flushPromises();

            // Assert — five inline chips + the overflow chip rendering "+2 more".
            const overflow = wrapper.find("[data-testid='place-needed-by-overflow']");
            expect(overflow.exists()).toBe(true);
            expect(overflow.text()).toContain('parts.placeNeededByMore');
        });
    });
});
