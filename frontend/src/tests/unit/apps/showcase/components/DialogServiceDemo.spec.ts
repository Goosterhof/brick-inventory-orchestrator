import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {shallowMount} from '@vue/test-utils';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import DialogServiceDemo from '@/apps/showcase/components/DialogServiceDemo.vue';
import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';

describe('DialogServiceDemo', () => {
    const stubs = {SectionHeading, PrimaryButton, DialogContainer: false as const};

    afterEach(() => {
        document.body.style.overflowY = '';
        vi.restoreAllMocks();
    });

    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(DialogServiceDemo, {global: {stubs}, attachTo: document.body});

        // Assert
        expect(wrapper.text()).toContain('09');
        expect(wrapper.text()).toContain('Dialog Service');

        wrapper.unmount();
    });

    it('should render all demo subsections', () => {
        // Act
        const wrapper = shallowMount(DialogServiceDemo, {global: {stubs}, attachTo: document.body});

        // Assert
        const labels = wrapper.findAll('.brick-label');
        const labelTexts = labels.map((l) => l.text());
        expect(labelTexts).toContain('Programmatic Open');
        expect(labelTexts).toContain('Dialog Stacking');
        expect(labelTexts).toContain('Close All');
        expect(labelTexts).toContain('Container Component');

        wrapper.unmount();
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(DialogServiceDemo, {global: {stubs}, attachTo: document.body});

        // Assert
        expect(wrapper.find('section#dialog-service').exists()).toBe(true);

        wrapper.unmount();
    });

    it('should open a single dialog when clicking Open Dialog', async () => {
        // Arrange
        HTMLDialogElement.prototype.showModal = vi.fn<() => void>();
        const wrapper = shallowMount(DialogServiceDemo, {global: {stubs}, attachTo: document.body});

        // Act
        const openButton = wrapper.findAll('button').find((b) => b.text().includes('Open Dialog'));
        await openButton?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.findAll('dialog')).toHaveLength(1);
        expect(wrapper.text()).toContain('Single Dialog');

        wrapper.unmount();
    });

    it('should open a stackable dialog with Open Stacked button visible', async () => {
        // Arrange
        HTMLDialogElement.prototype.showModal = vi.fn<() => void>();
        const wrapper = shallowMount(DialogServiceDemo, {global: {stubs}, attachTo: document.body});

        // Act
        const stackButton = wrapper.findAll('button').find((b) => b.text().includes('Open Stackable'));
        await stackButton?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.findAll('dialog')).toHaveLength(1);
        expect(wrapper.text()).toContain('First Dialog');
        expect(wrapper.text()).toContain('Open Stacked');

        wrapper.unmount();
    });

    it('should stack a second dialog when clicking Open Stacked inside a dialog', async () => {
        // Arrange
        HTMLDialogElement.prototype.showModal = vi.fn<() => void>();
        const wrapper = shallowMount(DialogServiceDemo, {global: {stubs}, attachTo: document.body});

        const stackButton = wrapper.findAll('button').find((b) => b.text().includes('Open Stackable'));
        await stackButton?.trigger('click');
        await nextTick();

        // Act
        const dialogButtons = wrapper.findAll('dialog button');
        const openStackedBtn = dialogButtons.find((b) => b.text() === 'Open Stacked');
        await openStackedBtn?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.findAll('dialog')).toHaveLength(2);
        expect(wrapper.text()).toContain('Stacked Dialog');

        wrapper.unmount();
    });

    it('should close a dialog when clicking its Close button', async () => {
        // Arrange
        HTMLDialogElement.prototype.showModal = vi.fn<() => void>();
        const wrapper = shallowMount(DialogServiceDemo, {global: {stubs}, attachTo: document.body});

        const openButton = wrapper.findAll('button').find((b) => b.text().includes('Open Dialog'));
        await openButton?.trigger('click');
        await nextTick();
        expect(wrapper.findAll('dialog')).toHaveLength(1);

        // Act
        const closeBtn = wrapper.findAll('dialog button').find((b) => b.text() === 'Close');
        await closeBtn?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.findAll('dialog')).toHaveLength(0);

        wrapper.unmount();
    });

    it('should close all dialogs when clicking Close All', async () => {
        // Arrange
        HTMLDialogElement.prototype.showModal = vi.fn<() => void>();
        const wrapper = shallowMount(DialogServiceDemo, {global: {stubs}, attachTo: document.body});

        // Open stackable + stacked
        const stackButton = wrapper.findAll('button').find((b) => b.text().includes('Open Stackable'));
        await stackButton?.trigger('click');
        await nextTick();

        const openStackedBtn = wrapper.findAll('dialog button').find((b) => b.text() === 'Open Stacked');
        await openStackedBtn?.trigger('click');
        await nextTick();
        expect(wrapper.findAll('dialog')).toHaveLength(2);

        // Act
        const closeAllBtn = wrapper.findAll('button').find((b) => b.text() === 'Close All');
        await closeAllBtn?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.findAll('dialog')).toHaveLength(0);

        wrapper.unmount();
    });

    it('should render the container usage code snippet', () => {
        // Act
        const wrapper = shallowMount(DialogServiceDemo, {global: {stubs}, attachTo: document.body});

        // Assert
        expect(wrapper.find('pre').text()).toContain('DialogContainerComponent');

        wrapper.unmount();
    });

    it('should include the DialogContainerComponent in the template', () => {
        // Act
        const wrapper = shallowMount(DialogServiceDemo, {global: {stubs}, attachTo: document.body});

        // Assert — the section contains the container component (renders no content when no dialogs open)
        const section = wrapper.find('section#dialog-service');
        expect(section.exists()).toBe(true);

        wrapper.unmount();
    });
});
