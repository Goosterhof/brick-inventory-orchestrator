import LegoBrickIsometricSvg from '@shared/components/LegoBrickIsometricSvg.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoBrickIsometricSvg', () => {
    it('should render a 6x2 brick with 12 studs by default', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickIsometricSvg);

        // Assert — 6x2 footprint is fixed
        const studs = wrapper.findAll('[data-stud]');
        expect(studs).toHaveLength(12);
    });

    it('should render the three visible isometric faces (top, front, right)', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickIsometricSvg);

        // Assert
        expect(wrapper.find('[data-face="top"]').exists()).toBe(true);
        expect(wrapper.find('[data-face="front"]').exists()).toBe(true);
        expect(wrapper.find('[data-face="right"]').exists()).toBe(true);
    });

    it('should not render hidden faces (back, left, bottom)', () => {
        // Arrange — isometric 3-visible-face projection by design
        const wrapper = shallowMount(LegoBrickIsometricSvg);

        // Assert
        expect(wrapper.find('[data-face="back"]').exists()).toBe(false);
        expect(wrapper.find('[data-face="left"]').exists()).toBe(false);
        expect(wrapper.find('[data-face="bottom"]').exists()).toBe(false);
    });

    it('should set role img and descriptive aria-label on the svg', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickIsometricSvg);

        // Assert
        const svg = wrapper.find('svg');
        expect(svg.attributes('role')).toBe('img');
        expect(svg.attributes('aria-label')).toBe('6 by 2 LEGO brick in SVG isometric projection');
    });

    it('should render shadow path by default', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickIsometricSvg);

        // Assert
        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(true);
        expect(shadow.attributes('fill')).toBe('black');
    });

    it('should not render shadow path when shadow prop is false', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickIsometricSvg, {props: {shadow: false}});

        // Assert
        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(false);
    });

    it('should apply custom color to all three faces', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickIsometricSvg, {props: {color: '#0055BF'}});

        // Assert — the first <path> for each face (with data-face attribute) carries the fill
        const top = wrapper.find('[data-face="top"]');
        const front = wrapper.find('[data-face="front"]');
        const right = wrapper.find('[data-face="right"]');
        expect(top.attributes('fill')).toBe('#0055BF');
        expect(front.attributes('fill')).toBe('#0055BF');
        expect(right.attributes('fill')).toBe('#0055BF');
    });

    it('should apply default red color when no color prop is provided', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickIsometricSvg);

        // Assert
        const top = wrapper.find('[data-face="top"]');
        expect(top.attributes('fill')).toBe('#DC2626');
    });

    it('should draw face outlines in black at stroke-width 3', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickIsometricSvg);

        // Assert
        const top = wrapper.find('[data-face="top"]');
        expect(top.attributes('stroke')).toBe('black');
        expect(top.attributes('stroke-width')).toBe('3');
    });

    it('should render each stud with a side band and a top ellipse', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickIsometricSvg);

        // Assert — 12 studs, each with a side path and a filled top ellipse (plus its gradient overlay)
        const studSides = wrapper.findAll('[data-stud-side]');
        const studTops = wrapper.findAll('[data-stud-top]');
        expect(studSides).toHaveLength(12);
        expect(studTops).toHaveLength(12);
    });

    it('should apply stud color matching the brick color', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickIsometricSvg, {props: {color: '#F5C518'}});

        // Assert
        const studSides = wrapper.findAll('[data-stud-side]');
        const studTops = wrapper.findAll('[data-stud-top]');
        for (const side of studSides) {
            expect(side.attributes('fill')).toBe('#F5C518');
        }
        for (const top of studTops) {
            expect(top.attributes('fill')).toBe('#F5C518');
        }
    });

    it('should include gradient defs with unique IDs for top/front/right/stud', () => {
        // Arrange
        const wrapper = shallowMount(LegoBrickIsometricSvg);

        // Assert — 3 linear gradients (faces) + 1 radial (stud top)
        const defs = wrapper.find('defs');
        expect(defs.exists()).toBe(true);
        const linears = defs.findAll('linearGradient');
        expect(linears.length).toBe(3);
        const radials = defs.findAll('radialGradient');
        expect(radials.length).toBe(1);
        // Every gradient must have a unique, truthy id
        const ids = new Set([...linears, ...radials].map((g) => g.attributes('id')).filter(Boolean));
        expect(ids.size).toBe(4);
    });

    it('should produce a viewBox that encloses the projected brick plus stud headroom', () => {
        // Arrange — 30° iso: cos30≈0.866, sin30=0.5
        // Brick extents: bodyWidth=240, bodyDepth=80, BODY_HEIGHT=48
        // Projected corners collapse to an x-range and y-range we can sanity-check.
        const wrapper = shallowMount(LegoBrickIsometricSvg);

        // Assert
        const svg = wrapper.find('svg');
        const viewBox = svg.attributes('viewBox') ?? '';
        const parts = viewBox.split(' ').map(Number);
        expect(parts).toHaveLength(4);
        const [, , width, height] = parts;
        // The projected brick's screen width is (bodyWidth + bodyDepth) * cos30 ≈ 277
        // plus padding + shadow offset — the viewBox width should be larger than 277.
        expect(width).toBeGreaterThan(277);
        // Height spans the full vertical silhouette (top of stud to base of shadow).
        // With the correct studExtentTop formula the height is ~250; the buggy
        // formula (double-subtracting BODY_HEIGHT) produced ~298.
        expect(height).toBeGreaterThan(200);
        expect(height).toBeLessThan(275);
    });

    it('should render a stud side band path using an elliptical arc command', () => {
        // Arrange — the side path uses an elliptical arc (A command) to trace
        // the visible half of the base ellipse.
        const wrapper = shallowMount(LegoBrickIsometricSvg);

        // Assert
        const sides = wrapper.findAll('[data-stud-side]');
        const d = sides[0]?.attributes('d') ?? '';
        expect(d).toMatch(/A /); // contains an arc command
        expect(d.trim().endsWith('Z')).toBe(true); // closed path
    });
});
