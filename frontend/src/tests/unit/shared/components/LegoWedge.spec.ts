import LegoWedge from '@shared/components/LegoWedge.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoWedge', () => {
    it('should render 7 studs (4 top row + 3 bottom row, 4th cut off by taper)', () => {
        const wrapper = shallowMount(LegoWedge);

        const studs = wrapper.findAll('[data-stud]');
        expect(studs).toHaveLength(7);
    });

    it('should render a 4-column grid body', () => {
        const wrapper = shallowMount(LegoWedge);

        const body = wrapper.find('[data-body]');
        expect(body.exists()).toBe(true);
        expect(body.attributes('style')).toContain('grid-template-columns: repeat(4, 1fr)');
    });

    it('should render a wedge hint diagonal taper line', () => {
        const wrapper = shallowMount(LegoWedge);

        const hint = wrapper.find('[data-wedge-hint]');
        expect(hint.exists()).toBe(true);
        expect(hint.attributes('style')).toContain('linear-gradient');
    });

    it('should show shadow by default', () => {
        const wrapper = shallowMount(LegoWedge);

        const body = wrapper.find('[data-body]');
        expect(body.classes()).toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should hide shadow when shadow is false', () => {
        const wrapper = shallowMount(LegoWedge, {props: {shadow: false}});

        const body = wrapper.find('[data-body]');
        expect(body.classes()).not.toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should apply custom color', () => {
        const wrapper = shallowMount(LegoWedge, {props: {color: '#0055BF'}});

        const body = wrapper.find('[data-body]');
        expect(body.attributes('style')).toContain('#0055BF');
    });

    it('should apply default red color', () => {
        const wrapper = shallowMount(LegoWedge);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('style')).toContain('#DC2626');
    });

    it('should have brick-border styling', () => {
        const wrapper = shallowMount(LegoWedge);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('border')).toBe('3 black');
    });
});
