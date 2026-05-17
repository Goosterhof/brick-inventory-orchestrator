import LegoBrickSideSvg from '@shared/components/LegoBrickSideSvg.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoBrickSideSvg', () => {
    it('should render a 4x2 brick by default with 4 studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg);

        // Assert — each stud is a <g> with 2 rects
        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(4);
        const studRects = wrapper.findAll('[data-stud]');
        expect(studRects).toHaveLength(4);
    });

    it('should render a 1x1 brick with 1 stud', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg, {props: {columns: 1, rows: 1}});

        // Assert
        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(1);
        const studRects = wrapper.findAll('[data-stud]');
        expect(studRects).toHaveLength(1);
    });

    it('should render a 2x2 brick with 2 studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg, {props: {columns: 2, rows: 2}});

        // Assert
        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(2);
    });

    it('should render a 3x1 brick with 3 studs', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg, {props: {columns: 3, rows: 1}});

        // Assert
        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(3);
    });

    it('should set role img and aria-label on the SVG element', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg, {props: {columns: 3, rows: 2}});

        // Assert
        const svg = wrapper.find('svg');
        expect(svg.attributes('role')).toBe('img');
        expect(svg.attributes('aria-label')).toBe('3 by 2 LEGO brick side view');
    });

    it('should render shadow rect by default', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg);

        // Assert
        const shadowRect = wrapper.find('[data-shadow]');
        expect(shadowRect.exists()).toBe(true);
    });

    it('should render shadow covering the full silhouette (studs + body)', () => {
        // Arrange — 2-column brick: bodyWidth = 2*10 + 2*40 = 100
        // studY = STROKE/2 = 1.5, shadow y = studY + SHADOW_OFFSET = 5.5
        // shadow height = STUD_HEIGHT + BODY_HEIGHT = 9 + 48 = 57
        const wrapper = shallowMount(LegoBrickSideSvg, {props: {columns: 2, rows: 1}});

        // Assert
        const shadowRect = wrapper.find('[data-shadow]');
        expect(shadowRect.attributes('y')).toBe('5.5');
        expect(shadowRect.attributes('height')).toBe('57');
        expect(shadowRect.attributes('width')).toBe('100');
    });

    it('should not render shadow rect when shadow is false', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg, {props: {shadow: false}});

        // Assert
        const shadowRect = wrapper.find('[data-shadow]');
        expect(shadowRect.exists()).toBe(false);
    });

    it('should apply custom color to body rect and stud rects', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg, {props: {color: '#0055BF', columns: 1, rows: 1}});

        // Assert
        const bodyRect = wrapper.find('[data-body]');
        expect(bodyRect.attributes('fill')).toBe('#0055BF');

        const studRect = wrapper.find('[data-stud]');
        expect(studRect.attributes('fill')).toBe('#0055BF');
    });

    it('should have stroke black and stroke-width 3 on the body rect', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg);

        // Assert
        const bodyRect = wrapper.find('[data-body]');
        expect(bodyRect.attributes('stroke')).toBe('black');
        expect(bodyRect.attributes('stroke-width')).toBe('3');
    });

    it('should include gradient defs with a unique ID', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg);

        // Assert
        const defs = wrapper.find('defs');
        expect(defs.exists()).toBe(true);
        const gradient = defs.find('linearGradient');
        expect(gradient.exists()).toBe(true);
        expect(gradient.attributes('id')).toBeTruthy();
    });

    it('should compute correct viewBox based on columns', () => {
        // Arrange — 2-column brick: bodyWidth = 2*10 + 2*40 = 100
        // viewBox height = 9 + 48 + 3 + 4 = 64, width = 100 + 3 + 4 = 107
        const wrapper = shallowMount(LegoBrickSideSvg, {props: {columns: 2, rows: 2}});

        // Assert
        const svg = wrapper.find('svg');
        expect(svg.attributes('viewBox')).toBe('0 0 107 64');
    });

    it('should apply default red color when no color prop is provided', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg);

        // Assert
        const bodyRect = wrapper.find('[data-body]');
        expect(bodyRect.attributes('fill')).toBe('#DC2626');
    });

    it('should render studs as rects with stroke', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickSideSvg, {props: {columns: 1, rows: 1}});

        // Assert
        const studRect = wrapper.find('[data-stud]');
        expect(studRect.attributes('stroke')).toBe('black');
        expect(studRect.attributes('stroke-width')).toBe('3');
    });

    it('should not change stud count based on rows prop', () => {
        // Arrange — rows only affects the aria-label, not the visual
        const twoRow = shallowMount(LegoBrickSideSvg, {props: {columns: 4, rows: 2}});
        const threeRow = shallowMount(LegoBrickSideSvg, {props: {columns: 4, rows: 3}});

        // Assert
        expect(twoRow.findAll('[data-stud]')).toHaveLength(4);
        expect(threeRow.findAll('[data-stud]')).toHaveLength(4);
    });
});
