import LegoArchSvg from '@shared/components/LegoArchSvg.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoArchSvg', () => {
    it('should render an SVG with role img and aria-label', () => {
        const wrapper = shallowMount(LegoArchSvg);

        const svg = wrapper.find('svg');
        expect(svg.attributes('role')).toBe('img');
        expect(svg.attributes('aria-label')).toBe('1 by 4 LEGO arch brick');
    });

    it('should render the body rect', () => {
        const wrapper = shallowMount(LegoArchSvg);

        const body = wrapper.find('[data-body]');
        expect(body.exists()).toBe(true);
        expect(body.attributes('stroke')).toBe('black');
        expect(body.attributes('stroke-width')).toBe('3');
    });

    it('should render a filled arch cutout path', () => {
        const wrapper = shallowMount(LegoArchSvg);

        const hint = wrapper.find('[data-arch-hint]');
        expect(hint.exists()).toBe(true);
        expect(hint.attributes('fill')).toBe('black');
        expect(hint.attributes('fill-opacity')).toBe('0.2');
        expect(hint.attributes('stroke-opacity')).toBe('0.4');
    });

    it('should render the arch cutout spanning two cell widths', () => {
        const wrapper = shallowMount(LegoArchSvg);

        const hint = wrapper.find('[data-arch-hint]');
        const d = hint.attributes('d') ?? '';
        // archR = CELL = 40, archCx = halfStroke + bodyWidth/2 = 1.5 + 90 = 91.5
        // archLeft = 91.5 - 40 = 51.5, archRight = 91.5 + 40 = 131.5
        expect(d).toContain('M 51.5');
        expect(d).toContain('131.5');
    });

    it('should render 4 studs with gradient', () => {
        const wrapper = shallowMount(LegoArchSvg);

        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(4);
        const circles = wrapper.findAll('circle');
        expect(circles).toHaveLength(8);
    });

    it('should render shadow by default', () => {
        const wrapper = shallowMount(LegoArchSvg);

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(true);
    });

    it('should hide shadow when shadow is false', () => {
        const wrapper = shallowMount(LegoArchSvg, {props: {shadow: false}});

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(false);
    });

    it('should apply custom color to body', () => {
        const wrapper = shallowMount(LegoArchSvg, {props: {color: '#F5C518'}});

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#F5C518');
    });

    it('should apply default red color', () => {
        const wrapper = shallowMount(LegoArchSvg);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#DC2626');
    });

    it('should include gradient defs', () => {
        const wrapper = shallowMount(LegoArchSvg);

        const gradient = wrapper.find('defs radialGradient');
        expect(gradient.exists()).toBe(true);
    });
});
