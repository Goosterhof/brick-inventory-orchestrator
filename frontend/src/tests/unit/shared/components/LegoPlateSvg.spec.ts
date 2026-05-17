import LegoPlateSvg from '@shared/components/LegoPlateSvg.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoPlateSvg', () => {
    it('should render an SVG with role img and aria-label', () => {
        const wrapper = shallowMount(LegoPlateSvg);

        const svg = wrapper.find('svg');
        expect(svg.attributes('role')).toBe('img');
        expect(svg.attributes('aria-label')).toBe('2 by 4 LEGO plate');
    });

    it('should render the body rect', () => {
        const wrapper = shallowMount(LegoPlateSvg);

        const body = wrapper.find('[data-body]');
        expect(body.exists()).toBe(true);
        expect(body.attributes('stroke')).toBe('black');
        expect(body.attributes('stroke-width')).toBe('3');
    });

    it('should render a plate hint inner outline', () => {
        const wrapper = shallowMount(LegoPlateSvg);

        const hint = wrapper.find('[data-plate-hint]');
        expect(hint.exists()).toBe(true);
        expect(hint.attributes('fill')).toBe('none');
        expect(hint.attributes('stroke-opacity')).toBe('0.15');
    });

    it('should render 8 studs (2x4)', () => {
        const wrapper = shallowMount(LegoPlateSvg);

        const studGroups = wrapper.findAll('g');
        expect(studGroups).toHaveLength(8);
        const circles = wrapper.findAll('circle');
        expect(circles).toHaveLength(16);
    });

    it('should render shadow by default', () => {
        const wrapper = shallowMount(LegoPlateSvg);

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(true);
    });

    it('should hide shadow when shadow is false', () => {
        const wrapper = shallowMount(LegoPlateSvg, {props: {shadow: false}});

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(false);
    });

    it('should apply custom color to body', () => {
        const wrapper = shallowMount(LegoPlateSvg, {props: {color: '#0055BF'}});

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#0055BF');
    });

    it('should apply default red color', () => {
        const wrapper = shallowMount(LegoPlateSvg);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#DC2626');
    });

    it('should include gradient defs', () => {
        const wrapper = shallowMount(LegoPlateSvg);

        const gradient = wrapper.find('defs radialGradient');
        expect(gradient.exists()).toBe(true);
    });
});
