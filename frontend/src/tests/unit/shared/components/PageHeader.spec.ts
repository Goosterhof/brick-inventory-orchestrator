import PageHeader from '@shared/components/PageHeader.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('PageHeader', () => {
    it('should render title', () => {
        // Arrange
        const wrapper = shallowMount(PageHeader, {props: {title: 'My Storage'}});

        // Assert
        expect(wrapper.find('h1').text()).toBe('My Storage');
    });

    it('should render slot content', () => {
        // Arrange
        const wrapper = shallowMount(PageHeader, {
            props: {title: 'Sets'},
            slots: {default: '<button>Add Set</button>'},
        });

        // Assert
        expect(wrapper.text()).toContain('Add Set');
    });

    it('should have layout styling', () => {
        // Arrange
        const wrapper = shallowMount(PageHeader, {props: {title: 'Storage'}});

        // Assert
        expect(wrapper.attributes('flex')).toBeDefined();
        expect(wrapper.attributes('justify')).toBe('between');
        expect(wrapper.attributes('items')).toBe('center');
    });
});
