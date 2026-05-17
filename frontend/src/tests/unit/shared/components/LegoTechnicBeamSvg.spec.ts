import LegoTechnicBeamSvg from '@shared/components/LegoTechnicBeamSvg.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoTechnicBeamSvg', () => {
    it('should render an SVG with role img and aria-label', () => {
        const wrapper = shallowMount(LegoTechnicBeamSvg);

        const svg = wrapper.find('svg');
        expect(svg.attributes('role')).toBe('img');
        expect(svg.attributes('aria-label')).toBe('1 by 4 LEGO Technic beam');
    });

    it('should render the body rect', () => {
        const wrapper = shallowMount(LegoTechnicBeamSvg);

        const body = wrapper.find('[data-body]');
        expect(body.exists()).toBe(true);
        expect(body.attributes('stroke')).toBe('black');
        expect(body.attributes('stroke-width')).toBe('3');
    });

    it('should render 4 pin holes', () => {
        const wrapper = shallowMount(LegoTechnicBeamSvg);

        const holes = wrapper.findAll('[data-pin-hole]');
        expect(holes).toHaveLength(4);
    });

    it('should render pin holes as white circles', () => {
        const wrapper = shallowMount(LegoTechnicBeamSvg);

        const holes = wrapper.findAll('[data-pin-hole]');
        const hole = holes.find((h) => h.attributes('fill') === 'white');
        expect(hole?.exists()).toBe(true);
        expect(hole?.attributes('stroke')).toBe('black');
        expect(hole?.attributes('stroke-width')).toBe('3');
    });

    it('should render shadow by default', () => {
        const wrapper = shallowMount(LegoTechnicBeamSvg);

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(true);
    });

    it('should hide shadow when shadow is false', () => {
        const wrapper = shallowMount(LegoTechnicBeamSvg, {props: {shadow: false}});

        const shadow = wrapper.find('[data-shadow]');
        expect(shadow.exists()).toBe(false);
    });

    it('should apply custom color to body', () => {
        const wrapper = shallowMount(LegoTechnicBeamSvg, {props: {color: '#F5C518'}});

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#F5C518');
    });

    it('should apply default red color', () => {
        const wrapper = shallowMount(LegoTechnicBeamSvg);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('fill')).toBe('#DC2626');
    });

    it('should compute correct viewBox', () => {
        const wrapper = shallowMount(LegoTechnicBeamSvg);

        // CELL=40, PAD=10, COLUMNS=4: bodyWidth=2*10+4*40=180, bodyHeight=2*10+40=60
        // STROKE=3, SHADOW_OFFSET=4 -> "0 0 187 67"
        const svg = wrapper.find('svg');
        expect(svg.attributes('viewBox')).toBe('0 0 187 67');
    });
});
