import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

import AntiPatterns from '@/apps/showcase/components/AntiPatterns.vue';
import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';

describe('AntiPatterns', () => {
    const stubs = {SectionHeading};

    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(AntiPatterns, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('05');
        expect(wrapper.text()).toContain('Anti-Patterns Wall');
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(AntiPatterns, {global: {stubs}});

        // Assert
        expect(wrapper.find('section#anti-patterns').exists()).toBe(true);
    });

    it('should render all four anti-pattern comparisons', () => {
        // Act
        const wrapper = shallowMount(AntiPatterns, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('Wrong — Rounded corners');
        expect(wrapper.text()).toContain('Correct — Sharp corners');
        expect(wrapper.text()).toContain('Wrong — Blurred shadow');
        expect(wrapper.text()).toContain('Correct — Hard offset shadow');
        expect(wrapper.text()).toContain('Wrong — Gradient fill');
        expect(wrapper.text()).toContain('Correct — Flat solid color');
        expect(wrapper.text()).toContain('Wrong — 1px border');
        expect(wrapper.text()).toContain('Correct — 3px border');
    });
});
