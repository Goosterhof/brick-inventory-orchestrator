import FilterChip from '@shared/components/FilterChip.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('FilterChip', () => {
    describe('rendering', () => {
        it('should render slot content', () => {
            // Arrange & Act
            const wrapper = shallowMount(FilterChip, {slots: {default: 'Sealed'}});

            // Assert
            expect(wrapper.text()).toBe('Sealed');
        });
    });

    describe('interactions', () => {
        it('should emit click on press', async () => {
            // Arrange
            const wrapper = shallowMount(FilterChip, {slots: {default: 'Built'}});

            // Act
            await wrapper.trigger('click');

            // Assert
            expect(wrapper.emitted('click')).toBeTruthy();
        });
    });

    describe('styling', () => {
        it('should have brick border and transition', () => {
            // Arrange & Act
            const wrapper = shallowMount(FilterChip, {slots: {default: 'Filter'}});

            // Assert
            expect(wrapper.attributes('class')).toContain('brick-border');
            expect(wrapper.attributes('class')).toContain('brick-transition');
        });

        it('should show default background when not active', () => {
            // Arrange & Act
            const wrapper = shallowMount(FilterChip, {slots: {default: 'Filter'}});

            // Assert
            expect(wrapper.attributes('bg')).toBe('[var(--brick-card-bg)] hover:yellow-100');
        });

        it('should show yellow background when active', () => {
            // Arrange & Act
            const wrapper = shallowMount(FilterChip, {props: {active: true}, slots: {default: 'Filter'}});

            // Assert
            expect(wrapper.attributes('bg')).toBe('yellow-300');
        });

        it('should be a button element', () => {
            // Arrange & Act
            const wrapper = shallowMount(FilterChip, {slots: {default: 'Filter'}});
            const element = wrapper.element as HTMLButtonElement;

            // Assert
            expect(element.tagName).toBe('BUTTON');
            expect(wrapper.attributes('type')).toBe('button');
        });
    });
});
