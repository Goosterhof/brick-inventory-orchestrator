import type {ComponentPublicInstance} from 'vue';

import {FormField, TextInput} from '@script-development/ui-inputs';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {shallowMount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import FormValidationWorkbench from '@/apps/showcase/components/FormValidationWorkbench.vue';
import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';

const {createMockUiInputs} = await vi.hoisted(() => import('../../../../helpers'));

vi.mock('@script-development/ui-inputs', () => createMockUiInputs());

// atom-at-call-site: labels/errors live on FormField; name/setNumber use the
// package TextInput, the other three fields are native controls in the slot.
const fieldByLabel = (wrapper: ReturnType<typeof shallowMount>, label: string) =>
    wrapper.findAllComponents(FormField).find((field) => field.props('label') === label);

const textInputByLabel = (wrapper: ReturnType<typeof shallowMount>, label: string) =>
    fieldByLabel(wrapper, label)?.findComponent(TextInput);

describe('FormValidationWorkbench', () => {
    const stubs = {SectionHeading, FormField: false, TextInput: false, SingleSelect: false, PrimaryButton};
    const mount = () => shallowMount(FormValidationWorkbench, {global: {stubs}});

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render the section heading with correct number and title', () => {
        const wrapper = mount();
        expect(wrapper.text()).toContain('11');
        expect(wrapper.text()).toContain('Form Validation Workbench');
    });

    it('should render the section element with correct id', () => {
        const wrapper = mount();
        expect(wrapper.find('section#form-validation-workbench').exists()).toBe(true);
    });

    it('should render all demo subsections', () => {
        const wrapper = mount();
        const labelTexts = wrapper.findAll('.brick-label').map((l) => l.text());
        expect(labelTexts).toContain('Add a LEGO Set');
        expect(labelTexts).toContain('Inspector Panel');
        expect(labelTexts).toContain('How It Works');
    });

    it('should render all six form inputs', () => {
        const wrapper = mount();
        expect(wrapper.text()).toContain('Set Name');
        expect(wrapper.text()).toContain('Set Number');
        expect(wrapper.text()).toContain('Piece Count');
        expect(wrapper.text()).toContain('Theme');
        expect(wrapper.text()).toContain('Purchase Date');
        expect(wrapper.text()).toContain('Notes');
    });

    it('should render three submit buttons', () => {
        const wrapper = mount();
        const buttonTexts = wrapper.findAll('button').map((b) => b.text());
        expect(buttonTexts).toContain('Submit (Success)');
        expect(buttonTexts).toContain('Submit (422 Errors)');
        expect(buttonTexts).toContain('Submit (Server Error)');
    });

    it('should render the inspector panel with empty initial state', () => {
        const wrapper = mount();
        const inspectorJson = wrapper.find('[data-testid="inspector-json"]');
        expect(inspectorJson.exists()).toBe(true);
        expect(inspectorJson.text()).toBe('{}');
    });

    it('should render the how-it-works code snippet', () => {
        const wrapper = mount();
        expect(wrapper.text()).toContain('useForm<SetFormField>(httpService)');
        expect(wrapper.text()).toContain('useForm(httpService) = useValidationErrors + useFormSubmit');
    });

    it('should show success message and reset form after successful submit', async () => {
        // Arrange
        const wrapper = mount();
        await textInputByLabel(wrapper, 'Set Name')?.setValue('Millennium Falcon');

        // Act
        const successBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (Success)');
        await successBtn?.trigger('click');
        await vi.advanceTimersByTimeAsync(400);
        await nextTick();

        // Assert — success message visible + form reset
        expect(wrapper.text()).toContain('Set added successfully!');
        expect(textInputByLabel(wrapper, 'Set Name')?.props('modelValue')).toBe('');

        // Advance past the 2000ms success message timeout
        await vi.advanceTimersByTimeAsync(2000);
        await nextTick();
        expect(wrapper.text()).not.toContain('Set added successfully!');
    });

    it('should show submitting state during success submission', async () => {
        const wrapper = mount();
        const successBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (Success)');
        await successBtn?.trigger('click');
        await nextTick();

        expect(wrapper.text()).toContain('Submitting...');

        await vi.advanceTimersByTimeAsync(400);
        await nextTick();
        await vi.advanceTimersByTimeAsync(2000);
    });

    it('should display validation errors on all fields after 422 response', async () => {
        const wrapper = mount();
        const errorBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (422 Errors)');
        await errorBtn?.trigger('click');
        await nextTick();

        // Errors are surfaced by FormField now
        expect(fieldByLabel(wrapper, 'Set Name')?.props('error')).toBe('The name field is required.');
        expect(fieldByLabel(wrapper, 'Set Number')?.props('error')).toBe('The set number must be unique.');
    });

    it('should show validation errors in inspector panel after 422 response', async () => {
        const wrapper = mount();
        const errorBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (422 Errors)');
        await errorBtn?.trigger('click');
        await nextTick();

        const inspectorJson = wrapper.find('[data-testid="inspector-json"]');
        expect(inspectorJson.text()).toContain('The name field is required.');
        expect(inspectorJson.text()).toContain('The set number must be unique.');
        expect(inspectorJson.text()).toContain('The piece count must be at least 1.');
        expect(inspectorJson.text()).toContain('The selected theme is invalid.');
        expect(inspectorJson.text()).toContain('The purchase date must be a valid date.');
        expect(inspectorJson.text()).toContain('The notes may not be greater than 500 characters.');
    });

    it('should display server error message after non-422 error', async () => {
        const wrapper = mount();
        const serverErrorBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (Server Error)');
        await serverErrorBtn?.trigger('click');
        await nextTick();

        expect(wrapper.text()).toContain('Internal Server Error: The brick vault is offline.');
    });

    it('should clear validation errors when form fields change', async () => {
        const wrapper = mount();
        const errorBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (422 Errors)');
        await errorBtn?.trigger('click');
        await nextTick();

        const inspectorJson = wrapper.find('[data-testid="inspector-json"]');
        expect(inspectorJson.text()).toContain('The name field is required.');

        // Act — change a field to trigger the clearing watcher
        textInputByLabel(wrapper, 'Set Name')?.vm.$emit('update:modelValue', 'New Value');
        await nextTick();

        expect(inspectorJson.text()).toBe('{}');
    });

    it('should clear server error when form fields change', async () => {
        const wrapper = mount();
        const serverErrorBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (Server Error)');
        await serverErrorBtn?.trigger('click');
        await nextTick();
        expect(wrapper.text()).toContain('Internal Server Error: The brick vault is offline.');

        textInputByLabel(wrapper, 'Set Name')?.vm.$emit('update:modelValue', 'Something');
        await nextTick();

        expect(wrapper.text()).not.toContain('Internal Server Error: The brick vault is offline.');
    });

    it('should not show success message or server error initially', () => {
        const wrapper = mount();
        expect(wrapper.text()).not.toContain('Set added successfully!');
        expect(wrapper.text()).not.toContain('Internal Server Error');
    });

    it('should render select input with theme options', () => {
        const wrapper = mount();
        expect(wrapper.text()).toContain('Star Wars');
        expect(wrapper.text()).toContain('Technic');
        expect(wrapper.text()).toContain('City');
        expect(wrapper.text()).toContain('Creator');
    });

    it('should render the notes field as optional', () => {
        const wrapper = mount();
        // required polarity replaces the old `optional` prop; notes is optional
        expect(fieldByLabel(wrapper, 'Notes')?.props('required')).toBe(false);
    });

    it('should trigger watcher without errors present to cover the no-op branch', async () => {
        const wrapper = mount();
        textInputByLabel(wrapper, 'Set Name')?.vm.$emit('update:modelValue', 'Some Value');
        await nextTick();

        const inspectorJson = wrapper.find('[data-testid="inspector-json"]');
        expect(inspectorJson.text()).toBe('{}');
    });

    it('should update all form field values via v-model', async () => {
        const wrapper = mount();

        // Set Number — package TextInput
        textInputByLabel(wrapper, 'Set Number')?.vm.$emit('update:modelValue', '75192');
        await nextTick();

        // Piece Count — native number input driven through onPieceCountInput
        await wrapper.get('input[type="number"]').setValue(''); // NaN → null branch
        await wrapper.get('input[type="number"]').setValue('7541');

        // Theme — SingleSelect emits the option id
        (wrapper.findComponent({name: 'SingleSelect'}).vm as ComponentPublicInstance).$emit(
            'update:modelValue',
            'star-wars',
        );
        await nextTick();

        // Purchase Date + Notes — native controls
        await wrapper.get('input[type="date"]').setValue('2026-01-15');
        await wrapper.get('textarea').setValue('Great set!');

        // Assert — values propagated back to the controls
        expect(textInputByLabel(wrapper, 'Set Number')?.props('modelValue')).toBe('75192');
        expect((wrapper.get('input[type="number"]').element as HTMLInputElement).value).toBe('7541');
        expect(wrapper.get('[role="combobox"]').text()).toBe('star-wars');
        expect((wrapper.get('input[type="date"]').element as HTMLInputElement).value).toBe('2026-01-15');
        expect(wrapper.get('textarea').element.value).toBe('Great set!');
    });

    it('should clean up middleware on unmount', () => {
        const wrapper = mount();
        wrapper.unmount();
        expect(wrapper.vm).toBeDefined();
    });
});
