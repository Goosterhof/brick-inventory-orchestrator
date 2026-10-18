import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

import HomePage from '../../../../../../../apps/admin/domains/home/pages/HomePage.vue';

describe('HomePage', () => {
    it('should render the admin dashboard heading', () => {
        // Arrange & Act
        const wrapper = shallowMount(HomePage);

        // Assert
        expect(wrapper.find('h1').text()).toBe('Admin Dashboard');
    });
});
