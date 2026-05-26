// Mock the LegoXxx shape imports — they pull SVG-heavy single-file components into
// the import chain. The BrickShapes spec verifies interaction behavior, not shape
// rendering; lightweight stubs keep collect time within the project baseline.
import {shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import BrickShapes from '@/apps/showcase/components/BrickShapes.vue';
import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';

vi.mock('@shared/components/LegoArch.vue', () => ({default: {template: '<div data-stub-shape />'}}));
vi.mock('@shared/components/LegoPlate.vue', () => ({default: {template: '<div data-stub-shape />'}}));
vi.mock('@shared/components/LegoRound.vue', () => ({default: {template: '<div data-stub-shape />'}}));
vi.mock('@shared/components/LegoSlope.vue', () => ({default: {template: '<div data-stub-shape />'}}));
vi.mock('@shared/components/LegoTechnicBeam.vue', () => ({default: {template: '<div data-stub-shape />'}}));
vi.mock('@shared/components/LegoTile.vue', () => ({default: {template: '<div data-stub-shape />'}}));
vi.mock('@shared/components/LegoWedge.vue', () => ({default: {template: '<div data-stub-shape />'}}));

type MediaQueryHandler = (event: {matches: boolean}) => void;

const createMockMatchMedia = (matches: boolean) => {
    const handlers: MediaQueryHandler[] = [];
    const addEventListener = vi.fn<(type: string, handler: MediaQueryHandler) => void>((_type, handler) => {
        handlers.push(handler);
    });
    return {
        matchMedia: vi
            .fn<(query: string) => {matches: boolean; addEventListener: typeof addEventListener}>()
            .mockReturnValue({matches, addEventListener}),
        handlers,
    };
};

describe('BrickShapes', () => {
    const stubs = {SectionHeading};

    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {writable: true, value: createMockMatchMedia(false).matchMedia});
    });

    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('14');
        expect(wrapper.text()).toContain('Brick Shapes');
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        // Assert
        expect(wrapper.find('section#brick-shapes').exists()).toBe(true);
    });

    it('should render 7 shape cards', () => {
        // Act
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        // Assert
        const cards = wrapper.findAll('[data-shape-card]');
        expect(cards).toHaveLength(7);
    });

    it('should display all shape labels in the cards', () => {
        // Act
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        // Assert
        const text = wrapper.text();
        expect(text).toContain('Slope (2x2 45°)');
        expect(text).toContain('Arch (1x4)');
        expect(text).toContain('Wedge (2x4)');
        expect(text).toContain('Round (1x1)');
        expect(text).toContain('Plate (2x4)');
        expect(text).toContain('Tile (1x2)');
        expect(text).toContain('Technic Beam (1x4)');
    });

    it('should render the descriptive intro paragraph', () => {
        // Act
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('Hover, press, release');
        expect(wrapper.text()).toContain('useBrickPickup()');
        expect(wrapper.text()).toContain('brick-anim-pickup');
    });

    it('should expose default headline parameters in the readout', () => {
        // Act
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        // Assert
        const text = wrapper.text();
        expect(text).toContain('8px');
        expect(text).toContain('4px');
        expect(text).toContain('160ms');
        expect(text).toContain('100ms');
        expect(text).toContain('320ms');
        expect(text).toContain('cubic-bezier(0.2, 0, 0, 1)');
        expect(text).toContain('cubic-bezier(0.4, 0, 0.2, 1)');
    });

    it('should reflect each slider change in the headline parameter readout', async () => {
        // Arrange — one wrapper, walk every slider so the suite covers each
        // input independently without paying full-mount cost five times.
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        // Act + Assert — each slider's data-attribute selector + a unique value
        await wrapper.find('input[data-slider-hover]').setValue('14');
        expect(wrapper.text()).toContain('14px');

        await wrapper.find('input[data-slider-press]').setValue('7');
        expect(wrapper.text()).toContain('7px');

        await wrapper.find('input[data-slider-hover-dur]').setValue('220');
        expect(wrapper.text()).toContain('220ms');

        await wrapper.find('input[data-slider-press-dur]').setValue('80');
        expect(wrapper.text()).toContain('80ms');

        await wrapper.find('input[data-slider-release]').setValue('400');
        expect(wrapper.text()).toContain('400ms');
    });

    it('should default each card to the idle state', () => {
        // Act
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        // Assert
        const states = wrapper.findAll('[data-state]');
        for (const el of states) {
            expect(el.attributes('data-state')).toBe('idle');
        }
    });

    it('should transition the first card through hover → press → release → leave and reflect in badge text', async () => {
        // Arrange
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});
        const card = wrapper.findAll('[data-state]')[0];
        if (!card) throw new Error('no card');

        // Act + Assert
        await card.trigger('mouseenter');
        expect(card.attributes('data-state')).toBe('hovered');
        expect(wrapper.text()).toContain('HOVERED');

        await card.trigger('mousedown');
        expect(card.attributes('data-state')).toBe('pressed');
        expect(wrapper.text()).toContain('PRESSED');

        await card.trigger('mouseup');
        expect(card.attributes('data-state')).toBe('hovered');

        await card.trigger('mouseleave');
        expect(card.attributes('data-state')).toBe('idle');
    });

    it('should not show reduced-motion indicator when motion is not reduced', () => {
        // Act
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        // Assert
        expect(wrapper.text()).not.toContain('prefers-reduced-motion: reduce');
    });

    it('should show reduced-motion indicator when reduced motion is preferred', () => {
        // Arrange
        Object.defineProperty(window, 'matchMedia', {writable: true, value: createMockMatchMedia(true).matchMedia});

        // Act
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('prefers-reduced-motion: reduce');
        expect(wrapper.text()).toContain('transforms disabled');
    });

    it('should respond to live changes in prefers-reduced-motion', async () => {
        // Arrange
        const {matchMedia, handlers} = createMockMatchMedia(false);
        Object.defineProperty(window, 'matchMedia', {writable: true, value: matchMedia});

        const wrapper = shallowMount(BrickShapes, {global: {stubs}});
        expect(wrapper.text()).not.toContain('prefers-reduced-motion: reduce');

        // Act
        for (const handler of handlers) {
            handler({matches: true});
        }
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('prefers-reduced-motion: reduce');
    });

    it('should default to no reduced motion when matchMedia is unavailable', () => {
        // Arrange
        Object.defineProperty(window, 'matchMedia', {writable: true, value: undefined});

        // Act
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});

        // Assert
        expect(wrapper.text()).not.toContain('prefers-reduced-motion: reduce');
    });
});
