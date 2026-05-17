import CardContainer from '@shared/components/CardContainer.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('CardContainer', () => {
    it('should render slot content', () => {
        // Arrange
        const wrapper = shallowMount(CardContainer, {slots: {default: '<p>Card content</p>'}});

        // Assert
        expect(wrapper.text()).toBe('Card content');
    });

    it('should have brick brutalist styling', () => {
        // Arrange
        const wrapper = shallowMount(CardContainer);

        // Assert
        expect(wrapper.attributes('class')).toContain('brick-border');
        expect(wrapper.attributes('class')).toContain('brick-shadow');
        expect(wrapper.attributes('bg')).toBe('[var(--brick-card-bg)]');
    });
});
