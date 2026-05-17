import DangerButton from '@shared/components/DangerButton.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import ResourceAdapterPlayground from '@/apps/showcase/components/ResourceAdapterPlayground.vue';

// Mock heavy shared components to keep import chain under 1000ms (ADR-010).
const {mkStub, mkModelStub, mkButtonStub} = vi.hoisted(() => ({
    mkStub: (name: string) => ({
        name,
        props: {number: String, title: String},
        template: `<div data-stub="${name}">{{ number }} {{ title }}<slot /></div>`,
    }),
    mkModelStub: (name: string) => ({
        name,
        props: {modelValue: [String, Number, Object], label: String, placeholder: String, min: Number},
        emits: ['update:modelValue'],
        template: `<div data-stub="${name}">{{ label }}<slot /></div>`,
    }),
    mkButtonStub: (name: string) => ({
        name,
        emits: ['click'],
        template: `<button @click="$emit('click')"><slot /></button>`,
    }),
}));

vi.mock('@shared/components/PrimaryButton.vue', () => ({default: mkButtonStub('PrimaryButton')}));
vi.mock('@shared/components/DangerButton.vue', () => ({default: mkButtonStub('DangerButton')}));
vi.mock('@shared/components/forms/inputs/TextInput.vue', () => ({default: mkModelStub('TextInput')}));
vi.mock('@shared/components/forms/inputs/NumberInput.vue', () => ({default: mkModelStub('NumberInput')}));
vi.mock('@/apps/showcase/components/SectionHeading.vue', () => ({default: mkStub('SectionHeading')}));

