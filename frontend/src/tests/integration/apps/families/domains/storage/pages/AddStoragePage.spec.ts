import AddStoragePage from '@app/domains/storage/pages/AddStoragePage.vue';
import {familyRouterService} from '@app/services';
import {mockServer} from '@integration/helpers/mock-server';
import {TextInput} from '@script-development/ui-inputs';
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
        localStorage.clear();
    });

    const mountPage = () => mount(AddStoragePage);

    it('renders all real form input components', () => {
        const wrapper = mountPage();

        // name is a package TextInput; description a textarea; row/column native numbers
        expect(wrapper.findAllComponents(TextInput)).toHaveLength(1);
        expect(wrapper.find('textarea').exists()).toBe(true);
        expect(wrapper.findAll('input[type="number"]')).toHaveLength(2);
    });

    it('labels every field', () => {
        const wrapper = mountPage();

        const labels = wrapper.findAll('.ui-label').map((label) => label.text().replace(/\*$/, ''));
        expect(labels).toStrictEqual(['Name', 'Description', 'Row', 'Column']);
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
        expect(createCalls[0]?.body).toMatchObject({name: 'Shelf A', parent_id: null, row: null, column: null});
        expect(createCalls[0]?.body).not.toHaveProperty('parentId');
        expect(goToRoute).toHaveBeenCalledWith('storage-detail', 7);
    });

    it('renders page title', () => {
        const wrapper = mountPage();

        expect(wrapper.find('h1').text()).toBe('Add storage');
    });
});
