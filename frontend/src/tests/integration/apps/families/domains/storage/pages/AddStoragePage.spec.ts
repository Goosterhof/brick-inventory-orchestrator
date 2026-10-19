import AddStoragePage from '@app/domains/storage/pages/AddStoragePage.vue';
import {familyRouterService} from '@app/services';
import {mockServer} from '@integration/helpers/mock-server';
import {SingleSelect, TextInput} from '@script-development/ui-inputs';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {guarded, mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService, guarded};
});

describe('AddStoragePage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        mockServer.onGet('storage-options', []);
        localStorage.clear();
    });

    const mountPage = () => mount(AddStoragePage);

    it('renders all real form input components', () => {
        const wrapper = mountPage();

        // name is a package TextInput; description a textarea; row/column native numbers
        expect(wrapper.findAllComponents(TextInput)).toHaveLength(1);
        expect(wrapper.find('textarea').exists()).toBe(true);
        expect(wrapper.findAll('input[type="number"]')).toHaveLength(2);
        expect(wrapper.findComponent(SingleSelect).exists()).toBe(true);
    });

    it('loads parent locations into the selector and submits the selected parent', async () => {
        mockServer.onGet('storage-options', [
            {
                id: 3,
                name: 'Drawer',
                description: null,
                parent_id: null,
                row: null,
                column: null,
                grid_rows: 4,
                grid_columns: 6,
                child_ids: [],
            },
        ]);
        mockServer.onPost('storage-options', {
            id: 7,
            name: 'Bin',
            description: null,
            parent_id: 3,
            row: null,
            column: null,
            grid_rows: null,
            grid_columns: null,
            child_ids: [],
        });
        const wrapper = mountPage();
        await flushPromises();

        const select = wrapper.findComponent(SingleSelect);
        expect((select.props() as {options: {id: number; label: string}[]}).options).toStrictEqual([
            {id: 3, label: 'Drawer'},
        ]);
        select.vm.$emit('update:modelValue', 3);
        await wrapper.findComponent(TextInput).find('input').setValue('Bin');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(mockServer.callsTo('POST', 'storage-options')[0]?.body).toMatchObject({
            name: 'Bin',
            parent_id: 3,
            grid_rows: null,
            grid_columns: null,
        });
        expect(wrapper.findAll('input[type="number"]')).toHaveLength(4);
        expect(wrapper.findAll('input[type="number"]')[2]?.attributes('max')).toBe('4');
        expect(wrapper.findAll('input[type="number"]')[3]?.attributes('max')).toBe('6');
    });

    it('labels every field', () => {
        const wrapper = mountPage();

        const labels = wrapper.findAll('.ui-label').map((label) => label.text().replace(/\*$/, ''));
        expect(labels).toStrictEqual(['Name', 'Rows', 'Columns', 'Parent location', 'Description']);
    });

    it('renders real PrimaryButton for submission', () => {
        const wrapper = mountPage();

        const button = wrapper.findComponent(PrimaryButton);
        expect(button.find('button').attributes('type')).toBe('submit');
        expect(button.text()).toBe('Add');
    });

    it('submits form through real component tree', async () => {
        mockServer.onPost('storage-options', {
            id: 7,
            name: '',
            description: null,
            parent_id: null,
            row: null,
            column: null,
            grid_rows: null,
            grid_columns: null,
            child_ids: [],
        });
        const wrapper = mountPage();
        const goToRoute = vi.spyOn(familyRouterService, 'goToRoute');

        await wrapper.findComponent(TextInput).find('input').setValue('Shelf A');

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // The create() call posts to storage-options with a snake_case wire body (ADR-0029);
        // goToRoute navigates to the detail page of the created storage option.
        const createCalls = mockServer.callsTo('POST', 'storage-options');
        expect(createCalls).toHaveLength(1);
        expect(createCalls[0]?.body).toMatchObject({
            name: 'Shelf A',
            parent_id: null,
            row: null,
            column: null,
            grid_rows: null,
            grid_columns: null,
        });
        expect(createCalls[0]?.body).not.toHaveProperty('parentId');
        expect(goToRoute).toHaveBeenCalledWith('storage-detail', 7);
    });

    it('submits both grid dimensions and refreshes the store after creating a grid', async () => {
        mockServer.onPost('storage-options', {
            id: 8,
            name: 'Cabinet',
            description: null,
            parent_id: null,
            row: null,
            column: null,
            grid_rows: 4,
            grid_columns: 6,
            child_ids: [],
        });
        const wrapper = mountPage();
        const numbers = wrapper.findAll('input[type="number"]');
        await numbers[0]?.setValue('4');
        await numbers[1]?.setValue('6');
        await wrapper.findComponent(TextInput).find('input').setValue('Cabinet');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(mockServer.callsTo('POST', 'storage-options')[0]?.body).toMatchObject({grid_rows: 4, grid_columns: 6});
        expect(mockServer.callsTo('GET', 'storage-options')).toHaveLength(2);
    });

    it.each([
        {filledIndex: 0, emptyField: 'grid_columns', errorText: 'Columns are required when rows are provided.'},
        {filledIndex: 1, emptyField: 'grid_rows', errorText: 'Rows are required when columns are provided.'},
    ])(
        'shows a validation error when only one grid dimension is filled',
        async ({filledIndex, emptyField, errorText}) => {
            mockServer.onPostError('storage-options', 422, {errors: {[emptyField]: [errorText]}});
            const wrapper = mountPage();
            await wrapper.findAll('input[type="number"]')[filledIndex]?.setValue('4');
            await wrapper.findComponent(TextInput).find('input').setValue('Cabinet');
            await wrapper.find('form').trigger('submit');
            await flushPromises();

            expect(mockServer.callsTo('POST', 'storage-options')).toHaveLength(1);
            expect(wrapper.text()).toContain(errorText);
        },
    );

    it('clears row and column when switching from a gridded parent to a gridless parent', async () => {
        mockServer.onGet('storage-options', [
            {
                id: 3,
                name: 'Drawer',
                description: null,
                parent_id: null,
                row: null,
                column: null,
                grid_rows: 4,
                grid_columns: 6,
                child_ids: [],
            },
            {
                id: 4,
                name: 'Shelf',
                description: null,
                parent_id: null,
                row: null,
                column: null,
                grid_rows: null,
                grid_columns: null,
                child_ids: [],
            },
        ]);
        mockServer.onPost('storage-options', {
            id: 7,
            name: 'Bin',
            description: null,
            parent_id: 4,
            row: null,
            column: null,
            grid_rows: null,
            grid_columns: null,
            child_ids: [],
        });
        const wrapper = mountPage();
        await flushPromises();

        const select = wrapper.findComponent(SingleSelect);
        select.vm.$emit('update:modelValue', 3);
        await flushPromises();
        const coordinates = wrapper.findAll('input[type="number"]');
        await coordinates[2]?.setValue('2');
        await coordinates[3]?.setValue('3');
        select.vm.$emit('update:modelValue', 4);
        await flushPromises();
        await wrapper.findComponent(TextInput).find('input').setValue('Bin');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(mockServer.callsTo('POST', 'storage-options')[0]?.body).toMatchObject({row: null, column: null});
    });

    it('renders page title', () => {
        const wrapper = mountPage();

        expect(wrapper.find('h1').text()).toBe('Add storage');
    });
});
