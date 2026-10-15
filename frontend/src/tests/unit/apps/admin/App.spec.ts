import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';

import App from '../../../../apps/admin/App.vue';

const {mockGoToRoute} = vi.hoisted(() => ({mockGoToRoute: vi.fn<() => Promise<void>>()}));

vi.mock('../../../../apps/admin/router', () => ({
    AdminRouterView: {name: 'AdminRouterView', template: '<div><slot /></div>'},
    adminRouterService: {goToRoute: mockGoToRoute},
}));

describe('App', () => {
    it('should render header with Admin title', () => {
        // Arrange & Act
        const wrapper = shallowMount(App);

        // Assert
        const header = wrapper.find('header');
        expect(header.exists()).toBe(true);
        expect(header.text()).toContain('Admin');
    });

    it('should render Dashboard navigation link', () => {
        // Arrange & Act
        const wrapper = shallowMount(App);

        // Assert
        const navLink = wrapper.findComponent({name: 'NavLink'});
        expect(navLink.exists()).toBe(true);
        expect(navLink.props('to')).toBe('/');
        expect(navLink.text()).toBe('Dashboard');
    });

    it('should render AdminRouterView in main section', () => {
        // Arrange & Act
        const wrapper = shallowMount(App);

        // Assert
        const main = wrapper.find('main');
        expect(main.exists()).toBe(true);
        const routerView = wrapper.findComponent({name: 'AdminRouterView'});
        expect(routerView.exists()).toBe(true);
    });

    it('should call goToRoute when Dashboard link is clicked', async () => {
        // Arrange
        const wrapper = shallowMount(App);

        // Act
        await wrapper.findComponent({name: 'NavLink'}).trigger('click');

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('home');
    });
});
