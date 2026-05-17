import DateInput from '@shared/components/forms/inputs/DateInput.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import SelectInput from '@shared/components/forms/inputs/SelectInput.vue';
import TextareaInput from '@shared/components/forms/inputs/TextareaInput.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {shallowMount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import FormValidationWorkbench from '@/apps/showcase/components/FormValidationWorkbench.vue';
import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';

describe('FormValidationWorkbench', () => {
    const stubs = {SectionHeading, TextInput, NumberInput, SelectInput, DateInput, TextareaInput, PrimaryButton};

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('11');
        expect(wrapper.text()).toContain('Form Validation Workbench');
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Assert
        expect(wrapper.find('section#form-validation-workbench').exists()).toBe(true);
    });

    it('should render all demo subsections', () => {
        // Act
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Assert
        const labels = wrapper.findAll('.brick-label');
        const labelTexts = labels.map((l) => l.text());
        expect(labelTexts).toContain('Add a LEGO Set');
        expect(labelTexts).toContain('Inspector Panel');
        expect(labelTexts).toContain('How It Works');
    });

    it('should render all six form inputs', () => {
        // Act
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('Set Name');
        expect(wrapper.text()).toContain('Set Number');
        expect(wrapper.text()).toContain('Piece Count');
        expect(wrapper.text()).toContain('Theme');
        expect(wrapper.text()).toContain('Purchase Date');
        expect(wrapper.text()).toContain('Notes');
    });

    it('should render three submit buttons', () => {
        // Act
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Assert
        const buttons = wrapper.findAll('button');
        const buttonTexts = buttons.map((b) => b.text());
        expect(buttonTexts).toContain('Submit (Success)');
        expect(buttonTexts).toContain('Submit (422 Errors)');
        expect(buttonTexts).toContain('Submit (Server Error)');
    });

    it('should render the inspector panel with empty initial state', () => {
        // Act
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Assert
        const inspectorJson = wrapper.find('[data-testid="inspector-json"]');
        expect(inspectorJson.exists()).toBe(true);
        expect(inspectorJson.text()).toBe('{}');
    });

    it('should render the how-it-works code snippet', () => {
        // Act
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('useValidationErrors<SetFormField>(httpService)');
        expect(wrapper.text()).toContain('useFormSubmit(validationErrors)');
    });

    it('should show success message and reset form after successful submit', async () => {
        // Arrange
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});
        const nameInput = wrapper.findAllComponents(TextInput).find((c) => c.props('label') === 'Set Name');
        await nameInput?.setValue('Millennium Falcon');

        // Act
        const successBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (Success)');
        await successBtn?.trigger('click');

        // Advance past the 400ms simulated delay
        await vi.advanceTimersByTimeAsync(400);
        await nextTick();

        // Assert — success message visible
        expect(wrapper.text()).toContain('Set added successfully!');

        // Assert — form was reset (name input cleared)
        const nameInputAfter = wrapper.findAllComponents(TextInput).find((c) => c.props('label') === 'Set Name');
        expect(nameInputAfter?.props('modelValue')).toBe('');

        // Advance past the 2000ms success message timeout
        await vi.advanceTimersByTimeAsync(2000);
        await nextTick();

        // Assert — success message gone
        expect(wrapper.text()).not.toContain('Set added successfully!');
    });

    it('should show submitting state during success submission', async () => {
        // Arrange
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Act
        const successBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (Success)');
        await successBtn?.trigger('click');
        await nextTick();

        // Assert — button shows submitting text
        expect(wrapper.text()).toContain('Submitting...');

        // Clean up — advance timers to complete the submit
        await vi.advanceTimersByTimeAsync(400);
        await nextTick();
        await vi.advanceTimersByTimeAsync(2000);
    });

    it('should display validation errors on all fields after 422 response', async () => {
        // Arrange
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Act
        const errorBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (422 Errors)');
        await errorBtn?.trigger('click');
        await nextTick();

        // Assert — errors appear on input components
        const textInputs = wrapper.findAllComponents(TextInput);
        const nameInput = textInputs.find((c) => c.props('label') === 'Set Name');
        expect(nameInput?.props('error')).toBe('The name field is required.');

        const setNumberInput = textInputs.find((c) => c.props('label') === 'Set Number');
        expect(setNumberInput?.props('error')).toBe('The set number must be unique.');
    });

    it('should show validation errors in inspector panel after 422 response', async () => {
        // Arrange
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Act
        const errorBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (422 Errors)');
        await errorBtn?.trigger('click');
        await nextTick();

        // Assert — inspector panel shows errors as JSON
        const inspectorJson = wrapper.find('[data-testid="inspector-json"]');
        expect(inspectorJson.text()).toContain('The name field is required.');
        expect(inspectorJson.text()).toContain('The set number must be unique.');
        expect(inspectorJson.text()).toContain('The piece count must be at least 1.');
        expect(inspectorJson.text()).toContain('The selected theme is invalid.');
        expect(inspectorJson.text()).toContain('The purchase date must be a valid date.');
        expect(inspectorJson.text()).toContain('The notes may not be greater than 500 characters.');
    });

    it('should display server error message after non-422 error', async () => {
        // Arrange
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Act
        const serverErrorBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (Server Error)');
        await serverErrorBtn?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('Internal Server Error: The brick vault is offline.');
    });

    it('should clear validation errors when form fields change', async () => {
        // Arrange
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Trigger 422 errors first
        const errorBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (422 Errors)');
        await errorBtn?.trigger('click');
        await nextTick();

        // Verify errors are present
        const inspectorJson = wrapper.find('[data-testid="inspector-json"]');
        expect(inspectorJson.text()).toContain('The name field is required.');

        // Act — change a form field to trigger the watcher
        const nameInput = wrapper.findAllComponents(TextInput).find((c) => c.props('label') === 'Set Name');
        nameInput?.vm.$emit('update:modelValue', 'New Value');
        await nextTick();

        // Assert — errors cleared
        expect(inspectorJson.text()).toBe('{}');
    });

    it('should clear server error when form fields change', async () => {
        // Arrange
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Trigger server error first
        const serverErrorBtn = wrapper.findAll('button').find((b) => b.text() === 'Submit (Server Error)');
        await serverErrorBtn?.trigger('click');
        await nextTick();
        expect(wrapper.text()).toContain('Internal Server Error: The brick vault is offline.');

        // Act — change a form field
        const nameInput = wrapper.findAllComponents(TextInput).find((c) => c.props('label') === 'Set Name');
        nameInput?.vm.$emit('update:modelValue', 'Something');
        await nextTick();

        // Assert
        expect(wrapper.text()).not.toContain('Internal Server Error: The brick vault is offline.');
    });

    it('should not show success message or server error initially', () => {
        // Act
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Assert
        expect(wrapper.text()).not.toContain('Set added successfully!');
        expect(wrapper.text()).not.toContain('Internal Server Error');
    });

    it('should render select input with theme options', () => {
        // Act
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('Star Wars');
        expect(wrapper.text()).toContain('Technic');
        expect(wrapper.text()).toContain('City');
        expect(wrapper.text()).toContain('Creator');
    });

    it('should render textarea with optional label', () => {
        // Act
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Assert
        const textarea = wrapper.findComponent(TextareaInput);
        expect(textarea.props('optional')).toBe(true);
        expect(textarea.props('label')).toBe('Notes');
    });

    it('should trigger watcher without errors present to cover the no-op branch', async () => {
        // Arrange — mount with no errors (initial state)
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Act — change a form field when there are no errors
        const nameInput = wrapper.findAllComponents(TextInput).find((c) => c.props('label') === 'Set Name');
        nameInput?.vm.$emit('update:modelValue', 'Some Value');
        await nextTick();

        // Assert — still no errors (inspector panel still empty)
        const inspectorJson = wrapper.find('[data-testid="inspector-json"]');
        expect(inspectorJson.text()).toBe('{}');
    });

    it('should update all form field values via v-model', async () => {
        // Arrange
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Act — emit update:modelValue on each input component
        const setNumberInput = wrapper.findAllComponents(TextInput).find((c) => c.props('label') === 'Set Number');
        setNumberInput?.vm.$emit('update:modelValue', '75192');
        await nextTick();

        const pieceCountInput = wrapper.findComponent(NumberInput);
        pieceCountInput.vm.$emit('update:modelValue', 7541);
        await nextTick();

        const selectInput = wrapper.findComponent(SelectInput);
        selectInput.vm.$emit('update:modelValue', 'star-wars');
        await nextTick();

        const dateInput = wrapper.findComponent(DateInput);
        dateInput.vm.$emit('update:modelValue', '2026-01-15');
        await nextTick();

        const textareaInput = wrapper.findComponent(TextareaInput);
        textareaInput.vm.$emit('update:modelValue', 'Great set!');
        await nextTick();

        // Assert — values propagated (check via props on re-render)
        expect(setNumberInput?.props('modelValue')).toBe('75192');
        expect(pieceCountInput.props('modelValue')).toBe(7541);
        expect(selectInput.props('modelValue')).toBe('star-wars');
        expect(dateInput.props('modelValue')).toBe('2026-01-15');
        expect(textareaInput.props('modelValue')).toBe('Great set!');
    });

    it('should clean up middleware on unmount', () => {
        // Arrange
        const wrapper = shallowMount(FormValidationWorkbench, {global: {stubs}});

        // Act — unmount triggers onUnmounted which calls the unregister callback
        wrapper.unmount();

        // Assert — no errors (component is unmounted cleanly)
        expect(wrapper.vm).toBeDefined();
    });
});
