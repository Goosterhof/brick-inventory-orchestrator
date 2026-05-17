import EmptyState from '@shared/components/EmptyState.vue';
import LegoBrick from '@shared/components/LegoBrick.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('EmptyState', () => {
    it('should render message', () => {
        // Arrange
        const wrapper = shallowMount(EmptyState, {props: {message: 'No items found'}});

        // Assert
        expect(wrapper.text()).toBe('No items found');
    });

    it('should have muted text styling', () => {
        // Arrange
        const wrapper = shallowMount(EmptyState, {props: {message: 'Empty'}});

        // Assert
        expect(wrapper.find('p').attributes('text')).toBe('[var(--brick-muted-text)]');
    });

    it('should not show LegoBrick by default', () => {
        // Arrange
        const wrapper = shallowMount(EmptyState, {props: {message: 'Empty'}});

        // Assert
        expect(wrapper.findComponent(LegoBrick).exists()).toBe(false);
    });

    it('should show LegoBrick when showBrick is true', () => {
        // Arrange
        const wrapper = shallowMount(EmptyState, {props: {message: 'Empty', showBrick: true}});

        // Assert
        const brick = wrapper.findComponent(LegoBrick);
        expect(brick.exists()).toBe(true);
        expect(brick.props('shadow')).toBe(false);
        expect(brick.props('columns')).toBe(4);
        expect(brick.props('rows')).toBe(2);
    });

    it('should use default brick color when not specified', () => {
        // Arrange
        const wrapper = shallowMount(EmptyState, {props: {message: 'Empty', showBrick: true}});

        // Assert
        expect(wrapper.findComponent(LegoBrick).props('color')).toBe('#F5C518');
    });

    it('should use custom brick color when specified', () => {
        // Arrange
        const wrapper = shallowMount(EmptyState, {props: {message: 'Empty', showBrick: true, brickColor: '#C41A16'}});

        // Assert
        expect(wrapper.findComponent(LegoBrick).props('color')).toBe('#C41A16');
    });

    it('should render slot content', () => {
        // Arrange
        const wrapper = shallowMount(EmptyState, {
            props: {message: 'Empty'},
            slots: {default: '<button>Add item</button>'},
        });

        // Assert
        expect(wrapper.text()).toContain('Add item');
    });

    it('should have stud grid background', () => {
        // Arrange
        const wrapper = shallowMount(EmptyState, {props: {message: 'Empty'}});

        // Assert
        expect(wrapper.attributes('class')).toContain('brick-stud-grid');
    });

    it('should center content', () => {
        // Arrange
        const wrapper = shallowMount(EmptyState, {props: {message: 'Empty'}});

        // Assert
        expect(wrapper.attributes('items')).toBe('center');
        expect(wrapper.attributes('text-center')).toBeDefined();
    });
});
