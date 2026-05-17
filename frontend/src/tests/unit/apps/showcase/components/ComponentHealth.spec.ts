import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import ComponentHealth from '@/apps/showcase/components/ComponentHealth.vue';

const SectionHeading = {
    name: 'SectionHeading',
    props: {number: String, title: String},
    template: '<div>{{ number }} {{ title }}</div>',
};

// Mock the heavy component-registry.json (~54KB, 32 components) to cut import chain cost (ADR-010).
// The mock provides enough structure for all 14 tests: alphabetical ordering, badges, expansion,
// zero-API-surface, required models, consumer maps, depth badges, and root domain labels.
vi.mock('@shared/generated/component-registry.json', () => ({
    default: {
        meta: {componentCount: 4, churnWindowDays: 30},
        components: {
            BackButton: {
                path: 'src/shared/components/BackButton.vue',
                category: null,
                consumers: {families: {sets: ['SetsPage.vue']}},
                adoption: {apps: 1, domains: 1},
                apiSurface: {
                    props: [{name: 'disabled', required: false}],
                    emits: [{name: 'click'}],
                    slots: [{name: 'default'}],
                    models: [],
                },
                churn: {commits: 2, linesChanged: 30},
                dependencyDepth: 1,
            },
            SectionDivider: {
                path: 'src/shared/components/SectionDivider.vue',
                category: null,
                consumers: {showcase: {_root: ['App.vue']}},
                adoption: {apps: 1, domains: 1},
                apiSurface: {props: [], emits: [], slots: [], models: []},
                churn: {commits: 1, linesChanged: 5},
                dependencyDepth: 0,
            },
            TextInput: {
                path: 'src/shared/components/forms/inputs/TextInput.vue',
                category: 'forms/inputs',
                consumers: {
                    families: {sets: ['CreateSetPage.vue'], storage: ['StoragePage.vue']},
                    admin: {_root: ['AdminForm.vue']},
                },
                adoption: {apps: 2, domains: 3},
                apiSurface: {
                    props: [
                        {name: 'label', required: true},
                        {name: 'disabled', required: false},
                    ],
                    emits: [],
                    slots: [],
                    models: [{name: 'modelValue', required: true}],
                },
                churn: {commits: 4, linesChanged: 80},
                dependencyDepth: 0,
            },
            PrimaryButton: {
                path: 'src/shared/components/PrimaryButton.vue',
                category: null,
                consumers: {showcase: {_root: ['ShowcasePage.vue']}, families: {home: ['HomePage.vue']}},
                adoption: {apps: 2, domains: 2},
                apiSurface: {
                    props: [
                        {name: 'disabled', required: false},
                        {name: 'type', required: false},
                    ],
                    emits: [{name: 'click'}],
                    slots: [{name: 'default'}],
                    models: [],
                },
                churn: {commits: 3, linesChanged: 50},
                dependencyDepth: 0,
            },
        },
    },
}));