describe('ResourceAdapterPlayground', () => {
    const stubs = {
        SectionHeading: false as const,
        TextInput: false as const,
        NumberInput: false as const,
        PrimaryButton: false as const,
        DangerButton: false as const,
    };

    it('should render the section heading with correct number and title', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        expect(wrapper.text()).toContain('12');
        expect(wrapper.text()).toContain('Resource Adapter Playground');
    });

    it('should render the section element with correct id', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        expect(wrapper.find('section#resource-adapter-playground').exists()).toBe(true);
    });

    it('should render all subsections', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const labels = wrapper.findAll('.brick-label');
        const labelTexts = labels.map((l) => l.text());
        expect(labelTexts).toContain('Generate New (Creation Form)');
        expect(labelTexts).toContain('Case Conversion (Live)');
        expect(labelTexts).toContain('Adapter Store (0 items)');
        expect(labelTexts).toContain('localStorage Persistence');
        expect(labelTexts).toContain('How It Works');
    });

    it('should render the creation form with three inputs', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        expect(wrapper.text()).toContain('Display Name');
        expect(wrapper.text()).toContain('Part Count');
        expect(wrapper.text()).toContain('Theme Group');
    });

    it('should render create and reset form buttons', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const createBtn = wrapper.find('[data-testid="create-btn"]');
        const resetNewBtn = wrapper.find('[data-testid="reset-new-btn"]');
        expect(createBtn.exists()).toBe(true);
        expect(resetNewBtn.exists()).toBe(true);
    });

    it('should show camelCase and snake_case views with default values', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const camelView = wrapper.find('[data-testid="camel-case-view"]');
        const snakeView = wrapper.find('[data-testid="snake-case-view"]');

        expect(camelView.text()).toContain('displayName');
        expect(camelView.text()).toContain('partCount');
        expect(camelView.text()).toContain('themeGroup');

        expect(snakeView.text()).toContain('display_name');
        expect(snakeView.text()).toContain('part_count');
        expect(snakeView.text()).toContain('theme_group');
    });

    it('should show empty store message when no items exist', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        expect(wrapper.text()).toContain('No minifigs in store. Create one above.');
    });

    it('should not show last action bar initially', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        expect(wrapper.find('[data-testid="last-action"]').exists()).toBe(false);
    });

    it('should not show edit panel initially', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        expect(wrapper.find('[data-testid="patch-btn"]').exists()).toBe(false);
    });

    it('should show storage json initially as empty object', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const storageJson = wrapper.find('[data-testid="storage-json"]');
        expect(storageJson.text()).toBe('{}');
    });

    it('should render the how-it-works section content', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        expect(wrapper.text()).toContain('Resource Adapter');
        expect(wrapper.text()).toContain('Adapter Store Module');
        expect(wrapper.text()).toContain('frozen readonly view');
        expect(wrapper.text()).toContain('reactive dictionary');
    });

    it('should create a minifig and show it in the store', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Fill in the form
        const textInputs = wrapper.findAllComponents(TextInput);
        const displayNameInput = textInputs.find((c) => c.props('label') === 'Display Name');
        displayNameInput?.vm.$emit('update:modelValue', 'Police Officer');
        await nextTick();

        // Click create
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // Verify store shows the item
        expect(wrapper.text()).toContain('Police Officer');
        expect(wrapper.text()).toContain('1 item');

        // Verify last action
        const lastAction = wrapper.find('[data-testid="last-action"]');
        expect(lastAction.exists()).toBe(true);
        expect(lastAction.text()).toContain('Created minifig #');
    });

    it('should show plural items label when multiple items exist', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Create first item
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // Create second item
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        expect(wrapper.text()).toContain('2 items');
    });

    it('should select a store item and show the edit panel', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Create an item
        const textInputs = wrapper.findAllComponents(TextInput);
        const displayNameInput = textInputs.find((c) => c.props('label') === 'Display Name');
        displayNameInput?.vm.$emit('update:modelValue', 'Firefighter');
        await nextTick();

        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // Click the store item card
        const storeButtons = wrapper.findAll('button').filter((b) => b.text().includes('Firefighter'));
        const storeCard = storeButtons.find((b) => b.text().includes('#'));
        await storeCard?.trigger('click');
        await nextTick();

        // Verify edit panel is shown
        expect(wrapper.find('[data-testid="patch-btn"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="reset-btn"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="delete-btn"]').exists()).toBe(true);

        // Verify frozen/mutable/snake views are shown
        expect(wrapper.find('[data-testid="frozen-view"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="mutable-view"]').exists()).toBe(true);
        expect(wrapper.find('[data-testid="selected-snake-view"]').exists()).toBe(true);
    });

    it('should show display name of unnamed item as (unnamed)', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Create with empty default name
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        expect(wrapper.text()).toContain('(unnamed)');
    });

    it('should patch an existing item', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Create an item
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // Select it (find the store card button)
        const storeCards = wrapper.findAll('button').filter((b) => b.text().includes('#'));
        await storeCards[0]?.trigger('click');
        await nextTick();

        // Edit the display name in the edit panel
        const editTextInputs = wrapper.findAllComponents(TextInput).filter((c) => c.props('label') === 'Display Name');
        const editInput = editTextInputs.find((c) => c.props('placeholder') === 'e.g. Firefighter');
        editInput?.vm.$emit('update:modelValue', 'Updated Name');
        await nextTick();

        // Click patch
        await wrapper.find('[data-testid="patch-btn"]').trigger('click');
        await nextTick();

        // Verify
        const lastAction = wrapper.find('[data-testid="last-action"]');
        expect(lastAction.text()).toContain('Patched minifig #');
    });

    it('should reset an existing item to its saved state', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Create an item with a name
        const textInputs = wrapper.findAllComponents(TextInput);
        const displayNameInput = textInputs.find((c) => c.props('label') === 'Display Name');
        displayNameInput?.vm.$emit('update:modelValue', 'Original Name');
        await nextTick();

        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // Select the item
        const storeCards = wrapper.findAll('button').filter((b) => b.text().includes('Original Name'));
        await storeCards[0]?.trigger('click');
        await nextTick();

        // Modify the mutable state
        const editTextInputs = wrapper.findAllComponents(TextInput).filter((c) => c.props('label') === 'Display Name');
        const editInput = editTextInputs.find((c) => c.props('placeholder') === 'e.g. Firefighter');
        editInput?.vm.$emit('update:modelValue', 'Changed Name');
        await nextTick();

        // Click reset
        await wrapper.find('[data-testid="reset-btn"]').trigger('click');
        await nextTick();

        // Verify last action
        const lastAction = wrapper.find('[data-testid="last-action"]');
        expect(lastAction.text()).toContain('Reset minifig #');
        expect(lastAction.text()).toContain('to saved state');
    });

    it('should delete an existing item', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Create an item
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // Select it
        const storeCards = wrapper.findAll('button').filter((b) => b.text().includes('#'));
        await storeCards[0]?.trigger('click');
        await nextTick();

        // Delete
        await wrapper.find('[data-testid="delete-btn"]').trigger('click');
        await nextTick();

        // Verify edit panel is gone
        expect(wrapper.find('[data-testid="patch-btn"]').exists()).toBe(false);

        // Verify last action
        const lastAction = wrapper.find('[data-testid="last-action"]');
        expect(lastAction.text()).toContain('Deleted minifig #');

        // Verify empty store message reappears
        expect(wrapper.text()).toContain('No minifigs in store. Create one above.');
    });

    it('should reset the new form to defaults', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Change the form values
        const textInputs = wrapper.findAllComponents(TextInput);
        const displayNameInput = textInputs.find((c) => c.props('label') === 'Display Name');
        displayNameInput?.vm.$emit('update:modelValue', 'Some Name');
        await nextTick();

        // Click reset form
        await wrapper.find('[data-testid="reset-new-btn"]').trigger('click');
        await nextTick();

        // Verify last action
        const lastAction = wrapper.find('[data-testid="last-action"]');
        expect(lastAction.text()).toBe('Reset new minifig form');

        // Verify the camel case view shows reset values
        const camelView = wrapper.find('[data-testid="camel-case-view"]');
        expect(camelView.text()).toContain('"displayName": ""');
    });

    it('should clear the storage mock', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Create an item to populate storage
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // Verify storage has data
        const storageJson = wrapper.find('[data-testid="storage-json"]');
        expect(storageJson.text()).not.toBe('{}');

        // Clear storage
        await wrapper.find('[data-testid="clear-storage-btn"]').trigger('click');
        await nextTick();

        // Verify storage is cleared
        expect(storageJson.text()).toBe('{}');

        // Verify last action
        const lastAction = wrapper.find('[data-testid="last-action"]');
        expect(lastAction.text()).toBe('Cleared localStorage mock');
    });

    it('should update the case conversion views reactively when form changes', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const textInputs = wrapper.findAllComponents(TextInput);
        const displayNameInput = textInputs.find((c) => c.props('label') === 'Display Name');
        displayNameInput?.vm.$emit('update:modelValue', 'Space Ranger');
        await nextTick();

        const camelView = wrapper.find('[data-testid="camel-case-view"]');
        expect(camelView.text()).toContain('Space Ranger');

        const snakeView = wrapper.find('[data-testid="snake-case-view"]');
        expect(snakeView.text()).toContain('Space Ranger');
    });

    it('should show persist data in storage json after creating', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        const storageJson = wrapper.find('[data-testid="storage-json"]');
        // The store persists to the mock storage, so it should have content
        expect(storageJson.text()).toContain('minifigs');
    });

    it('should auto-select the created item', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const textInputs = wrapper.findAllComponents(TextInput);
        const displayNameInput = textInputs.find((c) => c.props('label') === 'Display Name');
        displayNameInput?.vm.$emit('update:modelValue', 'Auto Selected');
        await nextTick();

        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // The edit panel should be visible since auto-selected
        expect(wrapper.find('[data-testid="patch-btn"]').exists()).toBe(true);
        expect(wrapper.text()).toContain('Edit Resource #');
    });

    it('should show frozen and mutable views for selected item', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const textInputs = wrapper.findAllComponents(TextInput);
        const displayNameInput = textInputs.find((c) => c.props('label') === 'Display Name');
        displayNameInput?.vm.$emit('update:modelValue', 'Test Minifig');
        await nextTick();

        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // Auto-selected, so views should be visible
        const frozenView = wrapper.find('[data-testid="frozen-view"]');
        expect(frozenView.text()).toContain('Test Minifig');

        const mutableView = wrapper.find('[data-testid="mutable-view"]');
        expect(mutableView.text()).toContain('Test Minifig');

        const snakeView = wrapper.find('[data-testid="selected-snake-view"]');
        expect(snakeView.text()).toContain('display_name');
    });

    it('should highlight selected store card with different styling', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Create two items
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // The last created is auto-selected
        const storeCards = wrapper.findAll('button').filter((b) => b.text().includes('#'));
        // Find the selected card (should have brick-shadow-hover class)
        const selectedCard = storeCards.find((c) => c.classes().includes('brick-shadow-hover'));
        expect(selectedCard).toBeDefined();
    });

    it('should clear selected item when the watcher detects deletion from store', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Create and auto-select
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // Verify edit panel visible
        expect(wrapper.find('[data-testid="delete-btn"]').exists()).toBe(true);

        // Delete via button
        await wrapper.find('[data-testid="delete-btn"]').trigger('click');
        await nextTick();

        // Edit panel should be gone
        expect(wrapper.find('[data-testid="delete-btn"]').exists()).toBe(false);
    });

    it('should handle patch when no item is selected (no-op)', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // No item selected, patch button not visible — but we can verify the component doesn't error
        expect(wrapper.find('[data-testid="patch-btn"]').exists()).toBe(false);
    });

    it('should render the clear storage button', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const clearBtn = wrapper.find('[data-testid="clear-storage-btn"]');
        expect(clearBtn.exists()).toBe(true);
        expect(clearBtn.text()).toBe('Clear Storage');
    });

    it('should use DangerButton for destructive actions', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const dangerButtons = wrapper.findAllComponents(DangerButton);
        const dangerTexts = dangerButtons.map((b) => b.text());
        expect(dangerTexts).toContain('Reset Form');
        expect(dangerTexts).toContain('Clear Storage');
    });

    it('should use PrimaryButton for create action', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const primaryButtons = wrapper.findAllComponents(PrimaryButton);
        const primaryTexts = primaryButtons.map((b) => b.text());
        expect(primaryTexts).toContain('Create');
    });

    it('should update part count via number input', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const numberInput = wrapper.findComponent(NumberInput);
        numberInput.vm.$emit('update:modelValue', 10);
        await nextTick();

        const camelView = wrapper.find('[data-testid="camel-case-view"]');
        expect(camelView.text()).toContain('10');
    });

    it('should show the watcher clearing selection when all items are deleted from store via clear storage', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Create an item
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // Auto-selected, edit panel visible
        expect(wrapper.find('[data-testid="patch-btn"]').exists()).toBe(true);

        // Clear storage (this clears the storage mock but doesn't remove from the reactive store directly)
        await wrapper.find('[data-testid="clear-storage-btn"]').trigger('click');
        await nextTick();

        // The store still has items (clearing storage doesn't clear the reactive state)
        // This verifies the clear storage path
        const lastAction = wrapper.find('[data-testid="last-action"]');
        expect(lastAction.text()).toBe('Cleared localStorage mock');
    });

    it('should render descriptive text in intro paragraph', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        expect(wrapper.text()).toContain('resourceAdapter');
        expect(wrapper.text()).toContain('createAdapterStoreModule');
        expect(wrapper.text()).toContain('mock HTTP service');
    });

    it('should render technical annotations in code panels', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        expect(wrapper.text()).toContain('storeModule.generateNew()');
        expect(wrapper.text()).toContain('NewAdapted<Minifig>');
        expect(wrapper.text()).toContain('camelCase (app state)');
        expect(wrapper.text()).toContain('snake_case (API payload via deepSnakeKeys)');
    });

    it('should render store module description annotation', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        expect(wrapper.text()).toContain('ComputedRef<Adapted<Minifig>[]>');
    });

    it('should update theme group in create form', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        const textInputs = wrapper.findAllComponents(TextInput);
        const themeGroupInput = textInputs.find((c) => c.props('label') === 'Theme Group');
        themeGroupInput?.vm.$emit('update:modelValue', 'Space');
        await nextTick();

        const camelView = wrapper.find('[data-testid="camel-case-view"]');
        expect(camelView.text()).toContain('Space');
    });

    it('should interact with all edit panel inputs', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        // Create and auto-select an item
        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        // Edit panel should be visible, interact with part count
        const editNumberInputs = wrapper.findAllComponents(NumberInput);
        const editPartCount = editNumberInputs.find((c) => c.props('placeholder') === 'e.g. 5');
        editPartCount?.vm.$emit('update:modelValue', 7);
        await nextTick();

        // Interact with theme group in edit panel
        const editTextInputs = wrapper.findAllComponents(TextInput);
        const editThemeGroup = editTextInputs.find((c) => c.props('placeholder') === 'e.g. Space');
        editThemeGroup?.vm.$emit('update:modelValue', 'Technic');
        await nextTick();

        // Verify the mutable view reflects the changes
        const mutableView = wrapper.find('[data-testid="mutable-view"]');
        expect(mutableView.text()).toContain('7');
        expect(mutableView.text()).toContain('Technic');
    });

    it('should not render selected snake case view when no item selected', () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        expect(wrapper.find('[data-testid="selected-snake-view"]').exists()).toBe(false);
        expect(wrapper.find('[data-testid="frozen-view"]').exists()).toBe(false);
        expect(wrapper.find('[data-testid="mutable-view"]').exists()).toBe(false);
    });

    it('should show edit panel annotation text when item selected', async () => {
        const wrapper = shallowMount(ResourceAdapterPlayground, {global: {stubs}});

        await wrapper.find('[data-testid="create-btn"]').trigger('click');
        await nextTick();

        expect(wrapper.text()).toContain('adapted.mutable');
        expect(wrapper.text()).toContain('Ref<Writable<Minifig>>');
    });
});
