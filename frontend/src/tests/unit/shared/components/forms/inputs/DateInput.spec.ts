import DateInput from '@shared/components/forms/inputs/DateInput.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';

const {createMockFormError, createMockFormField, createMockFormLabel} = await vi.hoisted(
    () => import('../../../../../helpers'),
);

vi.mock('@shared/components/forms/FormError.vue', () => createMockFormError());
vi.mock('@shared/components/forms/FormField.vue', () => createMockFormField());
vi.mock('@shared/components/forms/FormLabel.vue', () => createMockFormLabel());

describe('DateInput', () => {
    it('should render label and date input', () => {
        // Arrange
        const wrapper = shallowMount(DateInput, {props: {label: 'Date', modelValue: ''}});

        // Assert
        const label = wrapper.findComponent({name: 'FormLabel'});
        expect(label.text()).toContain('Date');
        expect(wrapper.find('input').exists()).toBe(true);
        expect(wrapper.find('input').attributes('type')).toBe('date');
    });

    it('should associate label with input via id', () => {
        // Arrange
        const wrapper = shallowMount(DateInput, {props: {label: 'Date', modelValue: ''}});
        const input = wrapper.find('input');
        const label = wrapper.findComponent({name: 'FormLabel'});

        // Assert
        expect(input.attributes('id')).toBeTruthy();
        expect(label.props('for')).toBe(input.attributes('id'));
    });

    it('should emit update:modelValue on input', async () => {
        // Arrange
        const wrapper = shallowMount(DateInput, {props: {label: 'Date', modelValue: ''}});

        // Act
        await wrapper.find('input').setValue('2024-01-15');

        // Assert
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0]).toStrictEqual(['2024-01-15']);
    });

    it('should be required by default', () => {
        // Arrange
        const wrapper = shallowMount(DateInput, {props: {label: 'Date', modelValue: ''}});

        // Assert
        expect(wrapper.findComponent({name: 'FormLabel'}).props('optional')).toBe(false);
        expect(wrapper.find('input').attributes('required')).toBeDefined();
    });

    it('should show optional indicator when optional', () => {
        // Arrange
        const wrapper = shallowMount(DateInput, {props: {label: 'Date', modelValue: '', optional: true}});

        // Assert
        expect(wrapper.findComponent({name: 'FormLabel'}).props('optional')).toBe(true);
        expect(wrapper.find('input').attributes('required')).toBeUndefined();
    });

    it('should display error message and set aria-invalid', () => {
        // Arrange
        const wrapper = shallowMount(DateInput, {props: {label: 'Date', modelValue: '', error: 'Invalid date'}});

        // Assert
        expect(wrapper.findComponent({name: 'FormError'}).props('message')).toBe('Invalid date');
        expect(wrapper.find('input').attributes('aria-invalid')).toBe('true');
    });

    it('should wrap content in FormField', () => {
        // Arrange
        const wrapper = shallowMount(DateInput, {props: {label: 'Date', modelValue: ''}});

        // Assert
        expect(wrapper.findComponent({name: 'FormField'}).exists()).toBe(true);
    });

    it('should apply error styling when error is present', () => {
        // Arrange
        const wrapper = shallowMount(DateInput, {props: {label: 'Date', modelValue: '', error: 'Invalid'}});

        // Assert
        expect(wrapper.find('input').classes()).toContain('bg-brick-red-light');
    });

    it('should prioritize disabled state over error state', () => {
        // Arrange
        const wrapper = shallowMount(DateInput, {
            props: {label: 'Date', modelValue: '', disabled: true, error: 'Invalid'},
        });

        // Assert
        expect(wrapper.find('input').classes()).toContain('brick-disabled');
        expect(wrapper.find('input').classes()).not.toContain('bg-brick-red-light');
    });
});
