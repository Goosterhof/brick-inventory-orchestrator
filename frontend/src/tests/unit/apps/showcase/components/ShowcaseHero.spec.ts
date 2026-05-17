import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';
import {nextTick} from 'vue';

import ShowcaseHero from '@/apps/showcase/components/ShowcaseHero.vue';

describe('ShowcaseHero', () => {
    it('should render the hero section with title and subtitle', () => {
        // Act
        const wrapper = shallowMount(ShowcaseHero);

        // Assert
        expect(wrapper.text()).toContain('Brick');
        expect(wrapper.text()).toContain('Brutalism');
        expect(wrapper.text()).toContain('Design System Specimen');
    });

    it('should render the tagline', () => {
        // Act
        const wrapper = shallowMount(ShowcaseHero);

        // Assert
        expect(wrapper.text()).toContain("Every brick has a place. This is where they're made.");
    });

    it('should set isVisible to true on mount triggering animation classes', async () => {
        // Act
        const wrapper = shallowMount(ShowcaseHero);
        await nextTick();

        // Assert — after mount + tick, isVisible is true, so animated elements get translate-x-0
        const animatedElements = wrapper.findAll("[transition='all']");
        expect(animatedElements.length).toBeGreaterThanOrEqual(2);
        for (const el of animatedElements) {
            const classString = el.attributes('class') ?? '';
            expect(classString).toContain('translate-x-0');
        }
    });

    it('should render three decorative brick blocks', () => {
        // Act
        const wrapper = shallowMount(ShowcaseHero);

        // Assert
        const brickBlocks = wrapper.findAll("[w='16'][h='16']");
        expect(brickBlocks).toHaveLength(3);
    });
});
