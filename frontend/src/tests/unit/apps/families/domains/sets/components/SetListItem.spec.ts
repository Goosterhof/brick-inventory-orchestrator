import SetListItem from '@app/domains/sets/components/SetListItem.vue';
import {shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {createMockFamilyServices} = await vi.hoisted(() => import('../../../../../../helpers'));

vi.mock('@shared/components/BadgeLabel.vue', () => ({
    default: {name: 'BadgeLabel', template: '<span><slot /></span>', props: ['variant']},
}));

vi.mock('@shared/components/ListItemButton.vue', () => ({
    default: {name: 'ListItemButton', template: '<div @click=\'$emit("click")\'><slot /></div>', props: ['variant']},
}));

vi.mock('@app/domains/sets/components/CompletionGauge.vue', () => ({
    default: {
        name: 'CompletionGauge',
        template: "<span data-test='completion-gauge'>{{ percentage }}</span>",
        props: ['percentage', 'unknownLabel'],
    },
}));

vi.mock('@app/services', () => createMockFamilyServices());

const baseSet = {
    id: 1,
    setId: 10,
    setNum: '75192-1',
    quantity: 2,
    status: 'built' as const,
    purchaseDate: null,
    notes: null,
    set: {
        id: 10,
        setNum: '75192-1',
        name: 'Millennium Falcon',
        year: 2017,
        theme: 'Star Wars',
        numParts: 7541,
        imageUrl: 'https://example.com/75192.jpg',
    },
};

describe('SetListItem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render set name and number', () => {
        // Arrange & Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: baseSet, completionPercentage: null, completionLoading: false},
        });

        // Assert
        expect(wrapper.text()).toContain('Millennium Falcon');
        expect(wrapper.text()).toContain('75192-1');
    });

    it('should render the status label', () => {
        // Arrange & Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: baseSet, completionPercentage: null, completionLoading: false},
        });

        // Assert
        expect(wrapper.text()).toContain('sets.built');
    });

    it('should render the quantity', () => {
        // Arrange & Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: baseSet, completionPercentage: null, completionLoading: false},
        });

        // Assert
        expect(wrapper.text()).toContain('2x');
    });

    it('should render the set image when imageUrl is set', () => {
        // Arrange & Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: baseSet, completionPercentage: null, completionLoading: false},
        });

        // Assert
        const img = wrapper.find('img');
        expect(img.exists()).toBe(true);
        expect(img.attributes('src')).toBe('https://example.com/75192.jpg');
        expect(img.attributes('alt')).toBe('Millennium Falcon');
    });

    it('should render placeholder when imageUrl is null', () => {
        // Arrange
        const setWithoutImage = {...baseSet, set: {...baseSet.set, imageUrl: null}};

        // Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: setWithoutImage, completionPercentage: null, completionLoading: false},
        });

        // Assert
        expect(wrapper.find('img').exists()).toBe(false);
        expect(wrapper.text()).toContain('common.noImage');
    });

    it('should fall back to setNum when set summary is missing', () => {
        // Arrange
        const setWithoutSummary = {
            id: 8,
            setId: 80,
            setNum: '99999-1',
            quantity: 1,
            status: 'wishlist' as const,
            purchaseDate: null,
            notes: null,
        };

        // Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: setWithoutSummary, completionPercentage: null, completionLoading: false},
        });

        // Assert
        expect(wrapper.text()).toContain('99999-1');
    });

    it('should emit click when the list item is clicked', async () => {
        // Arrange
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: baseSet, completionPercentage: null, completionLoading: false},
        });

        // Act
        await wrapper.findComponent({name: 'ListItemButton'}).trigger('click');

        // Assert
        expect(wrapper.emitted('click')).toBeTruthy();
    });

    it('should mark wishlist sets with the muted badge variant', () => {
        // Arrange
        const wishlistSet = {...baseSet, status: 'wishlist' as const};

        // Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: wishlistSet, completionPercentage: null, completionLoading: false},
        });

        // Assert
        expect(wrapper.findComponent({name: 'BadgeLabel'}).props('variant')).toBe('muted');
    });

    it('should use the default badge variant for non-wishlist sets', () => {
        // Arrange & Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: baseSet, completionPercentage: null, completionLoading: false},
        });

        // Assert
        expect(wrapper.findComponent({name: 'BadgeLabel'}).props('variant')).toBe('default');
    });

    it('should show completion loading placeholder when loading and not wishlist', () => {
        // Arrange & Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: baseSet, completionPercentage: null, completionLoading: true},
        });

        // Assert
        expect(wrapper.find("[aria-label='set-completion-loading']").exists()).toBe(true);
        expect(wrapper.findComponent({name: 'CompletionGauge'}).exists()).toBe(false);
    });

    it('should render the completion gauge with the given percentage when loaded', () => {
        // Arrange & Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: baseSet, completionPercentage: 78, completionLoading: false},
        });

        // Assert
        const gauge = wrapper.findComponent({name: 'CompletionGauge'});
        expect(gauge.exists()).toBe(true);
        expect(gauge.props('percentage')).toBe(78);
        expect(gauge.props('unknownLabel')).toBe('sets.completionUnknown');
    });

    it('should pass null percentage to the gauge when no completion data', () => {
        // Arrange & Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: baseSet, completionPercentage: null, completionLoading: false},
        });

        // Assert
        expect(wrapper.findComponent({name: 'CompletionGauge'}).props('percentage')).toBeNull();
    });

    it('should not render completion gauge or loading placeholder for wishlist sets', () => {
        // Arrange
        const wishlistSet = {...baseSet, status: 'wishlist' as const};

        // Act
        const wrapper = shallowMount(SetListItem, {
            props: {familySet: wishlistSet, completionPercentage: null, completionLoading: true},
        });

        // Assert
        expect(wrapper.findComponent({name: 'CompletionGauge'}).exists()).toBe(false);
        expect(wrapper.find("[aria-label='set-completion-loading']").exists()).toBe(false);
    });
});
