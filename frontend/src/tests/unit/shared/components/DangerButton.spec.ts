import DangerButton from '@shared/components/DangerButton.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('DangerButton', () => {
    it('should render slot content', () => {
        // Arrange
        const wrapper = shallowMount(DangerButton, {slots: {default: 'Delete'}});

        // Assert
        expect(wrapper.text()).toBe('Delete');
    });

    it('should default type to button', () => {
        // Arrange
        const wrapper = shallowMount(DangerButton, {slots: {default: 'Delete'}});

        // Assert
        expect(wrapper.attributes('type')).toBe('button');
    });

    it('should accept submit type', () => {
        // Arrange
        const wrapper = shallowMount(DangerButton, {props: {type: 'submit'}, slots: {default: 'Submit'}});

        // Assert
        expect(wrapper.attributes('type')).toBe('submit');
    });

    it('should not be disabled by default', () => {
        // Arrange
        const wrapper = shallowMount(DangerButton, {slots: {default: 'Delete'}});

        // Assert
        expect(wrapper.attributes('disabled')).toBeUndefined();
    });

    it('should be disabled when prop is set', () => {
        // Arrange
        const wrapper = shallowMount(DangerButton, {props: {disabled: true}, slots: {default: 'Delete'}});

        // Assert
        expect(wrapper.attributes('disabled')).toBeDefined();
    });

    it('should have danger styling', () => {
        // Arrange
        const wrapper = shallowMount(DangerButton, {slots: {default: 'Delete'}});

        // Assert
        expect(wrapper.attributes('class')).toContain('brick-shadow-danger');
        expect(wrapper.attributes('border')).toBe('3 brick-red');
        expect(wrapper.attributes('bg')).toBe(
            '[var(--brick-card-bg)] hover:brick-red-light focus:brick-red-light disabled:[var(--brick-surface-subtle)]',
        );
        expect(wrapper.attributes('text')).toBe('[var(--brick-danger-text)] disabled:[var(--brick-muted-text)]');
        expect(wrapper.attributes('font')).toBe('bold');
        expect(wrapper.attributes('uppercase')).toBeDefined();
    });
});
