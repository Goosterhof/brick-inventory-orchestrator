import LegoBrick from '@shared/components/LegoBrick.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoBrick', () => {
    it('should render a 4x2 brick by default with 8 studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick);

        // Assert
        const studs = wrapper.findAll("[rounded='full']");
        expect(studs).toHaveLength(8);
    });

    it('should render a 1x1 brick with 1 stud', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick, {props: {columns: 1, rows: 1}});

        // Assert
        const studs = wrapper.findAll("[rounded='full']");
        expect(studs).toHaveLength(1);
    });

    it('should render a 2x2 brick with 4 studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick, {props: {columns: 2, rows: 2}});

        // Assert
        const studs = wrapper.findAll("[rounded='full']");
        expect(studs).toHaveLength(4);
    });

    it('should render a 1x3 brick with 3 studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick, {props: {columns: 1, rows: 3}});

        // Assert
        const studs = wrapper.findAll("[rounded='full']");
        expect(studs).toHaveLength(3);
    });

    it('should render a 2x3 brick with 6 studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick, {props: {columns: 2, rows: 3}});

        // Assert
        const studs = wrapper.findAll("[rounded='full']");
        expect(studs).toHaveLength(6);
    });

    it('should set grid-template-columns based on columns prop', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick, {props: {columns: 3, rows: 2}});

        // Assert
        const container = wrapper.find('[inline-grid]');
        expect(container.attributes('style')).toContain('grid-template-columns: repeat(3, 1fr)');
    });

    it('should apply default red color', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick);

        // Assert
        const container = wrapper.find('[inline-grid]');
        expect(container.attributes('style')).toContain('background-color');
    });

    it('should apply custom color to container and studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick, {props: {color: '#1D4ED8'}});

        // Assert
        const container = wrapper.find('[inline-grid]');
        expect(container.attributes('style')).toContain('background-color');
        const stud = wrapper.find("[rounded='full']");
        expect(stud.attributes('style')).toContain('background-color');
    });

    it('should show shadow by default', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick);

        // Assert
        const container = wrapper.find('[inline-grid]');
        expect(container.classes()).toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should hide shadow when shadow prop is false', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick, {props: {shadow: false}});

        // Assert
        const container = wrapper.find('[inline-grid]');
        expect(container.classes()).not.toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should have brick brutalist border styling', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick);

        // Assert
        const container = wrapper.find('[inline-grid]');
        expect(container.attributes('border')).toBe('3 black');
    });

    it('should apply stud styling with rounded-full and border', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrick, {props: {columns: 1, rows: 1}});

        // Assert
        const stud = wrapper.find("[rounded='full']");
        expect(stud.attributes('border')).toBe('3 black');
        expect(stud.attributes('w')).toBe('6');
        expect(stud.attributes('h')).toBe('6');
        expect(stud.attributes('m')).toBe('2');
    });
});
