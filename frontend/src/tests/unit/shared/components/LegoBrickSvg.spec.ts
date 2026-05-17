import LegoBrickSvg from '@shared/components/LegoBrickSvg.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoBrickSvg', () => {
    it('should render a 4x2 brick by default with 8 studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg);

        // Assert — each stud is a <g> with 2 circles
        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(8);
        const circles = wrapper.findAll('circle');
        expect(circles).toHaveLength(16);
    });

    it('should render a 1x1 brick with 1 stud', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg, {props: {columns: 1, rows: 1}});

        // Assert
        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(1);
        const circles = wrapper.findAll('circle');
        expect(circles).toHaveLength(2);
    });

    it('should render a 2x2 brick with 4 studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg, {props: {columns: 2, rows: 2}});

        // Assert
        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(4);
        const circles = wrapper.findAll('circle');
        expect(circles).toHaveLength(8);
    });

    it('should render a 1x3 brick with 3 studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg, {props: {columns: 1, rows: 3}});

        // Assert
        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(3);
    });

    it('should render a 2x3 brick with 6 studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg, {props: {columns: 2, rows: 3}});

        // Assert
        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(6);
    });

    it('should set role img and aria-label on the SVG element', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg, {props: {columns: 3, rows: 2}});

        // Assert
        const svg = wrapper.find('svg');
        expect(svg.attributes('role')).toBe('img');
        expect(svg.attributes('aria-label')).toBe('3 by 2 LEGO brick');
    });

    it('should render shadow rect by default', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg);

        // Assert
        const shadowRect = wrapper.find('[data-shadow]');
        expect(shadowRect.exists()).toBe(true);
    });

    it('should not render shadow rect when shadow is false', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg, {props: {shadow: false}});

        // Assert
        const shadowRect = wrapper.find('[data-shadow]');
        expect(shadowRect.exists()).toBe(false);
    });

    it('should apply custom color to body rect and stud circles', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg, {props: {color: '#0055BF', columns: 1, rows: 1}});

        // Assert
        const bodyRect = wrapper.find('[data-body]');
        expect(bodyRect.attributes('fill')).toBe('#0055BF');

        // The first circle in each stud group has the brick color
        const circles = wrapper.findAll('circle');
        const baseCircle = circles.find((c) => c.attributes('stroke') === 'black');
        expect(baseCircle?.attributes('fill')).toBe('#0055BF');
    });

    it('should have stroke black and stroke-width 3 on the body rect', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg);

        // Assert
        const bodyRect = wrapper.find('[data-body]');
        expect(bodyRect.attributes('stroke')).toBe('black');
        expect(bodyRect.attributes('stroke-width')).toBe('3');
    });

    it('should include gradient defs with a unique ID', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg);

        // Assert
        const defs = wrapper.find('defs');
        expect(defs.exists()).toBe(true);
        const gradient = defs.find('radialGradient');
        expect(gradient.exists()).toBe(true);
        expect(gradient.attributes('id')).toBeTruthy();
    });

    it('should compute correct viewBox based on columns and rows', () => {
        // Arrange — 2x2 brick: bodyWidth = 2*10 + 2*40 = 100, bodyHeight = 2*10 + 2*40 = 100
        // viewBox = "0 0 107 107" (100 + 3 + 4)
        const wrapper = shallowMount(LegoBrickSvg, {props: {columns: 2, rows: 2}});

        // Assert
        const svg = wrapper.find('svg');
        expect(svg.attributes('viewBox')).toBe('0 0 107 107');
    });

    it('should apply default red color when no color prop is provided', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSvg);

        // Assert
        const bodyRect = wrapper.find('[data-body]');
        expect(bodyRect.attributes('fill')).toBe('#DC2626');
    });
});
