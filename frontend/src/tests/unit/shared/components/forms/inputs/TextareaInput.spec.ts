import TextareaInput from '@shared/components/forms/inputs/TextareaInput.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';

const {createMockFormError, createMockFormField, createMockFormLabel} = await vi.hoisted(
    () => import('../../../../../helpers'),
);

vi.mock('@shared/components/forms/FormError.vue', () => createMockFormError());
vi.mock('@shared/components/forms/FormField.vue', () => createMockFormField());
vi.mock('@shared/components/forms/FormLabel.vue', () => createMockFormLabel());

describe('TextareaInput', () => {
    it('should render label and textarea', () => {
        // Arrange
        const wrapper = shallowMount(TextareaInput, {props: {label: 'Description', modelValue: ''}});

        // Assert
        const label = wrapper.findComponent({name: 'FormLabel'});
        expect(label.text()).toContain('Description');
        expect(wrapper.find('textarea').exists()).toBe(true);
    });

    it('should associate label with textarea via id', () => {
        // Arrange
        const wrapper = shallowMount(TextareaInput, {props: {label: 'Notes', modelValue: ''}});
        const textarea = wrapper.find('textarea');
        const label = wrapper.findComponent({name: 'FormLabel'});

        // Assert
        expect(textarea.attributes('id')).toBeTruthy();
        expect(label.props('for')).toBe(textarea.attributes('id'));
    });

    it('should emit update:modelValue on input', async () => {
        // Arrange
        const wrapper = shallowMount(TextareaInput, {props: {label: 'Notes', modelValue: ''}});

        // Act
        await wrapper.find('textarea').setValue('Hello world');

        // Assert
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0]).toStrictEqual(['Hello world']);
    });

    it('should be required by default', () => {
        // Arrange
        const wrapper = shallowMount(TextareaInput, {props: {label: 'Notes', modelValue: ''}});

        // Assert
        expect(wrapper.findComponent({name: 'FormLabel'}).props('optional')).toBe(false);
        expect(wrapper.find('textarea').attributes('required')).toBeDefined();
    });

    it('should show optional indicator when optional', () => {
        // Arrange
        const wrapper = shallowMount(TextareaInput, {props: {label: 'Notes', modelValue: '', optional: true}});

        // Assert
        expect(wrapper.findComponent({name: 'FormLabel'}).props('optional')).toBe(true);
        expect(wrapper.find('textarea').attributes('required')).toBeUndefined();
    });

    it('should display error message and set aria-invalid', () => {
        // Arrange
        const wrapper = shallowMount(TextareaInput, {props: {label: 'Notes', modelValue: '', error: 'Too long'}});

        // Assert
        expect(wrapper.findComponent({name: 'FormError'}).props('message')).toBe('Too long');
        expect(wrapper.find('textarea').attributes('aria-invalid')).toBe('true');
    });

    it('should be disabled when disabled prop is true', () => {
        // Arrange
        const wrapper = shallowMount(TextareaInput, {props: {label: 'Notes', modelValue: '', disabled: true}});

        // Assert
        expect(wrapper.find('textarea').attributes('disabled')).toBeDefined();
    });

    it('should wrap content in FormField', () => {
        // Arrange
        const wrapper = shallowMount(TextareaInput, {props: {label: 'Notes', modelValue: ''}});

        // Assert
        expect(wrapper.findComponent({name: 'FormField'}).exists()).toBe(true);
    });

    it('should default rows to 3', () => {
        // Arrange
        const wrapper = shallowMount(TextareaInput, {props: {label: 'Notes', modelValue: ''}});

        // Assert
        expect(wrapper.find('textarea').attributes('rows')).toBe('3');
    });

    it('should apply error styling when error is present', () => {
        // Arrange
        const wrapper = shallowMount(TextareaInput, {props: {label: 'Notes', modelValue: '', error: 'Invalid'}});

        // Assert
        expect(wrapper.find('textarea').classes()).toContain('bg-brick-red-light');
    });

    it('should prioritize disabled state over error state', () => {
        // Arrange
        const wrapper = shallowMount(TextareaInput, {
            props: {label: 'Notes', modelValue: '', disabled: true, error: 'Invalid'},
        });

        // Assert
        expect(wrapper.find('textarea').classes()).toContain('brick-disabled');
        expect(wrapper.find('textarea').classes()).not.toContain('bg-brick-red-light');
    });
});
