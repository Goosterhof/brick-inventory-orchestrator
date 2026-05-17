import ToastMessage from '@shared/components/ToastMessage.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@phosphor-icons/vue', () => ({
    PhCheckCircle: {name: 'PhCheckCircle', template: '<i />'},
    PhWarningCircle: {name: 'PhWarningCircle', template: '<i />'},
    PhX: {name: 'PhX', template: '<i />'},
}));

const mountToast = (props: {message: string; variant?: 'success' | 'error'}) =>
    shallowMount(ToastMessage, {
        props,
        global: {stubs: {'ph-check-circle': true, 'ph-warning-circle': true, 'ph-x': true}},
    });

describe('ToastMessage', () => {
    it('should render message text', () => {
        // Arrange
        const wrapper = mountToast({message: 'Saved.'});

        // Assert
        expect(wrapper.text()).toContain('Saved.');
    });

    it('should default to success variant', () => {
        // Arrange
        const wrapper = mountToast({message: 'Done'});

        // Assert
        expect(wrapper.find('ph-check-circle-stub').exists()).toBe(true);
        expect(wrapper.find('ph-warning-circle-stub').exists()).toBe(false);
    });

    it('should render error variant with warning icon', () => {
        // Arrange
        const wrapper = mountToast({message: 'Failed', variant: 'error'});

        // Assert
        expect(wrapper.find('ph-warning-circle-stub').exists()).toBe(true);
        expect(wrapper.find('ph-check-circle-stub').exists()).toBe(false);
    });

    it('should have error styling for error variant', () => {
        // Arrange
        const wrapper = mountToast({message: 'Error', variant: 'error'});

        // Assert
        expect(wrapper.attributes('class')).toContain('border-brick-red');
        expect(wrapper.attributes('class')).toContain('brick-shadow-error');
    });

    it('should have brick brutalist styling for success variant', () => {
        // Arrange
        const wrapper = mountToast({message: 'OK'});

        // Assert
        expect(wrapper.attributes('class')).toContain('brick-border');
        expect(wrapper.attributes('class')).toContain('brick-shadow');
    });

    it('should emit close when dismiss button is clicked', async () => {
        // Arrange
        const wrapper = mountToast({message: 'Dismissable'});

        // Act
        await wrapper.find("button[aria-label='Dismiss']").trigger('click');

        // Assert
        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('should have accessible dismiss button', () => {
        // Arrange
        const wrapper = mountToast({message: 'Test'});

        // Assert
        const button = wrapper.find("button[aria-label='Dismiss']");
        expect(button.exists()).toBe(true);
    });
});
