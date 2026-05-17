import CompletionGauge from '@app/domains/sets/components/CompletionGauge.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';

describe('CompletionGauge', () => {
    it('should render unknown state when percentage is null', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: null, unknownLabel: '?'}});

        // Assert
        const root = wrapper.get("[aria-label='set-completion-gauge']");
        expect(root.attributes('data-state')).toBe('unknown');
        expect(wrapper.text()).toBe('?');
    });

    it('should not render the filled bar when percentage is null', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: null, unknownLabel: '?'}});

        // Assert
        expect(wrapper.findAll('div').some((div) => div.attributes('style')?.includes('width'))).toBe(false);
    });

    it('should render empty state when percentage is zero', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: 0, unknownLabel: '?'}});

        // Assert
        const root = wrapper.get("[aria-label='set-completion-gauge']");
        expect(root.attributes('data-state')).toBe('empty');
        expect(wrapper.text()).toBe('0%');
    });

    it('should render partial state when percentage is between 0 and 100', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: 42, unknownLabel: '?'}});

        // Assert
        const root = wrapper.get("[aria-label='set-completion-gauge']");
        expect(root.attributes('data-state')).toBe('partial');
        expect(wrapper.text()).toBe('42%');
    });

    it('should render complete state when percentage is 100', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: 100, unknownLabel: '?'}});

        // Assert
        const root = wrapper.get("[aria-label='set-completion-gauge']");
        expect(root.attributes('data-state')).toBe('complete');
        expect(wrapper.text()).toBe('100%');
    });

    it('should treat percentages above 100 as complete and clamp bar width', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: 120, unknownLabel: '?'}});

        // Assert
        const root = wrapper.get("[aria-label='set-completion-gauge']");
        expect(root.attributes('data-state')).toBe('complete');
        const bar = wrapper.findAll('div').find((div) => div.attributes('style')?.includes('width'));
        expect(bar?.attributes('style')).toContain('width: 100%');
    });

    it('should treat negative percentages as empty and clamp bar width to zero', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: -5, unknownLabel: '?'}});

        // Assert
        const root = wrapper.get("[aria-label='set-completion-gauge']");
        expect(root.attributes('data-state')).toBe('empty');
        const bar = wrapper.findAll('div').find((div) => div.attributes('style')?.includes('width'));
        expect(bar?.attributes('style')).toContain('width: 0%');
    });

    it('should round fractional percentages in the label', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: 66.7, unknownLabel: '?'}});

        // Assert
        expect(wrapper.text()).toBe('67%');
    });

    it('should honor the unknownLabel prop', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: null, unknownLabel: 'Unknown'}});

        // Assert
        expect(wrapper.text()).toBe('Unknown');
    });

    it('should set the filled bar width proportional to the percentage', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: 33, unknownLabel: '?'}});

        // Assert
        const bar = wrapper.findAll('div').find((div) => div.attributes('style')?.includes('width'));
        expect(bar?.attributes('style')).toContain('width: 33%');
    });

    it('should apply the green bar color when complete', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: 100, unknownLabel: '?'}});

        // Assert
        const bar = wrapper.findAll('div').find((div) => div.attributes('bg') === 'baseplate-green');
        expect(bar).toBeDefined();
    });

    it('should apply the red bar color when empty', () => {
        // Arrange & Act — bar only renders when state !== "unknown"; 0% still renders the (zero-width) bar
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: 0, unknownLabel: '?'}});

        // Assert
        const bar = wrapper.findAll('div').find((div) => div.attributes('bg') === 'brick-red');
        expect(bar).toBeDefined();
    });

    it('should apply the yellow bar color when partial', () => {
        // Arrange & Act
        const wrapper = shallowMount(CompletionGauge, {props: {percentage: 50, unknownLabel: '?'}});

        // Assert
        const bar = wrapper.findAll('div').find((div) => div.attributes('bg') === 'brick-yellow');
        expect(bar).toBeDefined();
    });
});
