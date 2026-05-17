import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';

import BrandVoice from '@/apps/showcase/components/BrandVoice.vue';
import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';

// Mock heavy icon library to cut import chain cost (ADR-010).
vi.mock('@phosphor-icons/vue', () => ({
    PhCheckCircle: {template: '<i />'},
    PhTrash: {template: '<i />'},
    PhWarningCircle: {template: '<i />'},
}));

describe('BrandVoice', () => {
    const stubs = {SectionHeading};

    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(BrandVoice, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('06');
        expect(wrapper.text()).toContain('Brand Voice Specimens');
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(BrandVoice, {global: {stubs}});

        // Assert
        expect(wrapper.find('section#voice').exists()).toBe(true);
    });

    it('should render all voice specimen categories', () => {
        // Act
        const wrapper = shallowMount(BrandVoice, {global: {stubs}});

        // Assert
        const labels = wrapper.findAll('.brick-label');
        const labelTexts = labels.map((l) => l.text());
        expect(labelTexts).toContain('Empty States');
        expect(labelTexts).toContain('Error Messages');
        expect(labelTexts).toContain('Success Messages');
        expect(labelTexts).toContain('Destructive Confirmation');
    });
});
