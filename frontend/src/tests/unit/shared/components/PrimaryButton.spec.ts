import type {SoundService} from '@shared/services/sound';

import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {computed} from 'vue';

describe('PrimaryButton', () => {
    it('should render slot content', () => {
        // Arrange
        const wrapper = shallowMount(PrimaryButton, {slots: {default: 'Save'}});

        // Assert
        expect(wrapper.text()).toBe('Save');
    });

    it('should default type to button', () => {
        // Arrange
        const wrapper = shallowMount(PrimaryButton, {slots: {default: 'Click'}});

        // Assert
        expect(wrapper.attributes('type')).toBe('button');
    });

    it('should accept submit type', () => {
        // Arrange
        const wrapper = shallowMount(PrimaryButton, {props: {type: 'submit'}, slots: {default: 'Submit'}});

        // Assert
        expect(wrapper.attributes('type')).toBe('submit');
    });

    it('should not be disabled by default', () => {
        // Arrange
        const wrapper = shallowMount(PrimaryButton, {slots: {default: 'Click'}});

        // Assert
        expect(wrapper.attributes('disabled')).toBeUndefined();
    });

    it('should be disabled when prop is set', () => {
        // Arrange
        const wrapper = shallowMount(PrimaryButton, {props: {disabled: true}, slots: {default: 'Click'}});

        // Assert
        expect(wrapper.attributes('disabled')).toBeDefined();
    });

    it('should have neo-brutalist styling', () => {
        // Arrange
        const wrapper = shallowMount(PrimaryButton, {slots: {default: 'Click'}});

        // Assert
        expect(wrapper.attributes('class')).toContain('brick-border');
        expect(wrapper.attributes('class')).toContain('brick-shadow');
        expect(wrapper.attributes('bg')).toBe(
            '[var(--brick-border-color)] hover:brick-yellow focus:brick-yellow disabled:[var(--brick-surface-subtle)]',
        );
        expect(wrapper.attributes('text')).toBe(
            '[var(--brick-page-bg)] hover:[var(--brick-page-text)] focus:[var(--brick-page-text)] disabled:[var(--brick-muted-text)]',
        );
        expect(wrapper.attributes('font')).toBe('bold');
        expect(wrapper.attributes('uppercase')).toBeDefined();
    });

    describe('sound', () => {
        it('should play snap sound on click when soundService is provided', async () => {
            // Arrange
            const mockPlay = vi.fn<SoundService['play']>();
            const mockSoundService: SoundService = {
                play: mockPlay,
                isEnabled: computed(() => true),
                toggle: vi.fn<() => void>(),
            };
            const wrapper = shallowMount(PrimaryButton, {
                props: {soundService: mockSoundService},
                slots: {default: 'Click'},
            });

            // Act
            await wrapper.trigger('click');

            // Assert
            expect(mockPlay).toHaveBeenCalledWith('snap');
        });

        it('should not play sound when silent prop is true', async () => {
            // Arrange
            const mockPlay = vi.fn<SoundService['play']>();
            const mockSoundService: SoundService = {
                play: mockPlay,
                isEnabled: computed(() => true),
                toggle: vi.fn<() => void>(),
            };
            const wrapper = shallowMount(PrimaryButton, {
                props: {silent: true, soundService: mockSoundService},
                slots: {default: 'Click'},
            });

            // Act
            await wrapper.trigger('click');

            // Assert
            expect(mockPlay).not.toHaveBeenCalled();
        });

        it('should not play sound when no soundService is provided', async () => {
            // Arrange
            const wrapper = shallowMount(PrimaryButton, {slots: {default: 'Click'}});

            // Act — should not throw
            await wrapper.trigger('click');

            // Assert
            expect(wrapper.text()).toBe('Click');
        });
    });
});
