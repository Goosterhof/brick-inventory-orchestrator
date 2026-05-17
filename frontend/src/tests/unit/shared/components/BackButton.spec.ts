import BackButton from '@shared/components/BackButton.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('BackButton', () => {
    it('should render slot content', () => {
        // Arrange
        const wrapper = shallowMount(BackButton, {slots: {default: 'Go back'}});

        // Assert
        expect(wrapper.text()).toBe('Go back');
    });

    it('should emit click event when clicked', async () => {
        // Arrange
        const wrapper = shallowMount(BackButton, {slots: {default: 'Back'}});

        // Act
        await wrapper.trigger('click');

        // Assert
        expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('should have neo-brutalist styling', () => {
        // Arrange
        const wrapper = shallowMount(BackButton, {slots: {default: 'Back'}});

        // Assert
        expect(wrapper.attributes('class')).toContain('brick-border');
        expect(wrapper.attributes('class')).toContain('brick-shadow');
        expect(wrapper.attributes('bg')).toBe('[var(--brick-card-bg)] hover:brick-yellow focus:brick-yellow');
    });
});
