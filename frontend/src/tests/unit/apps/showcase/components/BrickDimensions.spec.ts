import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

import BrickDimensions from '@/apps/showcase/components/BrickDimensions.vue';
import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';

describe('BrickDimensions', () => {
    const stubs = {SectionHeading};

    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(BrickDimensions, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('07');
        expect(wrapper.text()).toContain('Brick Dimensions');
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(BrickDimensions, {global: {stubs}});

        // Assert
        expect(wrapper.find('section#dimensions').exists()).toBe(true);
    });

    it('should render all four brick specimens', () => {
        // Act
        const wrapper = shallowMount(BrickDimensions, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('2x4 Brick');
        expect(wrapper.text()).toContain('2x2 Brick');
        expect(wrapper.text()).toContain('1x2 Plate');
        expect(wrapper.text()).toContain('1x1 Round');
    });

    it('should render stud count labels for each brick', () => {
        // Act
        const wrapper = shallowMount(BrickDimensions, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('2 x 4 studs');
        expect(wrapper.text()).toContain('2 x 2 studs');
        expect(wrapper.text()).toContain('1 x 2 studs');
        expect(wrapper.text()).toContain('1 x 1 studs');
    });

    it('should render the spacing scale with stud multiples', () => {
        // Act
        const wrapper = shallowMount(BrickDimensions, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('1 stud');
        expect(wrapper.text()).toContain('2 studs');
        expect(wrapper.text()).toContain('8 studs');
        expect(wrapper.text()).toContain('8px');
        expect(wrapper.text()).toContain('64px');
    });

    it('should render the stud atomic unit section', () => {
        // Act
        const wrapper = shallowMount(BrickDimensions, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('The Stud — Atomic Unit');
        expect(wrapper.text()).toContain('stud ⌀ = 0.6 × cell (4.8mm)');
    });
});
