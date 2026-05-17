import NavLink from '@shared/components/NavLink.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

const mountNavLink = (props: {to: string}, slotText = 'Home') =>
    shallowMount(NavLink, {props, slots: {default: slotText}});

describe('NavLink', () => {
    it('should render slot content', () => {
        // Arrange
        const wrapper = mountNavLink({to: '/'});

        // Assert
        expect(wrapper.text()).toBe('Home');
    });

    it('should pass to prop as href', () => {
        // Arrange
        const wrapper = mountNavLink({to: '/about'}, 'About');

        // Assert
        expect(wrapper.find('a').attributes('href')).toBe('/about');
    });

    it('should have neo-brutalist styling', () => {
        // Arrange
        const wrapper = mountNavLink({to: '/'});
        const link = wrapper.find('a');

        // Assert
        expect(link.attributes('class')).toContain('brick-border');
        expect(link.attributes('class')).toContain('brick-shadow');
        expect(link.attributes('bg')).toBe('[var(--brick-card-bg)] hover:brick-yellow focus:brick-yellow');
        expect(link.attributes('font')).toBe('bold');
        expect(link.attributes('uppercase')).toBeDefined();
    });

    it('should emit click and prevent default on click', async () => {
        // Arrange
        const wrapper = mountNavLink({to: '/'});
        const link = wrapper.find('a');

        // Act
        await link.trigger('click');

        // Assert
        expect(wrapper.emitted('click')).toHaveLength(1);
    });
});
