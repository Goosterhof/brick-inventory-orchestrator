import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';

describe('SectionHeading', () => {
    it('should render the number and title', () => {
        // Act
        const wrapper = shallowMount(SectionHeading, {props: {number: '01', title: 'Color Palette'}});

        // Assert
        expect(wrapper.text()).toContain('01');
        expect(wrapper.text()).toContain('Color Palette');
    });

    it('should render the number as aria-hidden decorative element', () => {
        // Act
        const wrapper = shallowMount(SectionHeading, {props: {number: '03', title: 'The Snap Principle'}});

        // Assert
        const decorativeSpan = wrapper.find("[aria-hidden='true']");
        expect(decorativeSpan.exists()).toBe(true);
        expect(decorativeSpan.text()).toBe('03');
    });

    it('should render the title as an h2 heading', () => {
        // Act
        const wrapper = shallowMount(SectionHeading, {props: {number: '02', title: 'Typography Specimen'}});

        // Assert
        const heading = wrapper.find('h2');
        expect(heading.exists()).toBe(true);
        expect(heading.text()).toBe('Typography Specimen');
    });
});
