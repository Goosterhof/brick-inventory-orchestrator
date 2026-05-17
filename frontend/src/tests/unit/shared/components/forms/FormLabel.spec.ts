import FormLabel from '@shared/components/forms/FormLabel.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('FormLabel', () => {
    it('should render label with slot content', () => {
        // Arrange
        const wrapper = shallowMount(FormLabel, {
            props: {for: 'input-1', optional: false},
            slots: {default: 'Username'},
        });

        // Assert
        expect(wrapper.find('label').text()).toContain('Username');
    });

    it('should set for attribute', () => {
        // Arrange
        const wrapper = shallowMount(FormLabel, {
            props: {for: 'input-123', optional: false},
            slots: {default: 'Email'},
        });

        // Assert
        expect(wrapper.find('label').attributes('for')).toBe('input-123');
    });

    it('should show optional indicator when optional', () => {
        // Arrange
        const wrapper = shallowMount(FormLabel, {props: {for: 'input-1', optional: true}, slots: {default: 'Email'}});

        // Assert
        expect(wrapper.find('label').text()).toContain('(optional)');
    });

    it('should not show optional indicator when not optional', () => {
        // Arrange
        const wrapper = shallowMount(FormLabel, {props: {for: 'input-1', optional: false}, slots: {default: 'Email'}});

        // Assert
        expect(wrapper.find('label').text()).not.toContain('(optional)');
        expect(wrapper.find('span').exists()).toBe(false);
    });
});
