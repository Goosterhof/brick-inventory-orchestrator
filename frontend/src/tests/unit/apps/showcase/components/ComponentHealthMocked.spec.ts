import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import ComponentHealth from '@/apps/showcase/components/ComponentHealth.vue';
import SectionHeading from '@/apps/showcase/components/SectionHeading.vue';

vi.mock('@shared/generated/component-registry.json', () => ({
    default: {
        meta: {componentCount: 2, churnWindowDays: 30},
        components: {
            EmptyWidget: {
                path: 'src/shared/components/EmptyWidget.vue',
                category: null,
                consumers: {showcase: {_root: ['App.vue']}},
                adoption: {apps: 1, domains: 1},
                apiSurface: {props: [], emits: [], slots: [], models: []},
                churn: {commits: 0, linesChanged: 0},
                dependencyDepth: 0,
            },
            ModelWidget: {
                path: 'src/shared/components/ModelWidget.vue',
                category: null,
                consumers: {families: {sets: ['SetsPage.vue']}, admin: {_root: ['App.vue']}},
                adoption: {apps: 2, domains: 2},
                apiSurface: {
                    props: [{name: 'label', required: true}],
                    emits: [{name: 'change'}],
                    slots: [{name: 'default'}],
                    models: [
                        {name: 'requiredModel', required: true},
                        {name: 'optionalModel', required: false},
                    ],
                },
                churn: {commits: 5, linesChanged: 100},
                dependencyDepth: 2,
            },
        },
    },
}));

describe('ComponentHealth (mocked registry)', () => {
    const stubs = {SectionHeading};

    it('should render non-required model without asterisk and required model with asterisk', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentHealth, {global: {stubs}});

        // Act — expand ModelWidget
        const buttons = wrapper.findAll('button');
        const modelButton = buttons.find((b) => b.text().includes('ModelWidget'));
        expect(modelButton).toBeDefined();
        await modelButton?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('requiredModel*');
        expect(wrapper.text()).toContain('optionalModel');
        expect(wrapper.text()).not.toContain('optionalModel*');
    });

    it('should show zero API surface message for EmptyWidget', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentHealth, {global: {stubs}});

        // Act — expand EmptyWidget
        const buttons = wrapper.findAll('button');
        const emptyButton = buttons.find((b) => b.text().includes('EmptyWidget'));
        await emptyButton?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('No props, emits, slots, or models');
    });

    it('should highlight churn badge when commits match max and max is above 1', () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs}});

        // Assert — ModelWidget has 5 commits which equals maxChurnCommits
        // The churn badge should render with highlight background
        expect(wrapper.text()).toContain('5c / 100L');
    });

    it('should show depth badge for composite components only', () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs}});

        // Assert — ModelWidget has depth 2, EmptyWidget has depth 0
        const depthBadges = wrapper.findAll('span').filter((s) => /^d\d+$/.test(s.text()));
        expect(depthBadges).toHaveLength(1);
        expect(depthBadges[0]?.text()).toBe('d2');
    });

    it('should highlight multi-app components in adoption badge', () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs}});

        // Assert — summary shows 1 multi-app component
        expect(wrapper.text()).toContain('1'); // multiAppCount
    });

    it('should show domain names and file names in consumer map', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentHealth, {global: {stubs}});

        // Act — expand ModelWidget to see consumer map
        const buttons = wrapper.findAll('button');
        const modelButton = buttons.find((b) => b.text().includes('ModelWidget'));
        await modelButton?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('families');
        expect(wrapper.text()).toContain('sets');
        expect(wrapper.text()).toContain('SetsPage.vue');
        expect(wrapper.text()).toContain('admin');
        expect(wrapper.text()).toContain('(root)');
        expect(wrapper.text()).toContain('App.vue');
    });
});
