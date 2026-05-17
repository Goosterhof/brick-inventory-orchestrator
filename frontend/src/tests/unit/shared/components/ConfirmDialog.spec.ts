import type {SoundService} from '@shared/services/sound';

import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import ModalDialog from '@shared/components/ModalDialog.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {computed} from 'vue';

vi.mock('@phosphor-icons/vue', () => ({PhX: {template: '<i />'}}));

const createMockSoundService = (): SoundService => ({
    play: vi.fn<SoundService['play']>(),
    isEnabled: computed(() => true),
    toggle: vi.fn<() => void>(),
});

const mountDialog = (open = false, slots?: Record<string, string>, soundService?: SoundService) =>
    shallowMount(ConfirmDialog, {
        props: {
            open,
            title: 'Delete Item',
            message: 'Are you sure you want to delete this?',
            ...(soundService ? {soundService} : {}),
        },
        slots,
    });

describe('ConfirmDialog', () => {
    describe('rendering', () => {
        it('should render title inside modal dialog', () => {
            // Arrange
            const wrapper = shallowMount(ConfirmDialog, {
                props: {open: false, title: 'Delete Item', message: 'Are you sure?'},
                global: {stubs: {'modal-dialog': false}},
            });

            // Assert
            expect(wrapper.find('h2').text()).toBe('Delete Item');
        });

        it('should render message text', () => {
            // Arrange
            const wrapper = mountDialog();

            // Assert
            expect(wrapper.text()).toContain('Are you sure you want to delete this?');
        });

        it('should render default confirm button text', () => {
            // Arrange
            const wrapper = mountDialog();

            // Assert
            expect(wrapper.text()).toContain('Confirm');
        });

        it('should render default cancel button text', () => {
            // Arrange
            const wrapper = mountDialog();

            // Assert
            expect(wrapper.text()).toContain('Cancel');
        });

        it('should render custom confirm slot content', () => {
            // Arrange
            const wrapper = mountDialog(false, {confirm: 'Delete Forever'});

            // Assert
            expect(wrapper.text()).toContain('Delete Forever');
        });

        it('should render custom cancel slot content', () => {
            // Arrange
            const wrapper = mountDialog(false, {cancel: 'Go Back'});

            // Assert
            expect(wrapper.text()).toContain('Go Back');
        });
    });

    describe('interactions', () => {
        it('should emit confirm when confirm button is clicked', async () => {
            // Arrange
            const wrapper = mountDialog();
            const buttons = wrapper.findAll('button');
            const confirmButton = buttons.find((btn) => btn.attributes('border')?.includes('brick-red'));

            // Act
            await confirmButton?.trigger('click');

            // Assert
            expect(wrapper.emitted('confirm')).toHaveLength(1);
        });

        it('should emit cancel when modal dialog emits close', async () => {
            // Arrange
            const wrapper = mountDialog();

            // Act
            wrapper.findComponent(ModalDialog).vm.$emit('close');
            await wrapper.vm.$nextTick();

            // Assert
            expect(wrapper.emitted('cancel')).toHaveLength(1);
        });

        it('should emit cancel when cancel button is clicked', async () => {
            // Arrange
            const wrapper = mountDialog();
            const buttons = wrapper.findAll('button');
            const cancelButton = buttons.find((btn) =>
                btn.attributes('class')?.includes('brick-shadow brick-transition'),
            );

            // Act
            await cancelButton?.trigger('click');

            // Assert
            expect(wrapper.emitted('cancel')).toHaveLength(1);
        });
    });

    describe('styling', () => {
        it('should have danger styling on confirm button', () => {
            // Arrange
            const wrapper = mountDialog();
            const buttons = wrapper.findAll('button');
            const confirmButton = buttons.find((btn) => btn.attributes('border')?.includes('brick-red'));

            // Assert
            expect(confirmButton?.exists()).toBe(true);
        });

        it('should pass open prop to ModalDialog', () => {
            // Arrange
            const wrapper = mountDialog(true);

            // Assert
            expect(wrapper.findComponent(ModalDialog).props('open')).toBe(true);
        });
    });

    describe('sound', () => {
        it('should play thud sound when confirm button is clicked with soundService', async () => {
            // Arrange
            const soundService = createMockSoundService();
            const wrapper = mountDialog(false, undefined, soundService);
            const buttons = wrapper.findAll('button');
            const confirmButton = buttons.find((btn) => btn.attributes('border')?.includes('brick-red'));

            // Act
            await confirmButton?.trigger('click');

            // Assert
            expect(soundService.play).toHaveBeenCalledWith('thud');
        });

        it('should pass soundService to ModalDialog', () => {
            // Arrange
            const soundService = createMockSoundService();
            const wrapper = mountDialog(false, undefined, soundService);

            // Assert
            expect(wrapper.findComponent(ModalDialog).props('soundService')).toBeTruthy();
        });

        it('should not play sound when confirm is clicked without soundService', async () => {
            // Arrange
            const wrapper = mountDialog();
            const buttons = wrapper.findAll('button');
            const confirmButton = buttons.find((btn) => btn.attributes('border')?.includes('brick-red'));

            // Act — should not throw
            await confirmButton?.trigger('click');

            // Assert
            expect(wrapper.emitted('confirm')).toHaveLength(1);
        });
    });
});
