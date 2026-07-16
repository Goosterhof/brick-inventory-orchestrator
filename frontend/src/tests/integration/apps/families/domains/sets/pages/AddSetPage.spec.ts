import AddSetPage from '@app/domains/sets/pages/AddSetPage.vue';
import {familyRouterService} from '@app/services';
import {mockServer} from '@integration/helpers/mock-server';
import DateInput from '@shared/components/forms/inputs/DateInput.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import SelectInput from '@shared/components/forms/inputs/SelectInput.vue';
import TextareaInput from '@shared/components/forms/inputs/TextareaInput.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-http', async () => {
    const {guarded, mockHttpService} = await import('@integration/helpers/mock-server');
    return {createHttpService: () => mockHttpService, guarded};
});

describe('AddSetPage — integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockServer.reset();
        localStorage.clear();
    });

    const mountPage = async () => {
        // Store needs to be hydrated for duplicate detection (getAll reads from store)
        mockServer.onGet('family-sets', []);
        const wrapper = mount(AddSetPage);
        await flushPromises();
        return wrapper;
    };

    it('renders all form input components as real children', async () => {
        const wrapper = await mountPage();

        expect(wrapper.findComponent(TextInput).exists()).toBe(true);
        expect(wrapper.findComponent(NumberInput).exists()).toBe(true);
        expect(wrapper.findComponent(SelectInput).exists()).toBe(true);
        expect(wrapper.findComponent(DateInput).exists()).toBe(true);
        expect(wrapper.findComponent(TextareaInput).exists()).toBe(true);
    });

    it('renders real TextInput with label for set number', async () => {
        const wrapper = await mountPage();

        const textInput = wrapper.findComponent(TextInput);
        expect(textInput.props('label')).toBe('Set number');
        expect(textInput.find('input').exists()).toBe(true);
    });

    it('renders real SelectInput with status options', async () => {
        const wrapper = await mountPage();

        const selectInput = wrapper.findComponent(SelectInput);
        expect(selectInput.props('label')).toBe('Status');
        const options = selectInput.findAll('option');
        expect(options).toHaveLength(6);
    });

    it('renders a real PrimaryButton for form submission', async () => {
        const wrapper = await mountPage();

        const button = wrapper.findComponent(PrimaryButton);
        expect(button.find('button').attributes('type')).toBe('submit');
        expect(button.text()).toBe('Add');
    });

    it('submits form through real component tree', async () => {
        const wrapper = await mountPage();
        const goToRoute = vi.spyOn(familyRouterService, 'goToRoute');

        await wrapper.findComponent(TextInput).find('input').setValue('75192-1');

        mockServer.onPost('family-sets', {id: 42});
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // The create() call posts to family-sets with a snake_case wire body (ADR-0029);
        // goToRoute navigates to the detail page of the created set.
        const createCalls = mockServer.callsTo('POST', 'family-sets');
        expect(createCalls).toHaveLength(1);
        expect(createCalls[0]?.body).toMatchObject({set_num: '75192-1', quantity: 1, status: 'sealed'});
        expect(createCalls[0]?.body).not.toHaveProperty('setNum');
        expect(goToRoute).toHaveBeenCalledWith('sets-detail', 42);
    });

    it('does not show duplicate warning when setNum is empty', async () => {
        const wrapper = await mountPage();

        expect(wrapper.find("[data-testid='duplicate-warning']").exists()).toBe(false);
    });
});
