import LegoRoundSvg from '@shared/components/LegoRoundSvg.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoRoundSvg', () => {
    it('should render an SVG with role img and aria-label', () => {
        const wrapper = shallowMount(LegoRoundSvg);

        const svg = wrapper.find('svg');
        expect(svg.attributes('role')).toBe('img');
        expect(svg.attributes('aria-label')).toBe('1 by 1 round LEGO brick');
    });

    it('should render the body circle', () => {
        const wrapper = shallowMount(LegoRoundSvg);

        const body = wrapper.find('[data-body]');
        expect(body.exists()).toBe(true);
        expect(body.attributes('stroke')).toBe('black');
        expect(body.attributes('stroke-width')).toBe('3');
    });

    it('should render the stud circle with gradient overlay', () => {
        const wrapper = shallowMount(LegoRoundSvg);

        // Body + stud base + stud gradient + possibly shadow = 3 or 4 circles
        const circles = wrapper.findAll('circle');
        // body(1) + shadow(1) + stud(1) + stud gradient(1) = 4
        expect(circles).toHaveLength(4);
    });

    it('should render shadow by default', () => {
        const wrapper = shallowMount(LegoRoundSvg);

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(true);
    });

    it('should hide shadow when shadow is false', () => {
        const wrapper = shallowMount(LegoRoundSvg, {props: {shadow: false}});

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(false);
    });

    it('should apply custom color to body', () => {
        const wrapper = shallowMount(LegoRoundSvg, {props: {color: '#237841'}});

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#237841');
    });

    it('should apply default red color', () => {
        const wrapper = shallowMount(LegoRoundSvg);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#DC2626');
    });

    it('should include gradient defs', () => {
        const wrapper = shallowMount(LegoRoundSvg);

        const gradient = wrapper.find('defs radialGradient');
        expect(gradient.exists()).toBe(true);
    });
});
