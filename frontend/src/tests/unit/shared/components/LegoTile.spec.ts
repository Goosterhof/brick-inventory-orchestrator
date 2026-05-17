import LegoTile from '@shared/components/LegoTile.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('LegoTile', () => {
    it('should render a smooth tile with no studs', () => {
        const wrapper = shallowMount(LegoTile);

        const tile = wrapper.find('[data-tile]');
        expect(tile.exists()).toBe(true);

        const studs = wrapper.findAll("[rounded='full']");
        expect(studs).toHaveLength(0);
    });

    it('should render a tile hint inner rectangle', () => {
        const wrapper = shallowMount(LegoTile);

        const hint = wrapper.find('[data-tile-hint]');
        expect(hint.exists()).toBe(true);
        expect(hint.attributes('style')).toContain('border: 1px solid rgba(0, 0, 0, 0.2)');
    });

    it('should show shadow by default', () => {
        const wrapper = shallowMount(LegoTile);

        const tile = wrapper.find('[data-tile]');
        expect(tile.classes()).toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should hide shadow when shadow is false', () => {
        const wrapper = shallowMount(LegoTile, {props: {shadow: false}});

        const tile = wrapper.find('[data-tile]');
        expect(tile.classes()).not.toContain('shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]');
    });

    it('should apply custom color', () => {
        const wrapper = shallowMount(LegoTile, {props: {color: '#F5C518'}});

        const tile = wrapper.find('[data-tile]');
        expect(tile.attributes('style')).toContain('#F5C518');
    });

    it('should apply default red color', () => {
        const wrapper = shallowMount(LegoTile);

        const tile = wrapper.find('[data-tile]');
        expect(tile.attributes('style')).toContain('#DC2626');
    });

    it('should have brick-border styling', () => {
        const wrapper = shallowMount(LegoTile);

        const tile = wrapper.find('[data-tile]');
        expect(tile.attributes('border')).toBe('3 black');
    });
});
