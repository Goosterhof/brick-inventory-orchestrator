import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

import BrickShapes from '@/apps/showcase/components/BrickShapes.vue';
import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';

describe('BrickShapes', () => {
    const stubs = {SectionHeading};

    it('should render the section heading with correct number and title', () => {
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        expect(wrapper.text()).toContain('14');
        expect(wrapper.text()).toContain('Brick Shapes');
    });

    it('should render the section element with correct id', () => {
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        expect(wrapper.find('section#brick-shapes').exists()).toBe(true);
    });

    it('should render 7 shape cards', () => {
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        const cards = wrapper.findAll('[data-shape-card]');
        expect(cards).toHaveLength(7);
    });

    it('should display all shape labels', () => {
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        const labels = wrapper.findAll('.brick-label');
        const labelTexts = labels.map((l) => l.text());
        expect(labelTexts).toContain('Slope (2x2 45\u00B0)');
        expect(labelTexts).toContain('Arch (1x4)');
        expect(labelTexts).toContain('Wedge (2x4)');
        expect(labelTexts).toContain('Round (1x1)');
        expect(labelTexts).toContain('Plate (2x4)');
        expect(labelTexts).toContain('Tile (1x2)');
        expect(labelTexts).toContain('Technic Beam (1x4)');
    });

    it('should have HTML/CSS and SVG columns for each shape', () => {
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        const htmlLabels = wrapper.findAll('p').filter((p) => p.text() === 'HTML / CSS');
        const svgLabels = wrapper.findAll('p').filter((p) => p.text() === 'SVG');
        expect(htmlLabels).toHaveLength(7);
        expect(svgLabels).toHaveLength(7);
    });

    it('should render descriptive intro paragraph', () => {
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        expect(wrapper.text()).toContain('Each LEGO shape rendered top-down in both HTML/CSS and SVG');
    });
});
