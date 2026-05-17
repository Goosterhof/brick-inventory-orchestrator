import StatCard from '@shared/components/StatCard.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('StatCard', () => {
    describe('rendering', () => {
        it('should render label', () => {
            // Arrange & Act
            const wrapper = shallowMount(StatCard, {props: {label: 'Total Sets', value: '42'}});

            // Assert
            expect(wrapper.text()).toContain('Total Sets');
        });

        it('should render value', () => {
            // Arrange & Act
            const wrapper = shallowMount(StatCard, {props: {label: 'Total Sets', value: '42'}});

            // Assert
            expect(wrapper.text()).toContain('42');
        });

        it('should render slot content for description', () => {
            // Arrange & Act
            const wrapper = shallowMount(StatCard, {
                props: {label: 'Parts', value: '150'},
                slots: {default: '<p>Including spares</p>'},
            });

            // Assert
            expect(wrapper.text()).toContain('Including spares');
        });
    });

    describe('styling', () => {
        it('should have brick brutalism styling', () => {
            // Arrange & Act
            const wrapper = shallowMount(StatCard, {props: {label: 'Sets', value: '10'}});

            // Assert
            expect(wrapper.attributes('class')).toContain('brick-border');
            expect(wrapper.attributes('class')).toContain('brick-shadow');
            expect(wrapper.attributes('bg')).toBe('[var(--brick-card-bg)]');
        });

        it('should render label as uppercase bold', () => {
            // Arrange & Act
            const wrapper = shallowMount(StatCard, {props: {label: 'Sets', value: '10'}});
            const label = wrapper.find('p:first-child');

            // Assert
            expect(label.attributes('font')).toBe('bold');
            expect(label.attributes('uppercase')).toBeDefined();
            expect(label.attributes('tracking')).toBe('wide');
        });

        it('should render value in large bold text', () => {
            // Arrange & Act
            const wrapper = shallowMount(StatCard, {props: {label: 'Sets', value: '10'}});
            const allParagraphs = wrapper.findAll('p');
            const value = allParagraphs[1];

            // Assert
            expect(value?.attributes('text')).toBe('3xl');
            expect(value?.attributes('font')).toBe('bold');
        });
    });
});
