import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';

const {createMockFormError, createMockFormField, createMockFormLabel} = await vi.hoisted(
    () => import('../../../../../helpers'),
);

vi.mock('@shared/components/forms/FormError.vue', () => createMockFormError());
vi.mock('@shared/components/forms/FormField.vue', () => createMockFormField());
vi.mock('@shared/components/forms/FormLabel.vue', () => createMockFormLabel());

describe('NumberInput', () => {
    it('should render label and input', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Quantity', modelValue: null}});

        // Assert
        const label = wrapper.findComponent({name: 'FormLabel'});
        expect(label.text()).toContain('Quantity');
        expect(wrapper.find('input').exists()).toBe(true);
        expect(wrapper.find('input').attributes('type')).toBe('number');
    });

    it('should associate label with input via id', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Amount', modelValue: null}});
        const input = wrapper.find('input');
        const label = wrapper.findComponent({name: 'FormLabel'});
        const inputId = input.attributes('id');

        // Assert
        expect(inputId).toBeTruthy();
        expect(label.props('for')).toBe(inputId);
    });

    it('should emit update:modelValue on input', async () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Count', modelValue: null}});

        // Act
        await wrapper.find('input').setValue(42);

        // Assert
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0]).toStrictEqual([42]);
    });

    it('should emit null when input is cleared', async () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Count', modelValue: 42}});

        // Act
        await wrapper.find('input').setValue('');

        // Assert
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0]).toStrictEqual([null]);
    });

    it('should be required by default', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Amount', modelValue: null}});

        // Assert
        const label = wrapper.findComponent({name: 'FormLabel'});
        expect(label.props('optional')).toBe(false);
        expect(wrapper.find('input').attributes('required')).toBeDefined();
    });

    it('should show optional indicator and not be required when optional', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Amount', modelValue: null, optional: true}});

        // Assert
        const label = wrapper.findComponent({name: 'FormLabel'});
        expect(label.props('optional')).toBe(true);
        expect(wrapper.find('input').attributes('required')).toBeUndefined();
    });

    it('should display error message and set aria-invalid', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {
            props: {label: 'Amount', modelValue: null, error: 'Must be a positive number'},
        });
        const input = wrapper.find('input');
        const errorComponent = wrapper.findComponent({name: 'FormError'});

        // Assert
        expect(errorComponent.props('message')).toBe('Must be a positive number');
        expect(input.attributes('aria-invalid')).toBe('true');
        expect(input.attributes('aria-describedby')).toBe(errorComponent.props('id'));
    });

    it('should be disabled when disabled prop is true', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Count', modelValue: null, disabled: true}});

        // Assert
        expect(wrapper.find('input').attributes('disabled')).toBeDefined();
    });

    it('should prioritize disabled state over error state', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {
            props: {label: 'Amount', modelValue: null, disabled: true, error: 'Invalid number'},
        });
        const input = wrapper.find('input');

        // Assert
        expect(input.classes()).toContain('brick-disabled');
        expect(input.classes()).not.toContain('bg-brick-red-light');
    });

    it('should render placeholder text', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {
            props: {label: 'Amount', modelValue: null, placeholder: 'Enter amount'},
        });

        // Assert
        expect(wrapper.find('input').attributes('placeholder')).toBe('Enter amount');
    });

    it('should render with min attribute', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Age', modelValue: null, min: 0}});

        // Assert
        expect(wrapper.find('input').attributes('min')).toBe('0');
    });

    it('should render with max attribute', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Age', modelValue: null, max: 120}});

        // Assert
        expect(wrapper.find('input').attributes('max')).toBe('120');
    });

    it('should render with step attribute', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Price', modelValue: null, step: 0.01}});

        // Assert
        expect(wrapper.find('input').attributes('step')).toBe('0.01');
    });

    it('should display initial numeric value', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Quantity', modelValue: 5}});

        // Assert
        expect(wrapper.find('input').element.value).toBe('5');
    });

    it('should wrap content in FormField', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Amount', modelValue: null}});

        // Assert
        expect(wrapper.findComponent({name: 'FormField'}).exists()).toBe(true);
    });

    it('should apply normal styling when not disabled and no error', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Amount', modelValue: null}});
        const input = wrapper.find('input');

        // Assert
        expect(input.classes()).toContain('bg-[var(--brick-card-bg)]');
    });

    it('should apply error styling when error is present', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Amount', modelValue: null, error: 'Invalid'}});
        const input = wrapper.find('input');

        // Assert
        expect(input.classes()).toContain('bg-brick-red-light');
        expect(wrapper.findComponent({name: 'FormError'}).props('message')).toBe('Invalid');
    });

    it('should not render FormError when no error', () => {
        // Arrange
        const wrapper = shallowMount(NumberInput, {props: {label: 'Amount', modelValue: null}});
        const input = wrapper.find('input');

        // Assert
        expect(wrapper.findComponent({name: 'FormError'}).exists()).toBe(false);
        expect(input.attributes('aria-invalid')).toBeUndefined();
        expect(input.attributes('aria-describedby')).toBeUndefined();
    });
});
