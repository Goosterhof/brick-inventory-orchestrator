import LegoArch from '@shared/components/LegoArch.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoArch', () => {
    it('should render 4 studs in a single row', () => {
        const wrapper = shallowMount(LegoArch);

        const studs = wrapper.findAll('[data-stud]');
        expect(studs).toHaveLength(4);
    });

    it('should render the arch hint semicircle', () => {
        const wrapper = shallowMount(LegoArch);

        const hint = wrapper.find('[data-arch-hint]');
        expect(hint.exists()).toBe(true);
        expect(hint.attributes('style')).toContain('border-top');
        expect(hint.attributes('style')).toContain('border-radius: 999px 999px 0px 0px');
    });

    it('should render a 4-column grid body', () => {
        const wrapper = shallowMount(LegoArch);

        const body = wrapper.find('[data-body]');
        expect(body.exists()).toBe(true);
        expect(body.attributes('style')).toContain('grid-template-columns: repeat(4, 1fr)');
    });

    it('should show shadow by default', () => {
        const wrapper = shallowMount(LegoArch);

        const body = wrapper.find('[data-body]');
        expect(body.classes()).toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should hide shadow when shadow is false', () => {
        const wrapper = shallowMount(LegoArch, {props: {shadow: false}});

        const body = wrapper.find('[data-body]');
        expect(body.classes()).not.toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should apply custom color', () => {
        const wrapper = shallowMount(LegoArch, {props: {color: '#237841'}});

        const studs = wrapper.findAll('[data-stud]');
        const stud = studs.find((s) => s.attributes('style')?.includes('#237841'));
        expect(stud?.exists()).toBe(true);
    });

    it('should apply default red color', () => {
        const wrapper = shallowMount(LegoArch);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('style')).toContain('#DC2626');
    });

    it('should have brick-border on the body', () => {
        const wrapper = shallowMount(LegoArch);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('border')).toBe('3 black');
    });
});
