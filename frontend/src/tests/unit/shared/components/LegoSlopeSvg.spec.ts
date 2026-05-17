import LegoSlopeSvg from '@shared/components/LegoSlopeSvg.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoSlopeSvg', () => {
    it('should render an SVG with role img and aria-label', () => {
        const wrapper = shallowMount(LegoSlopeSvg);

        const svg = wrapper.find('svg');
        expect(svg.attributes('role')).toBe('img');
        expect(svg.attributes('aria-label')).toBe('2 by 2 LEGO slope brick');
    });

    it('should render the body rect', () => {
        const wrapper = shallowMount(LegoSlopeSvg);

        const body = wrapper.find('[data-body]');
        expect(body.exists()).toBe(true);
        expect(body.attributes('stroke')).toBe('black');
        expect(body.attributes('stroke-width')).toBe('3');
    });

    it('should render a filled slope hint polygon with gradient', () => {
        const wrapper = shallowMount(LegoSlopeSvg);

        const hint = wrapper.find('[data-slope-hint]');
        expect(hint.exists()).toBe(true);
        expect(hint.element.tagName).toBe('polygon');
        expect(hint.attributes('points')).toContain('1.5,1.5');
    });

    it('should render the slope edge divider line', () => {
        const wrapper = shallowMount(LegoSlopeSvg);

        const edge = wrapper.find('[data-slope-edge]');
        expect(edge.exists()).toBe(true);
        expect(edge.attributes('stroke')).toBe('black');
        expect(edge.attributes('stroke-opacity')).toBe('0.4');
    });

    it('should include a linear gradient for the slope shading', () => {
        const wrapper = shallowMount(LegoSlopeSvg);

        const defs = wrapper.find('defs');
        const linearGradient = defs.find('linearGradient');
        expect(linearGradient.exists()).toBe(true);
    });

    it('should render 2 studs with gradient on the bottom row', () => {
        const wrapper = shallowMount(LegoSlopeSvg);

        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(2);
        const circles = wrapper.findAll('circle');
        expect(circles).toHaveLength(4);
    });

    it('should render shadow by default', () => {
        const wrapper = shallowMount(LegoSlopeSvg);

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(true);
    });

    it('should hide shadow when shadow is false', () => {
        const wrapper = shallowMount(LegoSlopeSvg, {props: {shadow: false}});

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(false);
    });

    it('should apply custom color to body', () => {
        const wrapper = shallowMount(LegoSlopeSvg, {props: {color: '#0055BF'}});

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#0055BF');
    });

    it('should apply default red color', () => {
        const wrapper = shallowMount(LegoSlopeSvg);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#DC2626');
    });

    it('should include gradient defs', () => {
        const wrapper = shallowMount(LegoSlopeSvg);

        const defs = wrapper.find('defs');
        expect(defs.exists()).toBe(true);
        const gradient = defs.find('radialGradient');
        expect(gradient.exists()).toBe(true);
    });
});
