import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

import ColorPalette from '@/apps/showcase/components/ColorPalette.vue';
import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';

describe('ColorPalette', () => {
    const stubs = {SectionHeading};

    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(ColorPalette, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('01');
        expect(wrapper.text()).toContain('Color Palette');
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(ColorPalette, {global: {stubs}});

        // Assert
        expect(wrapper.find('section#colors').exists()).toBe(true);
    });

    it('should render all nine color tokens', () => {
        // Act
        const wrapper = shallowMount(ColorPalette, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('Ink');
        expect(wrapper.text()).toContain('Surface');
        expect(wrapper.text()).toContain('Yellow');
        expect(wrapper.text()).toContain('Yellow Subtle');
        expect(wrapper.text()).toContain('Red');
        expect(wrapper.text()).toContain('Red Light');
        expect(wrapper.text()).toContain('Red Dark');
        expect(wrapper.text()).toContain('Blue');
        expect(wrapper.text()).toContain('Baseplate Green');
    });

    it('should render hex values for non-reserved colors', () => {
        // Act
        const wrapper = shallowMount(ColorPalette, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('#000000');
        expect(wrapper.text()).toContain('#FFFFFF');
        expect(wrapper.text()).toContain('#F5C518');
        expect(wrapper.text()).toContain('#C41A16');
    });

    it('should show reserved overlay for Blue and Baseplate Green', () => {
        // Act
        const wrapper = shallowMount(ColorPalette, {global: {stubs}});

        // Assert
        const reservedLabels = wrapper.findAll('span').filter((s) => s.text() === 'Reserved');
        expect(reservedLabels).toHaveLength(2);
    });

    it('should apply reduced opacity to reserved color cards', () => {
        // Act
        const wrapper = shallowMount(ColorPalette, {global: {stubs}});

        // Assert — reserved cards have opacity-60
        const cards = wrapper.findAll('.brick-border.brick-shadow');
        const reservedCards = cards.filter((c) => c.classes().includes('opacity-60'));
        expect(reservedCards).toHaveLength(2);
    });

    it('should render contrast ratio badges for all colors', () => {
        // Act
        const wrapper = shallowMount(ColorPalette, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('21:1');
        expect(wrapper.text()).toContain('1:1');
        expect(wrapper.text()).toContain('1.6:1');
        expect(wrapper.text()).toContain('6.5:1');
    });
});
