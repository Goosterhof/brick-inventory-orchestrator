import BadgeLabel from '@shared/components/BadgeLabel.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('BadgeLabel', () => {
    describe('rendering', () => {
        it('should render slot content', () => {
            // Arrange & Act
            const wrapper = shallowMount(BadgeLabel, {slots: {default: 'Sealed'}});

            // Assert
            expect(wrapper.text()).toBe('Sealed');
        });
    });

    describe('styling', () => {
        it('should have default card-surface background', () => {
            // Arrange & Act
            const wrapper = shallowMount(BadgeLabel, {slots: {default: 'Status'}});

            // Assert
            expect(wrapper.attributes('bg')).toBe('[var(--brick-card-bg)]');
        });

        it('should have yellow background when highlight variant', () => {
            // Arrange & Act
            const wrapper = shallowMount(BadgeLabel, {props: {variant: 'highlight'}, slots: {default: 'Active'}});

            // Assert
            expect(wrapper.attributes('bg')).toBe('brick-yellow');
        });

        it('should have compact padding and bold text', () => {
            // Arrange & Act
            const wrapper = shallowMount(BadgeLabel, {slots: {default: 'Tag'}});

            // Assert
            expect(wrapper.attributes('text')).toBe('xs');
            expect(wrapper.attributes('p')).toBe('x-2 y-1');
            expect(wrapper.attributes('font')).toBe('bold');
        });

        it('should have thin brick border', () => {
            // Arrange & Act
            const wrapper = shallowMount(BadgeLabel, {slots: {default: 'Tag'}});

            // Assert
            expect(wrapper.attributes('class')).toContain('brick-border');
            expect(wrapper.attributes('border')).toBe('1');
        });

        it('should have dashed border and subtle-surface background when muted variant', () => {
            // Arrange & Act
            const wrapper = shallowMount(BadgeLabel, {props: {variant: 'muted'}, slots: {default: 'Wishlist'}});

            // Assert
            expect(wrapper.attributes('bg')).toBe('[var(--brick-surface-subtle)]');
            expect(wrapper.attributes('border')).toBe('1 black dashed');
            expect(wrapper.attributes('class')).not.toContain('brick-border');
        });
    });
});
