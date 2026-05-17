import DetailRow from '@shared/components/DetailRow.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('DetailRow', () => {
    describe('rendering', () => {
        it('should render label with colon', () => {
            // Arrange & Act
            const wrapper = shallowMount(DetailRow, {props: {label: 'Color'}, slots: {default: 'Red'}});

            // Assert
            expect(wrapper.find('span:first-child').text()).toBe('Color:');
        });

        it('should render slot content as value', () => {
            // Arrange & Act
            const wrapper = shallowMount(DetailRow, {props: {label: 'Size'}, slots: {default: '2x4'}});

            // Assert
            expect(wrapper.text()).toContain('2x4');
        });
    });

    describe('styling', () => {
        it('should have flex layout with gap', () => {
            // Arrange & Act
            const wrapper = shallowMount(DetailRow, {props: {label: 'Name'}, slots: {default: 'Brick'}});

            // Assert
            expect(wrapper.attributes('flex')).toBeDefined();
            expect(wrapper.attributes('gap')).toBe('2');
        });

        it('should render label in bold', () => {
            // Arrange & Act
            const wrapper = shallowMount(DetailRow, {props: {label: 'Name'}, slots: {default: 'Brick'}});

            // Assert
            expect(wrapper.find('span:first-child').attributes('font')).toBe('bold');
        });
    });
});
