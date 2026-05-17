import LoadingState from '@shared/components/LoadingState.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LoadingState', () => {
    describe('rendering', () => {
        it('should render default loading message', () => {
            // Arrange
            const wrapper = shallowMount(LoadingState);

            // Assert
            expect(wrapper.text()).toBe('Loading...');
        });

        it('should render custom message', () => {
            // Arrange
            const wrapper = shallowMount(LoadingState, {props: {message: 'Fetching bricks...'}});

            // Assert
            expect(wrapper.text()).toBe('Fetching bricks...');
        });
    });

    describe('accessibility', () => {
        it('should have status role', () => {
            // Arrange
            const wrapper = shallowMount(LoadingState);

            // Assert
            expect(wrapper.attributes('role')).toBe('status');
        });
    });

    describe('styling', () => {
        it('should render three animated brick indicators', () => {
            // Arrange
            const wrapper = shallowMount(LoadingState);
            const bricks = wrapper.findAll('div.animate-bounce');

            // Assert
            expect(bricks).toHaveLength(3);
        });

        it('should have staggered animation delays', () => {
            // Arrange
            const wrapper = shallowMount(LoadingState);
            const bricks = wrapper.findAll('div.animate-bounce');

            // Assert
            expect(bricks[0]?.attributes('style')).toContain('animation-delay: 0ms');
            expect(bricks[1]?.attributes('style')).toContain('animation-delay: 150ms');
            expect(bricks[2]?.attributes('style')).toContain('animation-delay: 300ms');
        });
    });
});
