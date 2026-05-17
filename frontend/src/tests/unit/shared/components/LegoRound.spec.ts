import LegoRound from '@shared/components/LegoRound.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoRound', () => {
    it('should render the stud on top', () => {
        const wrapper = shallowMount(LegoRound);

        const stud = wrapper.find('[data-stud]');
        expect(stud.exists()).toBe(true);
        expect(stud.attributes('rounded')).toBe('t-full');
    });

    it('should render the cylindrical body', () => {
        const wrapper = shallowMount(LegoRound);

        const body = wrapper.find('[data-body]');
        expect(body.exists()).toBe(true);
        expect(body.attributes('w')).toBe('14');
        expect(body.attributes('h')).toBe('14');
    });

    it('should show shadow by default', () => {
        const wrapper = shallowMount(LegoRound);

        const body = wrapper.find('[data-body]');
        expect(body.classes()).toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should hide shadow when shadow is false', () => {
        const wrapper = shallowMount(LegoRound, {props: {shadow: false}});

        const body = wrapper.find('[data-body]');
        expect(body.classes()).not.toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should apply custom color to stud and body', () => {
        const wrapper = shallowMount(LegoRound, {props: {color: '#F5C518'}});

        const stud = wrapper.find('[data-stud]');
        expect(stud.attributes('style')).toContain('#F5C518');

        const body = wrapper.find('[data-body]');
        expect(body.attributes('style')).toContain('#F5C518');
    });

    it('should apply default red color', () => {
        const wrapper = shallowMount(LegoRound);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('style')).toContain('#DC2626');
    });

    it('should have brick-border on body', () => {
        const wrapper = shallowMount(LegoRound);

        const body = wrapper.find('[data-body]');
        expect(body.attributes('border')).toBe('3 black');
    });
});
