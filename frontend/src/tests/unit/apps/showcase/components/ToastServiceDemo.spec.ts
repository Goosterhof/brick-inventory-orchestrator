import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import ToastServiceDemo from '@/apps/showcase/components/ToastServiceDemo.vue';

// Mock heavy shared components to cut import chain cost (ADR-010).
const {mkButtonStub, mkToastStub, mkStub} = vi.hoisted(() => ({
    mkButtonStub: (name: string) => ({
        name,
        props: {disabled: Boolean},
        emits: ['click'],
        template: `<button @click="$emit('click')" :disabled="disabled"><slot /></button>`,
    }),
    mkToastStub: () => ({
        name: 'ToastMessage',
        props: {message: String, variant: String},
        emits: ['close'],
        template: `<div>{{ message }}<button aria-label="Dismiss" @click="$emit('close')">x</button></div>`,
    }),
    mkStub: (name: string) => ({
        name,
        props: {number: String, title: String},
        template: `<div>{{ number }} {{ title }}</div>`,
    }),
}));

vi.mock('@shared/components/PrimaryButton.vue', () => ({default: mkButtonStub('PrimaryButton')}));
vi.mock('@shared/components/ToastMessage.vue', () => ({default: mkToastStub()}));
vi.mock('@/apps/showcase/components/SectionHeading.vue', () => ({default: mkStub('SectionHeading')}));

describe('ToastServiceDemo', () => {
    const stubs = {
        SectionHeading: false as const,
        PrimaryButton: false as const,
        ToastMessage: false as const,
        ToastContainer: false as const,
    };

    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('10');
        expect(wrapper.text()).toContain('Toast Service');
    });

    it('should render all demo subsections', () => {
        // Act
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        // Assert
        const labels = wrapper.findAll('.brick-label');
        const labelTexts = labels.map((l) => l.text());
        expect(labelTexts).toContain('Show Toasts');
        expect(labelTexts).toContain('FIFO Queue (max 4)');
        expect(labelTexts).toContain('Programmatic Hide');
        expect(labelTexts).toContain('Container Component');
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        // Assert
        expect(wrapper.find('section#toast-service').exists()).toBe(true);
    });

    it('should show a success toast when clicking Success Toast', async () => {
        // Arrange
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        // Act
        const successBtn = wrapper.findAll('button').find((b) => b.text() === 'Success Toast');
        await successBtn?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('Set added to your inventory.');
        expect(wrapper.text()).toContain('show() -> toast-0');
    });

    it('should show an error toast when clicking Error Toast', async () => {
        // Arrange
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        // Act
        const errorBtn = wrapper.findAll('button').find((b) => b.text() === 'Error Toast');
        await errorBtn?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('Could not connect to the brick vault.');
    });

    it('should enforce FIFO max of 4 when showing 6 toasts', async () => {
        // Arrange
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        // Act
        const showManyBtn = wrapper.findAll('button').find((b) => b.text() === 'Show 6 Toasts');
        await showManyBtn?.trigger('click');
        await nextTick();

        // Assert — the container should have at most 4 toasts (each ToastMessage has a dismiss button with aria-label="Dismiss")
        const toastContainer = wrapper.find('[fixed]');
        const dismissButtons = toastContainer.findAll('button[aria-label="Dismiss"]');
        expect(dismissButtons).toHaveLength(4);
    });

    it('should display last toast ID after showing a toast', async () => {
        // Arrange
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        // Act
        const showBtn = wrapper.findAll('button').find((b) => b.text() === 'Show Toast');
        await showBtn?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('Last ID: toast-');
    });

    it('should hide last toast and clear lastToastId when clicking Hide Last', async () => {
        // Arrange
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        const showBtn = wrapper.findAll('button').find((b) => b.text() === 'Show Toast');
        await showBtn?.trigger('click');
        await nextTick();
        expect(wrapper.text()).toContain('Last ID:');

        // Act
        const hideBtn = wrapper.findAll('button').find((b) => b.text() === 'Hide Last');
        await hideBtn?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).not.toContain('Last ID:');
    });

    it('should disable Hide Last button when no toast ID is available', () => {
        // Act
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        // Assert
        const hideBtn = wrapper.findAll('button').find((b) => b.text() === 'Hide Last');
        expect(hideBtn?.attributes('disabled')).toBeDefined();
    });

    it('should log hide events', async () => {
        // Arrange
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        const showBtn = wrapper.findAll('button').find((b) => b.text() === 'Show Toast');
        await showBtn?.trigger('click');
        await nextTick();

        // Act
        const hideBtn = wrapper.findAll('button').find((b) => b.text() === 'Hide Last');
        await hideBtn?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('hide(toast-');
    });

    it('should show and clear the event log', async () => {
        // Arrange
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        const successBtn = wrapper.findAll('button').find((b) => b.text() === 'Success Toast');
        await successBtn?.trigger('click');
        await nextTick();
        expect(wrapper.text()).toContain('Toast Events');

        // Act
        const clearBtn = wrapper.findAll('button').find((b) => b.text() === 'Clear');
        await clearBtn?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).not.toContain('Toast Events');
    });

    it('should render the container usage code snippet', () => {
        // Act
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        // Assert
        expect(wrapper.find('pre').text()).toContain('ToastContainerComponent');
    });

    it('should limit event log to 10 entries', async () => {
        // Arrange
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});
        const successBtn = wrapper.findAll('button').find((b) => b.text() === 'Success Toast');

        // Act — show 12 toasts to generate 12 log entries
        for (let i = 0; i < 12; i++) {
            await successBtn?.trigger('click');
        }
        await nextTick();

        // Assert — log entries (lines with "show() ->") should be capped at 10
        const allText = wrapper.text();
        const showEntries = allText.match(/show\(\) -> toast-/g);
        expect(showEntries?.length).toBeLessThanOrEqual(10);
    });

    it('should not attempt hide when lastToastId is null', async () => {
        // Arrange — show a toast and hide it so lastToastId becomes null
        const wrapper = shallowMount(ToastServiceDemo, {global: {stubs}});

        const showBtn = wrapper.findAll('button').find((b) => b.text() === 'Show Toast');
        await showBtn?.trigger('click');
        await nextTick();

        const hideBtn = wrapper.findAll('button').find((b) => b.text() === 'Hide Last');
        expect(hideBtn?.attributes('disabled')).toBeUndefined();
        await hideBtn?.trigger('click');
        await nextTick();

        // Now lastToastId is null, button should be disabled
        expect(hideBtn?.attributes('disabled')).toBeDefined();

        // Act — temporarily remove disabled to force the click through,
        // exercising the `if (lastToastId.value)` false branch.
        expect(hideBtn).toBeDefined();
        const btn = hideBtn as NonNullable<typeof hideBtn>;
        (btn.element as HTMLButtonElement).disabled = false;
        await btn.trigger('click');
        await nextTick();

        // Assert — no additional hide log (only the first hide)
        const hideEntries = wrapper.text().match(/hide\(toast-/g);
        expect(hideEntries).toHaveLength(1);
    });
});
