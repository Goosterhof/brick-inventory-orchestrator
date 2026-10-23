import type {ComponentPublicInstance} from 'vue';

import PlacePartModal from '@app/modals/PlacePartModal.vue';
import {FormField} from '@script-development/ui-inputs';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {createMockAxios, createMockFsHelpers, createMockStringTs, createMockFamilyServices, createMockUiInputs} =
    await vi.hoisted(() => import('../../../../helpers'));

vi.mock('@shared/components/ModalDialog.vue', () => ({
    default: {
        name: 'ModalDialog',
        props: ['open'],
        emits: ['close'],
        template: '<div><slot name="title" /><slot /></div>',
    },
}));

vi.mock('@shared/components/PrimaryButton.vue', () => ({
    default: {name: 'PrimaryButton', props: ['type', 'disabled'], template: '<button><slot /></button>'},
}));

vi.mock('@phosphor-icons/vue', () => ({PhX: {template: '<i />'}}));

vi.mock('@script-development/ui-inputs', () => createMockUiInputs());

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

const storage = (id: number, name: string, parentId: number | null) => ({
    id,
    name,
    description: null,
    parentId,
    row: null,
    column: null,
    gridRows: null,
    gridColumns: null,
    childIds: [],
});

interface RenderedGroup {
    text: string;
    header?: boolean;
    options: {name: string}[];
}

const renderedGroups = (wrapper: ReturnType<typeof shallowMount>) =>
    (wrapper.findComponent({name: 'GroupSelect'}).props('groups') as RenderedGroup[]).map((group) => ({
        text: group.text,
        header: group.header,
        names: group.options.map((option) => option.name),
    }));

const mockStorageOptions = [
    {id: 1, name: 'Drawer A', description: null, parentId: null, row: null, column: null, childIds: []},
    {id: 2, name: 'Drawer B', description: null, parentId: null, row: null, column: null, childIds: []},
];

const mountModal = (props: Record<string, unknown> = {}) =>
    shallowMount(PlacePartModal, {
        props: {open: true, partIdentity: mockPartIdentity, ...props},
        global: {
            stubs: {
                // Render named slots through the factory mock so title assertions exercise the page.
                ModalDialog: false,
                // Unstub the package controls so the FormField scoped slots + NumberInput + GroupSelect listbox render.
                FormField: false,
                NumberInput: false,
                GroupSelect: false,
            },
        },
    });

