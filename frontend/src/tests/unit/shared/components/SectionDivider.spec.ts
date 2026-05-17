import SectionDivider from '@shared/components/SectionDivider.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('SectionDivider', () => {
    it('should render an hr element', () => {
        // Arrange
        const wrapper = shallowMount(SectionDivider);

        // Assert
        expect(wrapper.find('hr').exists()).toBe(true);
    });

    it('should have 3px black top border styling', () => {
        // Arrange
        const wrapper = shallowMount(SectionDivider);

        // Assert
        expect(wrapper.find('hr').attributes('border')).toBe('t-3 [var(--brick-border-color)]');
    });
});
