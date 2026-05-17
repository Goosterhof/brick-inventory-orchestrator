import type {VueWrapper} from '@vue/test-utils';

import ModalDialog from '@shared/components/ModalDialog.vue';
import {mount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

let wrapper: VueWrapper;
let container: HTMLDivElement;
let onClose: () => void;

const mountModal = (open = false) =>
    mount(ModalDialog, {
        props: {open, onClose},
        slots: {title: 'Test Title', default: '<p>Modal body</p>'},
        attachTo: container,
    });

describe('ModalDialog (browser)', () => {
    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        onClose = vi.fn<() => void>();
    });

    afterEach(() => {
        wrapper.unmount();
        container.remove();
    });

    describe('native dialog behavior', () => {
        it('should call showModal when open is true', () => {
            // Arrange & Act
            wrapper = mountModal(true);
            const dialog = wrapper.find('dialog').element as HTMLDialogElement;

            // Assert — in a real browser, showModal() sets the open attribute
            expect(dialog.open).toBe(true);
        });

        it('should not open dialog when open is false', () => {
            // Arrange & Act
            wrapper = mountModal(false);
            const dialog = wrapper.find('dialog').element as HTMLDialogElement;

            // Assert
            expect(dialog.open).toBe(false);
        });

        it('should close dialog when open transitions to false', async () => {
            // Arrange
            wrapper = mountModal(true);
            const dialog = wrapper.find('dialog').element as HTMLDialogElement;
            expect(dialog.open).toBe(true);

            // Act
            await wrapper.setProps({open: false});

            // Assert
            expect(dialog.open).toBe(false);
        });
    });

    describe('rendering', () => {
        it('should render title slot content', () => {
            // Arrange
            wrapper = mountModal(true);

            // Assert
            expect(wrapper.find('h2').text()).toBe('Test Title');
        });

        it('should render default slot content', () => {
            // Arrange
            wrapper = mountModal(true);

            // Assert
            expect(wrapper.text()).toContain('Modal body');
        });
    });

    describe('interactions', () => {
        it('should emit close when close button is clicked', async () => {
            // Arrange
            wrapper = mountModal(true);

            // Act
            await wrapper.find("button[aria-label='Close']").trigger('click');

            // Assert
            expect(onClose).toHaveBeenCalledOnce();
        });

        it('should emit close on cancel event and prevent default', async () => {
            // Arrange
            wrapper = mountModal(true);
            const dialog = wrapper.find('dialog').element as HTMLDialogElement;
            const cancelEvent = new Event('cancel', {cancelable: true});

            // Act
            dialog.dispatchEvent(cancelEvent);
            await wrapper.vm.$nextTick();

            // Assert
            expect(cancelEvent.defaultPrevented).toBe(true);
            expect(onClose).toHaveBeenCalledOnce();
        });

        it('should emit close when backdrop (dialog element) is clicked', async () => {
            // Arrange
            wrapper = mountModal(true);
            const dialog = wrapper.find('dialog');

            // Act
            await dialog.trigger('click');

            // Assert
            expect(onClose).toHaveBeenCalledOnce();
        });

        it('should not emit close when inner content is clicked', async () => {
            // Arrange
            wrapper = mountModal(true);

            // Act
            await wrapper.find("div[bg='white']").trigger('click');

            // Assert
            expect(onClose).not.toHaveBeenCalled();
        });
    });

    describe('accessibility', () => {
        it('should have close button with accessible label', () => {
            // Arrange
            wrapper = mountModal(true);

            // Assert
            const closeButton = wrapper.find("button[aria-label='Close']");
            expect(closeButton.exists()).toBe(true);
        });
    });
});