// Select a storage option by id through the mock GroupSelect (v-model emits the
// option id) — this also covers ids absent from the list, which a DOM click can't.
const selectStorage = (wrapper: ReturnType<typeof shallowMount>, id: number): void => {
    const select = wrapper.findComponent({name: 'GroupSelect'}).vm as ComponentPublicInstance;
    select.$emit('update:modelValue', id);
};

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
        expect(wrapper.findComponent({name: 'ModalDialog'}).exists()).toBe(true);
        expect(wrapper.findComponent({name: 'ModalDialog'}).props('open')).toBe(true);
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

        // Assert — no options remain in the listbox
        expect(wrapper.findAll('[role="option"]')).toHaveLength(0);
    });

    it('should render storage select with options', async () => {
        // Arrange & Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert — GroupSelect renders the two storage options as listbox items
        expect(wrapper.findComponent({name: 'GroupSelect'}).exists()).toBe(true);
        const options = wrapper.findAll('[role="option"]');
        expect(options).toHaveLength(2);
        expect(options[0]?.text()).toBe('Drawer A');
        expect(options[1]?.text()).toBe('Drawer B');
    });

    describe('storage grouping', () => {
        it('should list top-level storage first, then each parent storage as a group of its children', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({
                data: [
                    storage(3, 'Shelf', null),
                    storage(5, 'Bin 1', 3),
                    storage(2, 'Drawer B', null),
                    storage(6, 'Slot X', 5),
                    storage(4, 'Bin 2', 3),
                    storage(1, 'Drawer A', null),
                ],
            });

            // Act
            const wrapper = mountModal();
            await flushPromises();

            // Assert
            expect(renderedGroups(wrapper)).toStrictEqual([
                {text: '', header: false, names: ['Drawer A', 'Drawer B', 'Shelf']},
                {text: 'Shelf', header: true, names: ['Bin 1', 'Bin 2']},
                {text: 'Shelf › Bin 1', header: true, names: ['Slot X']},
            ]);
            const groups = wrapper.findAll('[role="group"]');
            expect(groups.map((group) => group.attributes('aria-label'))).toStrictEqual([
                undefined,
                'Shelf',
                'Shelf › Bin 1',
            ]);
            expect(groups[1]?.findAll('[role="option"]').map((option) => option.text())).toStrictEqual([
                'Bin 1',
                'Bin 2',
            ]);
        });

        it('should keep storage whose parent is not in the list selectable at top level', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: [storage(1, 'Drawer A', null), storage(7, 'Loose box', 99)]});

            // Act
            const wrapper = mountModal();
            await flushPromises();

            // Assert
            expect(renderedGroups(wrapper)).toStrictEqual([
                {text: '', header: false, names: ['Drawer A', 'Loose box']},
            ]);
        });

        it('should stop the parent path at a storage already on it when parents form a cycle', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({data: [storage(1, 'A', 2), storage(2, 'B', 1)]});

            // Act
            const wrapper = mountModal();
            await flushPromises();

            // Assert
            expect(renderedGroups(wrapper)).toStrictEqual([
                {text: '', header: false, names: []},
                {text: 'A › B', header: true, names: ['A']},
                {text: 'B › A', header: true, names: ['B']},
            ]);
        });

        it('should group thousands of storage options while reading the list a bounded number of times', async () => {
            // Arrange — 200 shelves, each holding 9 bins listed out of name order; the proxy counts every element read.
            const shelves = 200;
            const binsPerShelf = 9;
            const options = [];
            for (let shelf = 1; shelf <= shelves; shelf++) {
                options.push(storage(shelf, `Shelf ${String(shelf).padStart(3, '0')}`, null));
                for (let bin = binsPerShelf; bin >= 1; bin--) {
                    options.push(storage(10_000 + shelf * 10 + bin, `Bin ${bin}`, shelf));
                }
            }
            let elementReads = 0;
            const counted = new Proxy(options, {
                get: (target, key, receiver): unknown => {
                    if (typeof key === 'string' && /^\d+$/.test(key)) elementReads++;
                    return Reflect.get(target, key, receiver);
                },
            });
            mockGetRequest.mockResolvedValue({data: counted});

            // Act
            const wrapper = mountModal();
            await flushPromises();
            const groups = renderedGroups(wrapper);

            // Assert
            expect(groups).toHaveLength(shelves + 1);
            expect(groups[0]?.names).toHaveLength(shelves);
            expect(groups[0]?.names[0]).toBe('Shelf 001');
            expect(groups[1]).toStrictEqual({
                text: 'Shelf 001',
                header: true,
                names: Array.from({length: binsPerShelf}, (_, index) => `Bin ${index + 1}`),
            });
            expect(groups.at(-1)?.text).toBe('Shelf 200');
            expect(groups.slice(1).every((group) => group.names.length === binsPerShelf)).toBe(true);
            expect(elementReads).toBeLessThan(options.length * 20);
        });

        it('should place the part in a nested storage picked from its parent group', async () => {
            // Arrange
            mockGetRequest.mockResolvedValue({
                data: [storage(3, 'Shelf', null), storage(5, 'Bin 1', 3), storage(4, 'Bin 2', 3)],
            });
            mockPostRequest.mockResolvedValue({data: {}});
            const wrapper = mountModal({defaultQuantity: 2});
            await flushPromises();
            const shelfGroup = wrapper.findAll('[role="group"]')[1];

            // Act
            await shelfGroup?.findAll('[role="option"]')[1]?.trigger('click');
            await wrapper.find('form').trigger('submit');
            await flushPromises();

            // Assert
            expect(wrapper.findComponent({name: 'GroupSelect'}).props('modelValue')).toBe(4);
            expect(mockPostRequest).toHaveBeenCalledWith('/storage-options/4/parts', {
                partId: 10,
                colorId: 1,
                quantity: 2,
            });
            expect(wrapper.emitted('assigned')).toStrictEqual([
                [{storageOptionId: 4, storageOptionName: 'Bin 2', quantity: 2}],
            ]);
        });
    });

    it('should render quantity input prefilled with defaultQuantity', async () => {
        // Arrange & Act
        const wrapper = mountModal({defaultQuantity: 7});
        await flushPromises();

        // Assert — native number input prefilled with defaultQuantity
        expect((wrapper.get('input[type="number"]').element as HTMLInputElement).value).toBe('7');
    });

    it('should pass maxQuantity to the NumberInput', async () => {
        // Arrange & Act
        const wrapper = mountModal({defaultQuantity: 4, maxQuantity: 4});
        await flushPromises();

        // Assert — max forwarded to the native number input
        expect(wrapper.get('input[type="number"]').attributes('max')).toBe('4');
    });

    it('should render the placement button copy from the parts.placeAction key', async () => {
        // Arrange & Act
        const wrapper = mountModal();
        await flushPromises();

        // Assert
        const button = wrapper.findComponent({name: 'PrimaryButton'});
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
            selectStorage(wrapper, 1);
            await wrapper.get('input[type="number"]').setValue('5');

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
            selectStorage(wrapper, 2);
            await wrapper.get('input[type="number"]').setValue('');

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
            selectStorage(wrapper, 1);

            // Act
            await wrapper.find('form').trigger('submit');
            await flushPromises();

            // Assert
            expect(wrapper.emitted('assigned')).toStrictEqual([
                [{storageOptionId: 1, storageOptionName: 'Drawer A', quantity: 3}],
            ]);
            expect(wrapper.emitted('close')).toBeDefined();
        });

        it('should emit assigned with empty storageOptionName when the option vanishes mid-submit', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: {}});
            const wrapper = mountModal({defaultQuantity: 3});
            await flushPromises();
            // Select an id that is NOT in the list to force the lookup miss.
            selectStorage(wrapper, 999);

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
            selectStorage(wrapper, 1);

            // Act
            await wrapper.find('form').trigger('submit');
            await flushPromises();

            // Assert — the storage FormField (field 0) surfaces the error
            expect(wrapper.findAllComponents(FormField)[0]?.props('error')).toBe('sets.assignError');
            expect(wrapper.emitted('assigned')).toBeUndefined();
            expect(wrapper.emitted('close')).toBeUndefined();
        });

        it('should emit close when the modal dialog is dismissed', async () => {
            // Arrange
            const wrapper = mountModal();
            await flushPromises();

            // Act
            (wrapper.findComponent({name: 'ModalDialog'}).vm as ComponentPublicInstance).$emit('close');

            // Assert
            expect(wrapper.emitted('close')).toBeDefined();
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
