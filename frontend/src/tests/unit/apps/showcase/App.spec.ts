import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';

import App from '../../../../apps/showcase/App.vue';

const {routerStub} = vi.hoisted(() => ({routerStub: {currentRouteRef: {value: {name: 'showcase'}}}}));

vi.mock('../../../../apps/showcase/router', () => ({
    ShowcaseRouterView: {name: 'ShowcaseRouterView', template: '<div />'},
    ShowcaseRouterLink: {name: 'ShowcaseRouterLink', props: ['to'], template: '<a><slot /></a>'},
    showcaseRouterService: routerStub,
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

    it('should mark the active link based on the current route name', () => {
        // Arrange
        routerStub.currentRouteRef.value.name = 'playground';

        // Act
        const wrapper = shallowMount(App);

        // Assert
        const playgroundLink = wrapper.findAllComponents({name: 'ShowcaseRouterLink'})[1];
        expect(playgroundLink?.classes()).toContain('bg-black');
    });
});
