import FormError from '@shared/components/forms/FormError.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('FormError', () => {
    it('should render error message from prop', () => {
        // Arrange
        const wrapper = shallowMount(FormError, {props: {id: 'error-1', message: 'Invalid email address'}});

        // Assert
        expect(wrapper.find('p').text()).toBe('Invalid email address');
    });

    it('should have role alert for accessibility', () => {
        // Arrange
        const wrapper = shallowMount(FormError, {props: {id: 'error-1', message: 'Error'}});

        // Assert
        expect(wrapper.find('p').attributes('role')).toBe('alert');
    });

    it('should set id attribute', () => {
        // Arrange
        const wrapper = shallowMount(FormError, {props: {id: 'error-123', message: 'Error'}});

        // Assert
        expect(wrapper.find('p').attributes('id')).toBe('error-123');
    });
});
