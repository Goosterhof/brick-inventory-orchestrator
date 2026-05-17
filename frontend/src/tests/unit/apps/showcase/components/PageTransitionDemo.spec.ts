import {shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import PageTransitionDemo from '@/apps/showcase/components/PageTransitionDemo.vue';

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

describe('PageTransitionDemo', () => {
    const stubs = {PageTransition: false};

    beforeEach(() => {
        Object.defineProperty(window, 'matchMedia', {writable: true, value: createMockMatchMedia(false).matchMedia});
    });

    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert
        const heading = wrapper.findComponent({name: 'SectionHeading'});
        expect(heading.exists()).toBe(true);
        expect(heading.props('number')).toBe('15');
        expect(heading.props('title')).toBe('Page Transitions');
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert
        expect(wrapper.find('section#page-transitions').exists()).toBe(true);
    });

    it('should render variant selector buttons', () => {
        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('brick-snap');
        expect(wrapper.text()).toContain('brick-lift');
    });

    it('should render all four navigation tabs', () => {
        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('Home');
        expect(wrapper.text()).toContain('Sets');
        expect(wrapper.text()).toContain('Storage');
        expect(wrapper.text()).toContain('Parts');
    });

    it('should show Home as the default active page', () => {
        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert
        const previewArea = wrapper.find("[m='b-2']");
        expect(previewArea.text()).toBe('Home');
    });

    it('should display brick-snap parameters by default', () => {
        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('brick-snap');
        expect(wrapper.text()).toContain('220ms');
        expect(wrapper.text()).toContain('140ms');
        expect(wrapper.text()).toContain('cubic-bezier(0.2, 0, 0, 1)');
    });

    it('should navigate to a different page when tab is clicked', async () => {
        // Arrange
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});
        const navButtons = wrapper.findAll('button[uppercase]');
        const setsButton = navButtons.find((b) => b.text() === 'Sets');

        // Act
        await setsButton?.trigger('click');

        // Assert
        const previewArea = wrapper.find("[m='b-2']");
        expect(previewArea.text()).toBe('Sets');
    });

    it('should switch variant when variant button is clicked', async () => {
        // Arrange
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});
        const variantButtons = wrapper.findAll("[font='bold mono']");
        const liftButton = variantButtons.find((b) => b.text() === 'brick-lift');

        // Act
        await liftButton?.trigger('click');

        // Assert — parameters should show brick-lift values
        expect(wrapper.text()).toContain('200ms');
    });

    it('should display the variant comparison table', () => {
        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert
        expect(wrapper.find('table').exists()).toBe(true);
        expect(wrapper.text()).toContain('Variant Comparison');
        expect(wrapper.text()).toContain('Enter');
        expect(wrapper.text()).toContain('Leave');
        expect(wrapper.text()).toContain('Easing');
    });

    it('should show variant comparison table with correct values', () => {
        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('translateY(12px)');
        expect(wrapper.text()).toContain('translateY(-12px)');
        expect(wrapper.text()).toContain('translateY(-4px)');
    });

    it('should display brick-lift parameters when variant is switched', async () => {
        // Arrange
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});
        const variantButtons = wrapper.findAll("[font='bold mono']");
        const liftButton = variantButtons.find((b) => b.text() === 'brick-lift');

        // Act
        await liftButton?.trigger('click');

        // Assert
        expect(wrapper.text()).toContain('brick-lift');
        expect(wrapper.text()).toContain('200ms');
        expect(wrapper.text()).toContain('12px (up on enter, down on leave)');
    });

    it('should include the PageTransition component in the live preview', () => {
        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert
        const pageTransition = wrapper.findComponent({name: 'PageTransition'});
        expect(pageTransition.exists()).toBe(true);
    });

    it('should render descriptive text about route transitions', () => {
        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('Route changes feel like bricks clicking into place');
    });

    it('should not show reduced motion indicator when motion is not reduced', () => {
        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert
        expect(wrapper.text()).not.toContain('prefers-reduced-motion: reduce');
    });

    it('should show reduced motion indicator when reduced motion is preferred', async () => {
        // Arrange
        Object.defineProperty(window, 'matchMedia', {writable: true, value: createMockMatchMedia(true).matchMedia});

        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('prefers-reduced-motion: reduce');
        expect(wrapper.text()).toContain('all animations disabled');
    });

    it('should show brick-none parameters when reduced motion is preferred', async () => {
        // Arrange
        Object.defineProperty(window, 'matchMedia', {writable: true, value: createMockMatchMedia(true).matchMedia});

        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('brick-none');
        expect(wrapper.text()).toContain('0ms');
        expect(wrapper.text()).toContain('0px');
    });

    it('should navigate through all pages', async () => {
        // Arrange
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});
        const navButtons = wrapper.findAll('button[uppercase]');

        for (const page of ['Sets', 'Storage', 'Parts']) {
            const button = navButtons.find((b) => b.text() === page);

            // Act
            await button?.trigger('click');

            // Assert
            const previewArea = wrapper.find("[m='b-2']");
            expect(previewArea.text()).toBe(page);
        }
    });

    it('should highlight the selected variant button', async () => {
        // Arrange
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});
        const variantButtons = wrapper.findAll("[font='bold mono']");
        const snapButton = variantButtons.find((b) => b.text() === 'brick-snap');
        const liftButton = variantButtons.find((b) => b.text() === 'brick-lift');

        // Assert — snap is selected by default
        expect(snapButton?.attributes('bg')).toContain('brick-yellow');
        expect(liftButton?.attributes('bg')).not.toContain('brick-yellow');

        // Act — switch to lift
        await liftButton?.trigger('click');

        // Assert
        const updatedVariantButtons = wrapper.findAll("[font='bold mono']");
        const updatedSnapButton = updatedVariantButtons.find((b) => b.text() === 'brick-snap');
        const updatedLiftButton = updatedVariantButtons.find((b) => b.text() === 'brick-lift');
        expect(updatedLiftButton?.attributes('bg')).toContain('brick-yellow');
        expect(updatedSnapButton?.attributes('bg')).not.toContain('brick-yellow');
    });

    it('should respond to live changes in prefers-reduced-motion media query', async () => {
        // Arrange
        const {matchMedia, handlers} = createMockMatchMedia(false);
        Object.defineProperty(window, 'matchMedia', {writable: true, value: matchMedia});

        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert — initially no reduced motion
        expect(wrapper.text()).not.toContain('prefers-reduced-motion: reduce');

        // Act — simulate system preference change
        for (const handler of handlers) {
            handler({matches: true});
        }
        await nextTick();

        // Assert — reduced motion indicator should now appear
        expect(wrapper.text()).toContain('prefers-reduced-motion: reduce');
        expect(wrapper.text()).toContain('brick-none');
    });

    it('should default to no reduced motion when matchMedia is unavailable', () => {
        // Arrange — simulate environment where matchMedia is not available
        Object.defineProperty(window, 'matchMedia', {writable: true, value: undefined});

        // Act
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});

        // Assert — defaults to false (no reduced motion), shows brick-snap parameters
        expect(wrapper.text()).not.toContain('prefers-reduced-motion: reduce');
        expect(wrapper.text()).toContain('brick-snap');
    });

    it('should highlight the active navigation tab', async () => {
        // Arrange
        const wrapper = shallowMount(PageTransitionDemo, {global: {stubs}});
        const navButtons = wrapper.findAll('button[uppercase]');
        const homeTab = navButtons.find((b) => b.text() === 'Home');

        // Assert — Home is active by default
        expect(homeTab?.attributes('bg')).toContain('brick-yellow');

        // Act — switch to Sets
        const setsTab = navButtons.find((b) => b.text() === 'Sets');
        await setsTab?.trigger('click');

        // Assert
        const updatedNavButtons = wrapper.findAll('button[uppercase]');
        const updatedHomeTab = updatedNavButtons.find((b) => b.text() === 'Home');
        const updatedSetsTab = updatedNavButtons.find((b) => b.text() === 'Sets');
        expect(updatedSetsTab?.attributes('bg')).toContain('brick-yellow');
        expect(updatedHomeTab?.attributes('bg')).not.toContain('brick-yellow');
    });
});
