import SelectInput from '@shared/components/forms/inputs/SelectInput.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';

const {createMockFormError, createMockFormField, createMockFormLabel} = await vi.hoisted(
    () => import('../../../../../helpers'),
);

vi.mock('@shared/components/forms/FormError.vue', () => createMockFormError());
vi.mock('@shared/components/forms/FormField.vue', () => createMockFormField());
vi.mock('@shared/components/forms/FormLabel.vue', () => createMockFormLabel());

describe('SelectInput', () => {
    const defaultSlot = '<option value="a">A</option><option value="b">B</option>';

    it('should render label and select', () => {
        // Arrange
        const wrapper = shallowMount(SelectInput, {
            props: {label: 'Status', modelValue: 'a'},
            slots: {default: defaultSlot},
        });

        // Assert
        const label = wrapper.findComponent({name: 'FormLabel'});
        expect(label.text()).toContain('Status');
        expect(wrapper.find('select').exists()).toBe(true);
    });

    it('should associate label with select via id', () => {
        // Arrange
        const wrapper = shallowMount(SelectInput, {
            props: {label: 'Status', modelValue: 'a'},
            slots: {default: defaultSlot},
        });
        const select = wrapper.find('select');
        const label = wrapper.findComponent({name: 'FormLabel'});

        // Assert
        expect(select.attributes('id')).toBeTruthy();
        expect(label.props('for')).toBe(select.attributes('id'));
    });

    it('should emit update:modelValue on change', async () => {
        // Arrange
        const wrapper = shallowMount(SelectInput, {
            props: {label: 'Status', modelValue: 'a'},
            slots: {default: defaultSlot},
        });

        // Act
        await wrapper.find('select').setValue('b');

        // Assert
        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted?.[0]).toStrictEqual(['b']);
    });

    it('should be required by default', () => {
        // Arrange
        const wrapper = shallowMount(SelectInput, {
            props: {label: 'Status', modelValue: 'a'},
            slots: {default: defaultSlot},
        });

        // Assert
        expect(wrapper.findComponent({name: 'FormLabel'}).props('optional')).toBe(false);
        expect(wrapper.find('select').attributes('required')).toBeDefined();
    });

    it('should show optional indicator when optional', () => {
        // Arrange
        const wrapper = shallowMount(SelectInput, {
            props: {label: 'Status', modelValue: 'a', optional: true},
            slots: {default: defaultSlot},
        });

        // Assert
        expect(wrapper.findComponent({name: 'FormLabel'}).props('optional')).toBe(true);
    });

    it('should display error message and set aria-invalid', () => {
        // Arrange
        const wrapper = shallowMount(SelectInput, {
            props: {label: 'Status', modelValue: 'a', error: 'Required'},
            slots: {default: defaultSlot},
        });

        // Assert
        expect(wrapper.findComponent({name: 'FormError'}).props('message')).toBe('Required');
        expect(wrapper.find('select').attributes('aria-invalid')).toBe('true');
    });

    it('should wrap content in FormField', () => {
        // Arrange
        const wrapper = shallowMount(SelectInput, {
            props: {label: 'Status', modelValue: 'a'},
            slots: {default: defaultSlot},
        });

        // Assert
        expect(wrapper.findComponent({name: 'FormField'}).exists()).toBe(true);
    });

    it('should apply error styling when error is present', () => {
        // Arrange
        const wrapper = shallowMount(SelectInput, {
            props: {label: 'Status', modelValue: 'a', error: 'Invalid'},
            slots: {default: defaultSlot},
        });

        // Assert
        expect(wrapper.find('select').classes()).toContain('bg-brick-red-light');
    });

    it('should prioritize disabled state over error state', () => {
        // Arrange
        const wrapper = shallowMount(SelectInput, {
            props: {label: 'Status', modelValue: 'a', disabled: true, error: 'Invalid'},
            slots: {default: defaultSlot},
        });

        // Assert
        expect(wrapper.find('select').classes()).toContain('brick-disabled');
        expect(wrapper.find('select').classes()).not.toContain('bg-brick-red-light');
    });
});
