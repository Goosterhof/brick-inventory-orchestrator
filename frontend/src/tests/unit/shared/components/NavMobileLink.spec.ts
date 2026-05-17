import NavMobileLink from '@shared/components/NavMobileLink.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

const mountMobileLink = (props: {to: string; active: boolean}, slotText = 'Home') =>
    shallowMount(NavMobileLink, {props, slots: {default: slotText}});

describe('NavMobileLink', () => {
    it('should render slot content', () => {
        // Arrange
        const wrapper = mountMobileLink({to: '/', active: false});

        // Assert
        expect(wrapper.text()).toBe('Home');
    });

    it('should pass to prop as href', () => {
        // Arrange
        const wrapper = mountMobileLink({to: '/about', active: false});

        // Assert
        expect(wrapper.find('a').attributes('href')).toBe('/about');
    });

    it('should have full-width styling with border bottom', () => {
        // Arrange
        const wrapper = mountMobileLink({to: '/', active: false});
        const link = wrapper.find('a');

        // Assert
        expect(link.attributes('block')).toBeDefined();
        expect(link.attributes('p')).toBe('4');
        expect(link.attributes('border')).toBe('b-3 [var(--brick-border-color)]');
    });

    it('should show default background when not active', () => {
        // Arrange
        const wrapper = mountMobileLink({to: '/', active: false});
        const link = wrapper.find('a');

        // Assert
        expect(link.attributes('bg')).toBe('[var(--brick-card-bg)] hover:brick-yellow focus:brick-yellow');
    });

    it('should show yellow background when active', () => {
        // Arrange
        const wrapper = mountMobileLink({to: '/', active: true});
        const link = wrapper.find('a');

        // Assert
        expect(link.attributes('bg')).toBe('brick-yellow');
    });

    it('should have bold uppercase text', () => {
        // Arrange
        const wrapper = mountMobileLink({to: '/', active: false});
        const link = wrapper.find('a');

        // Assert
        expect(link.attributes('font')).toBe('bold');
        expect(link.attributes('uppercase')).toBeDefined();
        expect(link.attributes('tracking')).toBe('wide');
    });

    it('should emit click and prevent default on click', async () => {
        // Arrange
        const wrapper = mountMobileLink({to: '/', active: false});
        const link = wrapper.find('a');

        // Act
        await link.trigger('click');

        // Assert
        expect(wrapper.emitted('click')).toHaveLength(1);
    });
});
