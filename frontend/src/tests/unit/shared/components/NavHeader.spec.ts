import NavHeader from '@shared/components/NavHeader.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@phosphor-icons/vue', () => ({
    PhList: {name: 'PhList', template: '<i />'},
    PhX: {name: 'PhX', template: '<i />'},
}));

const mountNavHeader = (slots?: Record<string, string>) =>
    shallowMount(NavHeader, {
        slots: {
            links: '<a>Home</a>',
            'mobile-links': '<a class="mobile-link">Home</a>',
            actions: '<button>Logout</button>',
            ...slots,
        },
        global: {stubs: {'ph-list': true, 'ph-x': true}},
    });

describe('NavHeader', () => {
    it('should render desktop links slot', () => {
        // Arrange
        const wrapper = mountNavHeader();

        // Assert
        const desktopNav = wrapper.find('nav').findAll('div')[0];
        expect(desktopNav?.text()).toContain('Home');
    });

    it('should render actions slot', () => {
        // Arrange
        const wrapper = mountNavHeader();

        // Assert
        expect(wrapper.text()).toContain('Logout');
    });

    it('should show hamburger icon when menu is closed', () => {
        // Arrange
        const wrapper = mountNavHeader();

        // Assert
        expect(wrapper.find('ph-list-stub').exists()).toBe(true);
        expect(wrapper.find('ph-x-stub').exists()).toBe(false);
    });

    it('should show X icon when menu is open', async () => {
        // Arrange
        const wrapper = mountNavHeader();

        // Act
        await wrapper.find("button[aria-label='Menu']").trigger('click');

        // Assert
        expect(wrapper.find('ph-x-stub').exists()).toBe(true);
        expect(wrapper.find('ph-list-stub').exists()).toBe(false);
    });

    it('should toggle aria-expanded on hamburger click', async () => {
        // Arrange
        const wrapper = mountNavHeader();
        const hamburger = wrapper.find("button[aria-label='Menu']");

        // Assert initial state
        expect(hamburger.attributes('aria-expanded')).toBe('false');

        // Act
        await hamburger.trigger('click');

        // Assert
        expect(hamburger.attributes('aria-expanded')).toBe('true');
    });

    it('should expand mobile menu panel when open', async () => {
        // Arrange
        const wrapper = mountNavHeader();

        // Act
        await wrapper.find("button[aria-label='Menu']").trigger('click');

        // Assert
        const mobileMenu = wrapper.find('#mobile-menu');
        expect(mobileMenu.classes()).toContain('grid-rows-[1fr]');
    });

    it('should collapse mobile menu panel when closed', () => {
        // Arrange
        const wrapper = mountNavHeader();

        // Assert
        const mobileMenu = wrapper.find('#mobile-menu');
        expect(mobileMenu.classes()).toContain('grid-rows-[0fr]');
    });

    it('should close menu when mobile-links area is clicked', async () => {
        // Arrange
        const wrapper = mountNavHeader();
        await wrapper.find("button[aria-label='Menu']").trigger('click');

        // Act
        await wrapper.find('.mobile-link').trigger('click');

        // Assert
        const mobileMenu = wrapper.find('#mobile-menu');
        expect(mobileMenu.classes()).toContain('grid-rows-[0fr]');
    });

    it('should close menu when mobile links area is clicked', async () => {
        // Arrange
        const wrapper = mountNavHeader();
        await wrapper.find("button[aria-label='Menu']").trigger('click');

        // Act
        await wrapper.find("#mobile-menu div[border='t-3 [var(--brick-border-color)]']").trigger('click');
        await wrapper.vm.$nextTick();

        // Assert
        const mobileMenu = wrapper.find('#mobile-menu');
        expect(mobileMenu.classes()).toContain('grid-rows-[0fr]');
    });

    it('should have 44px minimum hamburger button', () => {
        // Arrange
        const wrapper = mountNavHeader();
        const hamburger = wrapper.find("button[aria-label='Menu']");

        // Assert — w-11 = 44px, h-11 = 44px
        expect(hamburger.attributes('w')).toBe('11');
        expect(hamburger.attributes('h')).toBe('11');
    });

    it('should have brick styling on hamburger button', () => {
        // Arrange
        const wrapper = mountNavHeader();
        const hamburger = wrapper.find("button[aria-label='Menu']");

        // Assert
        expect(hamburger.classes()).toContain('brick-border');
        expect(hamburger.classes()).toContain('brick-shadow');
    });

    it('should show pressed state on hamburger when menu is open', async () => {
        // Arrange
        const wrapper = mountNavHeader();

        // Act
        await wrapper.find("button[aria-label='Menu']").trigger('click');

        // Assert
        const hamburger = wrapper.find("button[aria-label='Menu']");
        expect(hamburger.classes()).toContain('brick-shadow-active');
        expect(hamburger.classes()).toContain('translate-x-[2px]');
        expect(hamburger.classes()).toContain('translate-y-[2px]');
    });

    it('should have border on header', () => {
        // Arrange
        const wrapper = mountNavHeader();

        // Assert
        expect(wrapper.find('header').attributes('border')).toBe('b-3 [var(--brick-border-color)]');
    });
});
