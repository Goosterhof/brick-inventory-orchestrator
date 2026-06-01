import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import App from '../../../../apps/showcase/App.vue';

// A REAL ref() — not a plain object — so the active-link test actually exercises the reactivity
// the migration introduced (App.vue reads `currentRouteRef.value.name` through a computed). Created
// inside an async vi.hoisted with a dynamic import because `ref` is unavailable in the hoisted scope
// (the hoisted block runs before the file's own imports resolve).
const {currentRouteRef} = await vi.hoisted(async () => {
    const {ref} = await import('vue');

    return {currentRouteRef: ref({name: 'showcase'})};
});

vi.mock('../../../../apps/showcase/router', () => ({
    ShowcaseRouterView: {name: 'ShowcaseRouterView', template: '<div />'},
    ShowcaseRouterLink: {name: 'ShowcaseRouterLink', props: ['to'], template: '<a><slot /></a>'},
    showcaseRouterService: {currentRouteRef},
}));

describe('App', () => {
    it('should render the Brick & Mortar brand label', () => {
        // Arrange & Act
        const wrapper = shallowMount(App);

        // Assert
        expect(wrapper.find('nav').text()).toContain('Brick & Mortar');
    });

    it('should render both showcase navigation links', () => {
        // Arrange & Act
        const wrapper = shallowMount(App);

        // Assert
        const links = wrapper.findAllComponents({name: 'ShowcaseRouterLink'});
        expect(links).toHaveLength(2);
        expect(links[0]?.props('to')).toStrictEqual({name: 'showcase'});
        expect(links[1]?.props('to')).toStrictEqual({name: 'playground'});
    });

    it('should render the ShowcaseRouterView', () => {
        // Arrange & Act
        const wrapper = shallowMount(App);

        // Assert
        expect(wrapper.findComponent({name: 'ShowcaseRouterView'}).exists()).toBe(true);
    });

    it('should move the active highlight when the route changes after mount', async () => {
        // Arrange — mount with 'showcase' active
        currentRouteRef.value.name = 'showcase';
        const wrapper = shallowMount(App);
        const [showcaseLink, playgroundLink] = wrapper.findAllComponents({name: 'ShowcaseRouterLink'});
        expect(showcaseLink?.classes()).toContain('bg-black');
        expect(playgroundLink?.classes()).not.toContain('bg-black');

        // Act — the current route changes AFTER mount (the reactivity the migration relies on)
        currentRouteRef.value.name = 'playground';
        await nextTick();

        // Assert — the highlight tracked the change and moved to the playground link
        expect(showcaseLink?.classes()).not.toContain('bg-black');
        expect(playgroundLink?.classes()).toContain('bg-black');
    });
});
