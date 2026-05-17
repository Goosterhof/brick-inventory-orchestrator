import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';
import SnapDemo from '@/apps/showcase/components/SnapDemo.vue';

describe('SnapDemo', () => {
    const stubs = {SectionHeading};

    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});

        // Assert
        expect(wrapper.text()).toContain('03');
        expect(wrapper.text()).toContain('The Snap Principle');
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});

        // Assert
        expect(wrapper.find('section#snap').exists()).toBe(true);
    });

    it('should render all four interaction demos', () => {
        // Act
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});

        // Assert
        const labels = wrapper.findAll('.brick-label');
        const labelTexts = labels.map((l) => l.text());
        expect(labelTexts).toContain('Button');
        expect(labelTexts).toContain('Input');
        expect(labelTexts).toContain('Card');
        expect(labelTexts).toContain('Link');
    });

    it('should display all four state indicators as DEFAULT initially', () => {
        // Act
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});

        // Assert
        const stateIndicators = wrapper.findAll("[font='bold mono']").filter((el) => el.text() === 'DEFAULT');
        expect(stateIndicators).toHaveLength(4);
    });

    it('should update button state to HOVER on mouseenter', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const demoButton = wrapper.find('button[uppercase]');

        // Act
        await demoButton.trigger('mouseenter');

        // Assert
        expect(wrapper.text()).toContain('HOVER');
    });

    it('should reset button state to DEFAULT on mouseleave', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const demoButton = wrapper.find('button[uppercase]');

        await demoButton.trigger('mouseenter');
        expect(wrapper.text()).toContain('HOVER');

        // Act
        await demoButton.trigger('mouseleave');

        // Assert
        const stateIndicators = wrapper.findAll("[font='bold mono']").filter((el) => el.text() === 'DEFAULT');
        expect(stateIndicators).toHaveLength(4);
    });

    it('should update button state to FOCUS on focus', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const demoButton = wrapper.find('button[uppercase]');

        // Act
        await demoButton.trigger('focus');

        // Assert
        expect(wrapper.text()).toContain('FOCUS');
    });

    it('should reset button state to DEFAULT on blur', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const demoButton = wrapper.find('button[uppercase]');

        await demoButton.trigger('focus');

        // Act
        await demoButton.trigger('blur');

        // Assert
        const stateIndicators = wrapper.findAll("[font='bold mono']").filter((el) => el.text() === 'DEFAULT');
        expect(stateIndicators).toHaveLength(4);
    });

    it('should update button state to ACTIVE on mousedown', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const demoButton = wrapper.find('button[uppercase]');

        // Act
        await demoButton.trigger('mousedown');

        // Assert
        expect(wrapper.text()).toContain('ACTIVE');
    });

    it('should return button state to HOVER on mouseup', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const demoButton = wrapper.find('button[uppercase]');

        await demoButton.trigger('mousedown');

        // Act
        await demoButton.trigger('mouseup');

        // Assert
        expect(wrapper.text()).toContain('HOVER');
    });

    it('should update input state on focus and blur', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const input = wrapper.find('input');

        // Act
        await input.trigger('focus');

        // Assert
        expect(wrapper.text()).toContain('FOCUS');

        // Act
        await input.trigger('blur');

        // Assert — all states should be DEFAULT
        const stateIndicators = wrapper.findAll("[font='bold mono']").filter((el) => el.text() === 'DEFAULT');
        expect(stateIndicators).toHaveLength(4);
    });

    it('should update input state to HOVER on mouseenter and DEFAULT on mouseleave', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const input = wrapper.find('input');

        // Act
        await input.trigger('mouseenter');

        // Assert
        expect(wrapper.text()).toContain('HOVER');

        // Act
        await input.trigger('mouseleave');

        // Assert
        const stateIndicators = wrapper.findAll("[font='bold mono']").filter((el) => el.text() === 'DEFAULT');
        expect(stateIndicators).toHaveLength(4);
    });

    it('should update card state on mouseenter and mouseleave', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const card = wrapper.find("[tabindex='0']");

        // Act
        await card.trigger('mouseenter');

        // Assert
        expect(wrapper.text()).toContain('HOVER');

        // Act
        await card.trigger('mouseleave');

        // Assert — all states should be DEFAULT
        const stateIndicators = wrapper.findAll("[font='bold mono']").filter((el) => el.text() === 'DEFAULT');
        expect(stateIndicators).toHaveLength(4);
    });

    it('should update card state to ACTIVE on mousedown and HOVER on mouseup', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const card = wrapper.find("[tabindex='0']");

        // Act
        await card.trigger('mousedown');

        // Assert
        expect(wrapper.text()).toContain('ACTIVE');

        // Act
        await card.trigger('mouseup');

        // Assert
        expect(wrapper.text()).toContain('HOVER');
    });

    it('should update card state to FOCUS on focus and DEFAULT on blur', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const card = wrapper.find("[tabindex='0']");

        // Act
        await card.trigger('focus');

        // Assert
        expect(wrapper.text()).toContain('FOCUS');

        // Act
        await card.trigger('blur');

        // Assert
        const stateIndicators = wrapper.findAll("[font='bold mono']").filter((el) => el.text() === 'DEFAULT');
        expect(stateIndicators).toHaveLength(4);
    });

    it('should update link state on mouseenter and mouseleave', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const link = wrapper.find('a');

        // Act
        await link.trigger('mouseenter');

        // Assert
        expect(wrapper.text()).toContain('HOVER');

        // Act
        await link.trigger('mouseleave');

        // Assert — all states DEFAULT
        const stateIndicators = wrapper.findAll("[font='bold mono']").filter((el) => el.text() === 'DEFAULT');
        expect(stateIndicators).toHaveLength(4);
    });

    it('should update link state to ACTIVE on mousedown and HOVER on mouseup', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const link = wrapper.find('a');

        // Act
        await link.trigger('mousedown');

        // Assert
        expect(wrapper.text()).toContain('ACTIVE');

        // Act
        await link.trigger('mouseup');

        // Assert
        expect(wrapper.text()).toContain('HOVER');
    });

    it('should update link state to FOCUS on focus and DEFAULT on blur', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});
        const link = wrapper.find('a');

        // Act
        await link.trigger('focus');

        // Assert
        expect(wrapper.text()).toContain('FOCUS');

        // Act
        await link.trigger('blur');

        // Assert
        const stateIndicators = wrapper.findAll("[font='bold mono']").filter((el) => el.text() === 'DEFAULT');
        expect(stateIndicators).toHaveLength(4);
    });

    it('should display shadow value that matches the current button state', async () => {
        // Act
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});

        // Assert — default shadow
        expect(wrapper.text()).toContain('4px 4px 0px 0px rgba(0,0,0,1)');

        // Act — hover
        const demoButton = wrapper.find('button[uppercase]');
        await demoButton.trigger('mouseenter');

        // Assert — hover shadow
        expect(wrapper.text()).toContain('6px 6px 0px 0px rgba(0,0,0,1)');
    });

    it('should display decoration info for link that changes on hover', async () => {
        // Arrange
        const wrapper = shallowMount(SnapDemo, {global: {stubs}});

        // Assert — default
        expect(wrapper.text()).toContain('#000000');

        // Act
        const link = wrapper.find('a');
        await link.trigger('mouseenter');

        // Assert — hover shows yellow
        expect(wrapper.text()).toContain('#F5C518');
    });
});
