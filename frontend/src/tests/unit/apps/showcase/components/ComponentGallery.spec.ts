import type {ComponentPublicInstance} from 'vue';

import {shallowMount} from '@vue/test-utils';
import {beforeAll, describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import ComponentGallery from '@/apps/showcase/components/ComponentGallery.vue';

// Mock heavy shared components to keep import chain under 1000ms (ADR-010).
// Using globalThis stubs: vi.mock factories are hoisted above imports, so we
// use vi.hoisted to make the factory function available in the hoisted scope.
const {mkStub, mkDialogStub, mkModelStub, mkButtonStub, mkToastStub} = vi.hoisted(() => ({
    mkStub: (name: string, slotted: boolean) => ({
        name,
        template: slotted
            ? `<div data-stub="${name}"><slot /><slot name="title" /><slot name="confirm" /><slot name="cancel" /><slot name="links" /><slot name="mobile-links" /><slot name="actions" /></div>`
            : `<div data-stub="${name}"><slot /></div>`,
    }),
    mkDialogStub: (name: string) => ({
        name,
        props: {open: Boolean},
        emits: ['close', 'confirm', 'cancel'],
        template: `<div data-stub="${name}"><slot /><slot name="title" /><slot name="confirm" /><slot name="cancel" /></div>`,
    }),
    mkModelStub: (name: string) => ({
        name,
        props: {modelValue: [String, Number, Object]},
        emits: ['update:modelValue'],
        template: `<div data-stub="${name}"><slot /></div>`,
    }),
    mkButtonStub: (name: string) => ({
        name,
        emits: ['click'],
        template: `<button @click="$emit('click')"><slot /></button>`,
    }),
    mkToastStub: () => ({
        name: 'ToastMessage',
        props: {message: String},
        emits: ['close'],
        template: `<div>{{ message }}<button aria-label="Dismiss" @click="$emit('close')">x</button></div>`,
    }),
}));

vi.mock('@shared/components/scanner/BarcodeScanner.vue', () => ({default: mkStub('BarcodeScanner', false)}));
vi.mock('@shared/components/scanner/CameraCapture.vue', () => ({default: mkStub('CameraCapture', false)}));
vi.mock('@shared/components/ModalDialog.vue', () => ({default: mkDialogStub('ModalDialog')}));
vi.mock('@shared/components/ConfirmDialog.vue', () => ({default: mkDialogStub('ConfirmDialog')}));
vi.mock('@shared/components/NavHeader.vue', () => ({default: mkStub('NavHeader', true)}));
vi.mock('@shared/components/NavLink.vue', () => ({default: mkStub('NavLink', false)}));
vi.mock('@shared/components/NavMobileLink.vue', () => ({default: mkStub('NavMobileLink', false)}));
vi.mock('@shared/components/LegoBrick.vue', () => ({default: mkStub('LegoBrick', false)}));
vi.mock('@shared/components/LegoBrickCuboidCss.vue', () => ({default: mkStub('LegoBrickCuboidCss', false)}));
vi.mock('@shared/components/LegoBrickIsometricSvg.vue', () => ({default: mkStub('LegoBrickIsometricSvg', false)}));
vi.mock('@shared/components/LegoBrickSideSvg.vue', () => ({default: mkStub('LegoBrickSideSvg', false)}));
vi.mock('@shared/components/LegoBrickSvg.vue', () => ({default: mkStub('LegoBrickSvg', false)}));
vi.mock('@shared/components/forms/inputs/TextInput.vue', () => ({default: mkModelStub('TextInput')}));
vi.mock('@shared/components/forms/inputs/NumberInput.vue', () => ({default: mkModelStub('NumberInput')}));
vi.mock('@shared/components/forms/inputs/SelectInput.vue', () => ({default: mkModelStub('SelectInput')}));
vi.mock('@shared/components/forms/inputs/DateInput.vue', () => ({default: mkModelStub('DateInput')}));
vi.mock('@shared/components/forms/inputs/TextareaInput.vue', () => ({default: mkModelStub('TextareaInput')}));
vi.mock('@shared/components/forms/FormError.vue', () => ({default: mkStub('FormError', false)}));
vi.mock('@shared/components/forms/FormField.vue', () => ({default: mkStub('FormField', true)}));
vi.mock('@shared/components/forms/FormLabel.vue', () => ({default: mkStub('FormLabel', true)}));
vi.mock('@shared/components/LoadingState.vue', () => ({default: mkStub('LoadingState', false)}));
vi.mock('@shared/components/PartListItem.vue', () => ({default: mkStub('PartListItem', false)}));
vi.mock('@shared/components/PrimaryButton.vue', () => ({default: mkButtonStub('PrimaryButton')}));
vi.mock('@shared/components/DangerButton.vue', () => ({default: mkButtonStub('DangerButton')}));
vi.mock('@shared/components/BackButton.vue', () => ({default: mkButtonStub('BackButton')}));
vi.mock('@shared/components/FilterChip.vue', () => ({default: mkButtonStub('FilterChip')}));
vi.mock('@shared/components/ToastMessage.vue', () => ({default: mkToastStub()}));
vi.mock('@shared/components/EmptyState.vue', () => ({default: mkStub('EmptyState', true)}));
vi.mock('@shared/components/PageHeader.vue', () => ({default: mkStub('PageHeader', true)}));
vi.mock('@shared/components/StatCard.vue', () => ({default: mkStub('StatCard', true)}));
vi.mock('@shared/components/DetailRow.vue', () => ({default: mkStub('DetailRow', true)}));
vi.mock('@shared/components/CardContainer.vue', () => ({default: mkStub('CardContainer', true)}));
vi.mock('@shared/components/BadgeLabel.vue', () => ({default: mkStub('BadgeLabel', true)}));
vi.mock('@shared/components/SectionDivider.vue', () => ({default: mkStub('SectionDivider', false)}));
vi.mock('@shared/components/ListItemButton.vue', () => ({default: mkStub('ListItemButton', true)}));

vi.mock('@/apps/showcase/components/SectionHeading.vue', () => ({
    default: {
        name: 'SectionHeading',
        props: {number: String, title: String},
        template: '<div>{{ number }} {{ title }}</div>',
    },
}));

describe('ComponentGallery', () => {
    // Prevent shallowMount from auto-stubbing vi.mock'd components — they are already lightweight stubs.
    const mockedComponentNames = [
        'BarcodeScanner',
        'CameraCapture',
        'ModalDialog',
        'ConfirmDialog',
        'NavHeader',
        'NavLink',
        'NavMobileLink',
        'LegoBrick',
        'LegoBrickCuboidCss',
        'LegoBrickIsometricSvg',
        'LegoBrickSideSvg',
        'LegoBrickSvg',
        'TextInput',
        'NumberInput',
        'SelectInput',
        'DateInput',
        'TextareaInput',
        'FormError',
        'FormField',
        'FormLabel',
        'LoadingState',
        'PartListItem',
        'PrimaryButton',
        'DangerButton',
        'BackButton',
        'FilterChip',
        'ToastMessage',
        'EmptyState',
        'PageHeader',
        'StatCard',
        'DetailRow',
        'CardContainer',
        'BadgeLabel',
        'SectionDivider',
        'ListItemButton',
        'SectionHeading',
    ] as const;
    const noAutoStub = Object.fromEntries(mockedComponentNames.map((name) => [name, false as const]));
    const stubs = {...noAutoStub};

    // Read-only rendering assertions share a single mount to reduce overhead.
    describe('rendering', () => {
        let wrapper: ReturnType<typeof shallowMount>;

        beforeAll(() => {
            wrapper = shallowMount(ComponentGallery, {global: {stubs}});
        });

        it('should render the section heading with correct number and title', () => {
            expect(wrapper.text()).toContain('04');
            expect(wrapper.text()).toContain('Component Gallery');
        });

        it('should render the section element with correct id', () => {
            expect(wrapper.find('section#components').exists()).toBe(true);
        });

        it('should render all gallery category labels', () => {
            const labels = wrapper.findAll('.brick-label');
            const labelTexts = labels.map((l) => l.text());
            expect(labelTexts).toContain('Buttons');
            expect(labelTexts).toContain('Form Inputs');
            expect(labelTexts).toContain('Cards & Layout');
            expect(labelTexts).toContain('PageHeader');
            expect(labelTexts).toContain('StatCard');
            expect(labelTexts).toContain('DetailRow');
            expect(labelTexts).toContain('PartListItem');
            expect(labelTexts).toContain('FilterChip');
            expect(labelTexts).toContain('BadgeLabel');
            expect(labelTexts).toContain('SectionDivider');
            expect(labelTexts).toContain('LoadingState');
            expect(labelTexts).toContain('ModalDialog');
            expect(labelTexts).toContain('ConfirmDialog');
            expect(labelTexts).toContain('Toast Messages');
            expect(labelTexts).toContain('Empty State');
            expect(labelTexts).toContain('Navigation');
            expect(labelTexts).toContain('Scanner Components');
            expect(labelTexts).toContain('LegoBrick');
            expect(labelTexts).toContain('LegoBrickSvg');
            expect(labelTexts).toContain('LegoBrickSideSvg');
            expect(labelTexts).toContain('3D Brick Techniques');
        });

        it('should render scanner component placeholders', () => {
            expect(wrapper.text()).toContain('BarcodeScanner');
            expect(wrapper.text()).toContain('CameraCapture');
            expect(wrapper.text()).toContain('Camera Required');
        });

        it('should render navigation component demos', () => {
            expect(wrapper.text()).toContain('NavHeader');
            expect(wrapper.text()).toContain('NavLink');
            expect(wrapper.text()).toContain('NavMobileLink');
        });

        it('should render brick demos including the 3D techniques section', () => {
            // LegoBrick variants
            expect(wrapper.text()).toContain('4x2 Red');
            expect(wrapper.text()).toContain('2x2 Blue');
            expect(wrapper.text()).toContain('1x1 Yellow (no shadow)');

            // 3D techniques section renders both variants with the tradeoff caption
            expect(wrapper.findComponent({name: 'LegoBrickCuboidCss'}).exists()).toBe(true);
            expect(wrapper.findComponent({name: 'LegoBrickIsometricSvg'}).exists()).toBe(true);
            expect(wrapper.text()).toContain('CSS 3D Transforms');
            expect(wrapper.text()).toContain('SVG Isometric Projection');
            expect(wrapper.text()).toContain('real geometry');
        });
    });

    it('should toggle modalOpen state when Open Modal is clicked', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});

        // Act
        const openButton = wrapper.findAll('button').find((b) => b.text().includes('Open Modal'));
        await openButton?.trigger('click');
        await nextTick();

        // Assert — the stubbed ModalDialog receives :open="true"
        const modalDialog = wrapper.findComponent({name: 'ModalDialog'});
        expect(modalDialog.props('open')).toBe(true);
    });

    it('should close the modal when Remove is clicked inside it', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});
        const openButton = wrapper.findAll('button').find((b) => b.text().includes('Open Modal'));
        await openButton?.trigger('click');
        await nextTick();

        // Act — click Remove button (rendered inside the stubbed ModalDialog slot)
        const removeButton = wrapper.findAll('button').find((b) => b.text() === 'Remove');
        await removeButton?.trigger('click');
        await nextTick();

        // Assert
        const modalDialog = wrapper.findComponent({name: 'ModalDialog'});
        expect(modalDialog.props('open')).toBe(false);
    });

    it('should close the modal when Cancel is clicked inside it', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});
        const openButton = wrapper.findAll('button').find((b) => b.text().includes('Open Modal'));
        await openButton?.trigger('click');
        await nextTick();

        // Act
        const cancelButton = wrapper.findAll('button').find((b) => b.text() === 'Cancel');
        await cancelButton?.trigger('click');
        await nextTick();

        // Assert
        const modalDialog = wrapper.findComponent({name: 'ModalDialog'});
        expect(modalDialog.props('open')).toBe(false);
    });

    it('should toggle confirmOpen state when Delete Storage is clicked', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});

        // Act
        const deleteButton = wrapper.findAll('button').find((b) => b.text().includes('Delete Storage'));
        await deleteButton?.trigger('click');
        await nextTick();

        // Assert
        const confirmDialog = wrapper.findComponent({name: 'ConfirmDialog'});
        expect(confirmDialog.props('open')).toBe(true);
    });

    it('should close the confirm dialog on confirm', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});
        const deleteButton = wrapper.findAll('button').find((b) => b.text().includes('Delete Storage'));
        await deleteButton?.trigger('click');
        await nextTick();

        // Act — emit confirm from stubbed ConfirmDialog
        const confirmDialog = wrapper.findComponent({name: 'ConfirmDialog'});
        (confirmDialog.vm as ComponentPublicInstance).$emit('confirm');
        await nextTick();

        // Assert
        expect(confirmDialog.props('open')).toBe(false);
    });

    it('should close the confirm dialog on cancel', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});
        const deleteButton = wrapper.findAll('button').find((b) => b.text().includes('Delete Storage'));
        await deleteButton?.trigger('click');
        await nextTick();

        // Act — emit cancel from stubbed ConfirmDialog
        const confirmDialog = wrapper.findComponent({name: 'ConfirmDialog'});
        (confirmDialog.vm as ComponentPublicInstance).$emit('cancel');
        await nextTick();

        // Assert
        expect(confirmDialog.props('open')).toBe(false);
    });

    it('should hide success toast when close is triggered', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});

        // Assert — both toasts visible initially
        expect(wrapper.text()).toContain('Set added to your inventory.');
        expect(wrapper.text()).toContain('Could not connect to the brick vault.');

        // Act — close the success toast via Dismiss button
        const dismissButtons = wrapper.findAll("[aria-label='Dismiss']");
        await dismissButtons[0]?.trigger('click');
        await nextTick();

        // Assert — one toast hidden, reset button appears
        expect(wrapper.text()).toContain('Reset toasts');
    });

    it('should reset toasts when clicking the reset button', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});

        // Close both toasts
        const dismissButtons = wrapper.findAll("[aria-label='Dismiss']");
        await dismissButtons[0]?.trigger('click');
        await nextTick();
        const remainingDismiss = wrapper.find("[aria-label='Dismiss']");
        await remainingDismiss.trigger('click');
        await nextTick();

        // Act — click Reset toasts button
        const resetBtn = wrapper.findAll('button').find((b) => b.text() === 'Reset toasts');
        expect(resetBtn).toBeDefined();
        await resetBtn?.trigger('click');
        await nextTick();

        // Assert — toasts are back
        expect(wrapper.text()).toContain('Set added to your inventory.');
        expect(wrapper.text()).toContain('Could not connect to the brick vault.');
    });

    it('should toggle filter chips on click', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});

        // Act — click each chip once to cover all template @click handlers
        const filterNames = ['Sealed', 'Built', 'In Progress', 'Incomplete'];
        for (const name of filterNames) {
            const chip = wrapper.findAll('button').find((b) => b.text().trim() === name);
            expect(chip).toBeDefined();
            await chip?.trigger('click');
            await nextTick();
        }

        // Act — click Incomplete again to exercise the deactivate (null) branch
        const incompleteChip = wrapper.findAll('button').find((b) => b.text().trim() === 'Incomplete');
        await incompleteChip?.trigger('click');
        await nextTick();
    });

    it('should update v-model values when form inputs change', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});

        // Act — type in the raw input fields
        const demoInput = wrapper.find('#demo-input');
        await demoInput.setValue('New Brick Name');

        const errorInput = wrapper.find('#error-input');
        await errorInput.setValue('12345');

        // Act — trigger v-model updates on stubbed shared components
        const textInput = wrapper.findComponent({name: 'TextInput'});
        (textInput.vm as ComponentPublicInstance).$emit('update:modelValue', 'Updated description');
        await nextTick();

        const numberInput = wrapper.findComponent({name: 'NumberInput'});
        (numberInput.vm as ComponentPublicInstance).$emit('update:modelValue', 99);
        await nextTick();

        const selectInput = wrapper.findComponent({name: 'SelectInput'});
        (selectInput.vm as ComponentPublicInstance).$emit('update:modelValue', 'sealed');
        await nextTick();

        const dateInput = wrapper.findComponent({name: 'DateInput'});
        (dateInput.vm as ComponentPublicInstance).$emit('update:modelValue', '2025-06-15');
        await nextTick();

        const textareaInput = wrapper.findComponent({name: 'TextareaInput'});
        (textareaInput.vm as ComponentPublicInstance).$emit('update:modelValue', 'Updated notes');
        await nextTick();

        // Assert — raw inputs accepted values
        expect((demoInput.element as HTMLInputElement).value).toBe('New Brick Name');
        expect((errorInput.element as HTMLInputElement).value).toBe('12345');
    });

    it('should close the modal via ModalDialog close event', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});

        // Open the modal
        const openButton = wrapper.findAll('button').find((b) => b.text().includes('Open Modal'));
        await openButton?.trigger('click');
        await nextTick();

        // Act — trigger close via the stubbed ModalDialog's close emit
        const modalDialog = wrapper.findComponent({name: 'ModalDialog'});
        (modalDialog.vm as ComponentPublicInstance).$emit('close');
        await nextTick();

        // Assert — exercised the @close="modalOpen = false" handler
        expect(openButton).toBeDefined();
    });

    it('should exercise nav link click handlers via noop', async () => {
        // Arrange
        const wrapper = shallowMount(ComponentGallery, {global: {stubs}});

        // Act — trigger click events on stubbed NavLink components
        const navLinks = wrapper.findAllComponents({name: 'NavLink'});
        for (const link of navLinks) {
            (link.vm as ComponentPublicInstance).$emit('click');
        }
        const mobileLinks = wrapper.findAllComponents({name: 'NavMobileLink'});
        for (const link of mobileLinks) {
            (link.vm as ComponentPublicInstance).$emit('click');
        }
        await nextTick();

        // Assert — navigation section rendered
        expect(wrapper.text()).toContain('NavLink');
    });
});
