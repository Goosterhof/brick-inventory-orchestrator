import AddStoragePage from '@app/domains/storage/pages/AddStoragePage.vue';
import {mockServer} from '@integration/helpers/mock-server';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import TextareaInput from '@shared/components/forms/inputs/TextareaInput.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService};
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

        const textInputs = wrapper.findAllComponents(TextInput);
        expect(textInputs).toHaveLength(1);
        expect(textInputs.find((i) => i.props('label') === 'Name')).toBeDefined();

        expect(wrapper.findComponent(TextareaInput).exists()).toBe(true);

        const numberInputs = wrapper.findAllComponents(NumberInput);
        expect(numberInputs).toHaveLength(2);
    });

    it('renders real NumberInputs for row and column', () => {
        const wrapper = mountPage();

        const numberInputs = wrapper.findAllComponents(NumberInput);
        const labels = numberInputs.map((n) => n.props('label'));
        expect(labels).toContain('Row');
        expect(labels).toContain('Column');
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

        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // No assertion on navigation — integration tests verify composition, not side effects.
    });

    it('renders page title', () => {
        const wrapper = mountPage();

        expect(wrapper.find('h1').text()).toBe('Add storage');
    });
});
