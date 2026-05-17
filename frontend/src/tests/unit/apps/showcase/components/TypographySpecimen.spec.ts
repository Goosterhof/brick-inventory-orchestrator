import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';
import TypographySpecimen from '@/apps/showcase/components/TypographySpecimen.vue';

describe('TypographySpecimen', () => {
    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(TypographySpecimen, {global: {stubs: {SectionHeading}}});

        // Assert
        expect(wrapper.text()).toContain('02');
        expect(wrapper.text()).toContain('Typography Specimen');
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(TypographySpecimen, {global: {stubs: {SectionHeading}}});

        // Assert
        expect(wrapper.find('section#typography').exists()).toBe(true);
    });

    it('should render the heading scale with all heading levels', () => {
        // Act
        const wrapper = shallowMount(TypographySpecimen, {global: {stubs: {SectionHeading}}});

        // Assert
        expect(wrapper.text()).toContain('Inventory Dashboard');
        expect(wrapper.text()).toContain('Storage Locations');
        expect(wrapper.text()).toContain('Part Details');
        expect(wrapper.text()).toContain('Drawer Location');
    });

    it('should render the before/after typography comparison', () => {
        // Act
        const wrapper = shallowMount(TypographySpecimen, {global: {stubs: {SectionHeading}}});

        // Assert
        expect(wrapper.text()).toContain('Before — System font heading');
        expect(wrapper.text()).toContain('After — Space Grotesk heading');
    });
});
