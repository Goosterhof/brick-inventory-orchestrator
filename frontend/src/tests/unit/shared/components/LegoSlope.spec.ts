import LegoSlope from '@shared/components/LegoSlope.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoSlope', () => {
    it('should render a 2x2 grid body', () => {
        const wrapper = shallowMount(LegoSlope);

        const body = wrapper.find('[data-body]');
        expect(body.exists()).toBe(true);
        expect(body.attributes('style')).toContain('grid-template-columns: repeat(2, 1fr)');
    });

    it('should render 2 slope hint cells with diagonal overlays', () => {
        const wrapper = shallowMount(LegoSlope);

        const hints = wrapper.findAll('[data-slope-hint]');
        expect(hints).toHaveLength(2);

        for (const hint of hints) {
            const overlay = hint.find("[position='absolute']");
            expect(overlay.exists()).toBe(true);
            expect(overlay.attributes('style')).toContain('linear-gradient');
        }
    });

    it('should render 2 studs on the bottom row', () => {
        const wrapper = shallowMount(LegoSlope);

        const studs = wrapper.findAll('[data-stud]');
        expect(studs).toHaveLength(2);
    });

    it('should apply default red color', () => {
        const wrapper = shallowMount(LegoSlope);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('style')).toContain('#DC2626');
    });

    it('should apply custom color', () => {
        const wrapper = shallowMount(LegoSlope, {props: {color: '#0055BF'}});

        const studs = wrapper.findAll('[data-stud]');
        const stud = studs.find((s) => s.attributes('style')?.includes('#0055BF'));
        expect(stud?.exists()).toBe(true);
    });

    it('should show shadow by default', () => {
        const wrapper = shallowMount(LegoSlope);

        const body = wrapper.find('[data-body]');
        expect(body.classes()).toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should hide shadow when shadow is false', () => {
        const wrapper = shallowMount(LegoSlope, {props: {shadow: false}});

        const body = wrapper.find('[data-body]');
        expect(body.classes()).not.toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should have brick-border styling on the body', () => {
        const wrapper = shallowMount(LegoSlope);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('border')).toBe('3 black');
    });
});
