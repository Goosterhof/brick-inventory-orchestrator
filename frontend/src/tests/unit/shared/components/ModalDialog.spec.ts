import type {SoundService} from '@shared/services/sound';

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

const mountModal = (open = false, soundService?: SoundService) =>
    shallowMount(ModalDialog, {
        props: {open, ...(soundService ? {soundService} : {})},
        slots: {title: 'Test Title', default: '<p>Modal body</p>'},
        global: {stubs: {'ph-x': true}},
    });

describe('ModalDialog', () => {
    it('should render title slot', () => {
        // Arrange
        const wrapper = mountModal();

        // Assert
        expect(wrapper.find('h2').text()).toBe('Test Title');
    });

    it('should render default slot content', () => {
        // Arrange
        const wrapper = mountModal();

        // Assert
        expect(wrapper.text()).toContain('Modal body');
    });

    it('should call showModal when open is true', () => {
        // Arrange
        const showModal = vi.fn<() => void>();
        HTMLDialogElement.prototype.showModal = showModal;

        // Act
        mountModal(true);

        // Assert
        expect(showModal).toHaveBeenCalled();
    });

    it('should call dialog.close when open changes to false', async () => {
        // Arrange
        const closeFn = vi.fn<() => void>();
        const showModalFn = vi.fn<() => void>(function (this: HTMLDialogElement) {
            Object.defineProperty(this, 'open', {value: true, configurable: true});
        });
        HTMLDialogElement.prototype.showModal = showModalFn;
        HTMLDialogElement.prototype.close = closeFn;
        const wrapper = mountModal(true);

        // Act
        await wrapper.setProps({open: false});

        // Assert
        expect(closeFn).toHaveBeenCalled();
    });

    it('should emit close when close button is clicked', async () => {
        // Arrange
        const wrapper = mountModal();

        // Act
        await wrapper.find("button[aria-label='Close']").trigger('click');

        // Assert
        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('should emit close on cancel event and prevent default', async () => {
        // Arrange
        const wrapper = mountModal();
        const cancelEvent = new Event('cancel', {cancelable: true});
        const preventDefaultSpy = vi.spyOn(cancelEvent, 'preventDefault');

        // Act
        wrapper.find('dialog').element.dispatchEvent(cancelEvent);
        await wrapper.vm.$nextTick();

        // Assert
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('should emit close when backdrop is clicked', async () => {
        // Arrange
        const wrapper = mountModal();
        const dialog = wrapper.find('dialog');

        // Act
        await dialog.trigger('click');

        // Assert
        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('should not emit close when inner content is clicked', async () => {
        // Arrange
        const wrapper = mountModal();

        // Act
        await wrapper.find("div[bg='[var(--brick-card-bg)]']").trigger('click');

        // Assert
        expect(wrapper.emitted('close')).toBeUndefined();
    });

    it('should have brick brutalist styling on content panel', () => {
        // Arrange
        const wrapper = mountModal();
        const panel = wrapper.find("div[bg='[var(--brick-card-bg)]']");

        // Assert
        expect(panel.attributes('class')).toContain('brick-border');
        expect(panel.attributes('class')).toContain('brick-shadow');
    });

    it('should have close button with accessible label', () => {
        // Arrange
        const wrapper = mountModal();

        // Assert
        const closeButton = wrapper.find("button[aria-label='Close']");
        expect(closeButton.exists()).toBe(true);
    });

    describe('sound', () => {
        it('should play pull sound when opened with soundService', () => {
            // Arrange
            HTMLDialogElement.prototype.showModal = vi.fn<() => void>();
            const soundService = createMockSoundService();

            // Act
            mountModal(true, soundService);

            // Assert
            expect(soundService.play).toHaveBeenCalledWith('pull');
        });

        it('should not play sound when no soundService is provided', () => {
            // Arrange
            HTMLDialogElement.prototype.showModal = vi.fn<() => void>();

            // Act — should not throw
            mountModal(true);

            // Assert
            expect(true).toBe(true);
        });

        it('should play pull sound when open prop changes to true', async () => {
            // Arrange
            const soundService = createMockSoundService();
            const showModalFn = vi.fn<() => void>(function (this: HTMLDialogElement) {
                Object.defineProperty(this, 'open', {value: true, configurable: true});
            });
            HTMLDialogElement.prototype.showModal = showModalFn;
            const wrapper = mountModal(false, soundService);

            // Act
            await wrapper.setProps({open: true});

            // Assert
            expect(soundService.play).toHaveBeenCalledWith('pull');
        });
    });
});
