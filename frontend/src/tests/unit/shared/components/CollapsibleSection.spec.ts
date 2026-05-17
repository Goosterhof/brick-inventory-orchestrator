import CollapsibleSection from '@shared/components/CollapsibleSection.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';

vi.mock('@phosphor-icons/vue', () => ({
    PhCaretRight: {name: 'PhCaretRight', template: "<i v-bind='$attrs' />", props: ['size', 'weight']},
}));

describe('CollapsibleSection', () => {
    describe('rendering', () => {
        it('should render title', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {props: {title: 'Star Wars'}});

            // Assert
            expect(wrapper.text()).toContain('Star Wars');
        });

        it('should render count when provided', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {props: {title: 'Technic', count: 5}});

            // Assert
            expect(wrapper.text()).toContain('5');
        });

        it('should not render count when not provided', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {props: {title: 'Technic'}});

            // Assert
            const countBadge = wrapper.findAll('span').find((s) => s.attributes('bg') === 'white');
            expect(countBadge).toBeUndefined();
        });

        it('should render slot content', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {
                props: {title: 'City', expanded: true},
                slots: {default: '<p>Set list here</p>'},
            });

            // Assert
            expect(wrapper.text()).toContain('Set list here');
        });

        it('should render count of zero', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {props: {title: 'Empty', count: 0}});

            // Assert
            expect(wrapper.text()).toContain('0');
        });
    });

    describe('expand/collapse', () => {
        it('should hide slot content when collapsed', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {
                props: {title: 'City'},
                slots: {default: '<p>Hidden content</p>'},
            });

            // Assert — v-show sets display: none inline style
            const allDivs = wrapper.findAll('div');
            const slotContainer = allDivs.find((d) => d.attributes('style')?.includes('display: none'));
            expect(slotContainer?.exists()).toBe(true);
        });

        it('should show slot content when expanded', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {
                props: {title: 'City', expanded: true},
                slots: {default: '<p>Visible content</p>'},
            });

            // Assert — v-show removes display: none
            const slotContainer = wrapper.find('div > div');
            expect(slotContainer.attributes('style')).toBeUndefined();
        });

        it('should emit toggle when header button is clicked', async () => {
            // Arrange
            const wrapper = shallowMount(CollapsibleSection, {props: {title: 'City'}});

            // Act
            await wrapper.find('button').trigger('click');

            // Assert
            expect(wrapper.emitted('toggle')).toBeTruthy();
        });

        it('should default to collapsed when expanded prop is not provided', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {
                props: {title: 'City'},
                slots: {default: '<p>Content</p>'},
            });

            // Assert — v-show sets display: none inline style when collapsed
            const allDivs = wrapper.findAll('div');
            const hidden = allDivs.find((d) => d.attributes('style')?.includes('display: none'));
            expect(hidden?.exists()).toBe(true);
        });
    });

    describe('styling', () => {
        it('should have brick border and transition on button', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {props: {title: 'City'}});
            const button = wrapper.find('button');

            // Assert
            expect(button.attributes('class')).toContain('brick-border');
            expect(button.attributes('class')).toContain('brick-transition');
        });

        it('should be a button element', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {props: {title: 'City'}});
            const button = wrapper.find('button');

            // Assert
            expect(button.attributes('type')).toBe('button');
        });

        it('should have brick-label class on title', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {props: {title: 'City'}});
            const titleSpan = wrapper.findAll('span').find((s) => s.classes().includes('brick-label'));

            // Assert
            expect(titleSpan?.text()).toBe('City');
        });

        it('should pass rotate transform to caret icon when expanded', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {props: {title: 'City', expanded: true}});
            const icon = wrapper.findComponent({name: 'PhCaretRight'});

            // Assert
            expect(icon.attributes('transform')).toBe('rotate(90)');
        });

        it('should pass empty transform to caret icon when collapsed', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {props: {title: 'City'}});
            const icon = wrapper.findComponent({name: 'PhCaretRight'});

            // Assert
            expect(icon.attributes('transform')).toBe('');
        });

        it('should have brick-border class on count badge', () => {
            // Arrange & Act
            const wrapper = shallowMount(CollapsibleSection, {props: {title: 'City', count: 3}});
            const countBadge = wrapper.findAll('span').find((s) => s.text() === '3');

            // Assert
            expect(countBadge?.classes()).toContain('brick-border');
        });
    });
});