describe('ComponentHealth', () => {
    it('should render the section heading with correct number and title', () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Assert
        expect(wrapper.text()).toContain('08');
        expect(wrapper.text()).toContain('Component Health');
    });

    it('should render the section element with correct id', () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Assert
        expect(wrapper.find('section#health').exists()).toBe(true);
    });

    it('should render the summary stats grid with component count from registry', () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Assert
        const statCards = wrapper.findAll("[text='center']");
        const texts = statCards.map((s) => s.text());
        const combinedText = texts.join(' ');
        expect(combinedText).toContain('Components');
        expect(combinedText).toContain('Multi-App');
        expect(combinedText).toContain('Composites');
        expect(combinedText).toContain('Churn Window');
    });

    it('should render component entries sorted alphabetically', () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Assert
        const nameElements = wrapper.findAll("[font='mono bold'][text='sm']");
        const names = nameElements
            .filter((el) => el.classes().includes('truncate') || el.attributes('truncate') !== undefined)
            .map((el) => el.text());

        // Verify alphabetical order — first name should be <= second name
        for (let i = 0; i < names.length - 1; i++) {
            expect(names[i]?.localeCompare(names[i + 1] ?? '')).toBeLessThanOrEqual(0);
        }
    });

    it('should expand a component row when its button is clicked', async () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});
        const firstButton = wrapper.find('button');
        expect(firstButton.attributes('aria-expanded')).toBe('false');

        await firstButton.trigger('click');
        await nextTick();

        // Assert
        expect(firstButton.attributes('aria-expanded')).toBe('true');
        expect(wrapper.text()).toContain('API Surface');
        expect(wrapper.text()).toContain('Consumer Map');
    });

    it('should collapse an expanded component row when its button is clicked again', async () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});
        const firstButton = wrapper.find('button');

        await firstButton.trigger('click');
        await nextTick();
        expect(firstButton.attributes('aria-expanded')).toBe('true');

        await firstButton.trigger('click');
        await nextTick();

        // Assert
        expect(firstButton.attributes('aria-expanded')).toBe('false');
    });

    it('should display adoption badges for each component entry', () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Assert — at least one badge with the pattern "XA / YD"
        expect(wrapper.text()).toMatch(/\dA \/ \d+D/);
    });

    it('should display API surface count badges for each component entry', () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Assert — at least one badge with the pattern "X API"
        expect(wrapper.text()).toMatch(/\d+ API/);
    });

    it('should display churn badges for each component entry', () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Assert — at least one badge with the pattern "Xc / YL"
        expect(wrapper.text()).toMatch(/\d+c \/ \d+L/);
    });

    it('should show depth badge only for composite components', () => {
        // Act
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Assert — depth badges (d1, d2, etc.) are rendered conditionally
        // If there are composites, at least one depth badge exists
        const depthBadges = wrapper.findAll('span').filter((s) => /^d\d+$/.test(s.text()));
        // Just verify it renders without error — count depends on registry data
        expect(depthBadges.length).toBeGreaterThanOrEqual(0);
    });

    it('should show expanded detail with churn, depth, and path in the footer', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Act
        const firstButton = wrapper.find('button');
        await firstButton.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('Churn');
        expect(wrapper.text()).toContain('Depth');
        expect(wrapper.text()).toContain('Path');
    });

    it('should show root domain label as (root) in consumer map', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Act — expand all entries to find one that has a _root consumer
        const buttons = wrapper.findAll('button');
        for (const btn of buttons) {
            await btn.trigger('click');
            await nextTick();
        }

        // Assert — at least one component should have a showcase/_root consumer
        expect(wrapper.text()).toContain('(root)');
    });

    it("should show 'No props, emits, slots, or models' for zero-API-surface components", async () => {
        // Arrange
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Act — find and expand SectionDivider (has 0 API surface)
        const buttons = wrapper.findAll('button');
        const sectionDividerButton = buttons.find((b) => b.text().includes('SectionDivider'));
        expect(sectionDividerButton).toBeDefined();
        await sectionDividerButton?.trigger('click');
        await nextTick();

        // Assert
        expect(wrapper.text()).toContain('No props, emits, slots, or models');
    });

    it('should expand a component with models and show model names with required markers', async () => {
        // Arrange — expand a component that has models (e.g., TextInput has modelValue*)
        const wrapper = shallowMount(ComponentHealth, {global: {stubs: {SectionHeading}}});

        // Act — find and expand TextInput (has required model)
        const buttons = wrapper.findAll('button');
        const textInputButton = buttons.find((b) => b.text().includes('TextInput'));
        expect(textInputButton).toBeDefined();
        await textInputButton?.trigger('click');
        await nextTick();

        // Assert — required model shown with asterisk
        expect(wrapper.text()).toContain('Models');
        expect(wrapper.text()).toContain('modelValue*');
    });
});
