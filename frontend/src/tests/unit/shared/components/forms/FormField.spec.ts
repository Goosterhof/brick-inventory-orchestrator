import FormField from '@shared/components/forms/FormField.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('FormField', () => {
    it('should render slot content', () => {
        // Arrange
        const wrapper = shallowMount(FormField, {slots: {default: '<span>Field content</span>'}});

        // Assert
        expect(wrapper.find('span').text()).toBe('Field content');
    });

    it('should render as a flex column container', () => {
        // Arrange
        const wrapper = shallowMount(FormField);

        // Assert
        expect(wrapper.find('div').attributes('flex')).toBe('~ col');
    });

    it('should have gap between children', () => {
        // Arrange
        const wrapper = shallowMount(FormField);

        // Assert
        expect(wrapper.find('div').attributes('gap')).toBe('2');
    });
});
