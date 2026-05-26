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

    it('should reflect slider changes in the headline parameters', async () => {
        // Arrange
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});
        const hoverSlider = wrapper.find('input[data-slider-hover]');

        // Act
        await hoverSlider.setValue('14');

        // Assert
        expect(wrapper.text()).toContain('14px');
    });

    it('should reflect press-duration slider changes in the headline parameters', async () => {
        // Arrange
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});
        const pressDurSlider = wrapper.find('input[data-slider-press-dur]');

        // Act
        await pressDurSlider.setValue('80');

        // Assert
        expect(wrapper.text()).toContain('80ms');
    });

    it('should reflect hover-duration slider changes', async () => {
        // Arrange
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});
        const slider = wrapper.find('input[data-slider-hover-dur]');

        // Act
        await slider.setValue('220');

        // Assert
        expect(wrapper.text()).toContain('220ms');
    });

    it('should reflect press-lift slider changes', async () => {
        // Arrange
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});
        const slider = wrapper.find('input[data-slider-press]');

        // Act
        await slider.setValue('8');

        // Assert
        expect(wrapper.text()).toContain('8px');
    });

    it('should reflect release-duration slider changes', async () => {
        // Arrange
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});
        const slider = wrapper.find('input[data-slider-release]');

        // Act
        await slider.setValue('400');

        // Assert
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

    it('should transition the first card through hover → press → release → leave', async () => {
        // Arrange
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});
        const card = wrapper.findAll('[data-state]')[0];
        if (!card) throw new Error('no card');

        // Act
        await card.trigger('mouseenter');
        expect(card.attributes('data-state')).toBe('hovered');

        await card.trigger('mousedown');
        expect(card.attributes('data-state')).toBe('pressed');

        await card.trigger('mouseup');
        expect(card.attributes('data-state')).toBe('hovered');

        await card.trigger('mouseleave');
        expect(card.attributes('data-state')).toBe('idle');
    });

    it('should render the state badge text mirroring the data-state', async () => {
        // Arrange
        const wrapper = shallowMount(BrickShapes, {global: {stubs}});
        const card = wrapper.findAll('[data-state]')[0];
        if (!card) throw new Error('no card');

        // Act
        await card.trigger('mouseenter');

        // Assert — at least one badge in the page should now say HOVERED
        expect(wrapper.text()).toContain('HOVERED');
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
