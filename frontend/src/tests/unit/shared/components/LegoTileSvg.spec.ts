import LegoTileSvg from '@shared/components/LegoTileSvg.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoTileSvg', () => {
    it('should render an SVG with role img and aria-label', () => {
        const wrapper = shallowMount(LegoTileSvg);

        const svg = wrapper.find('svg');
        expect(svg.attributes('role')).toBe('img');
        expect(svg.attributes('aria-label')).toBe('1 by 2 LEGO tile');
    });

    it('should render the body rect with no studs', () => {
        const wrapper = shallowMount(LegoTileSvg);

        const body = wrapper.find('[data-body]');
        expect(body.exists()).toBe(true);
        expect(body.attributes('stroke')).toBe('black');
        expect(body.attributes('stroke-width')).toBe('3');

        const circles = wrapper.findAll('circle');
        expect(circles).toHaveLength(0);
    });

    it('should render a tile hint inner rectangle', () => {
        const wrapper = shallowMount(LegoTileSvg);

        const hint = wrapper.find('[data-tile-hint]');
        expect(hint.exists()).toBe(true);
        expect(hint.attributes('fill')).toBe('none');
        expect(hint.attributes('stroke-opacity')).toBe('0.2');
    });

    it('should render shadow by default', () => {
        const wrapper = shallowMount(LegoTileSvg);

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(true);
    });

    it('should hide shadow when shadow is false', () => {
        const wrapper = shallowMount(LegoTileSvg, {props: {shadow: false}});

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(false);
    });

    it('should apply custom color to body', () => {
        const wrapper = shallowMount(LegoTileSvg, {props: {color: '#237841'}});

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#237841');
    });

    it('should apply default red color', () => {
        const wrapper = shallowMount(LegoTileSvg);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#DC2626');
    });
});
