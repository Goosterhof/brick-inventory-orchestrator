/**
 * Lightweight stubs for @script-development/ui-inputs, mirroring the package's
 * public contract closely enough to drive page logic in UNIT tests — without
 * pulling the real floating-ui dependency (ADR-0012 test-isolation: heavy deps
 * are mocked in unit tests; the integration suite mounts the real components to
 * guarantee composition).
 *
 * Usage:  vi.mock('@script-development/ui-inputs', () => createMockUiInputs());
 *
 * FormField reproduces the real scoped-slot contract (control-id / error-id /
 * required / invalid / describedby) and renders label + error, so callers can
 * assert `.ui-label` / `.ui-error` and drive the composed control. TextInput /
 * SingleSelect emit `update:modelValue` so `v-model` still round-trips.
 */
export const createMockUiInputs = () => ({
    FormField: {
        name: 'FormField',
        // `required` MUST be Boolean-typed so the bare `<FormField required>`
        // attribute coerces to true (matching the real package's typed prop).
        props: {id: {}, label: {}, required: {type: Boolean, default: false}, error: {}},
        template: `
            <div class="ui-field">
                <label v-if="label" class="ui-label" :for="id">
                    {{ label }}<span v-if="required" class="ui-label__req" aria-hidden="true">*</span>
                </label>
                <slot
                    :control-id="id"
                    :error-id="id + '-error'"
                    :required="required"
                    :invalid="!!error"
                    :describedby="error ? id + '-error' : undefined"
                />
                <p v-if="error" class="ui-error" :id="id + '-error'" role="alert">{{ error }}</p>
            </div>
        `,
    },
    FormLabel: {
        name: 'FormLabel',
        props: ['htmlFor', 'required'],
        template: '<label class="ui-label" :for="htmlFor"><slot /></label>',
    },
    FormError: {
        name: 'FormError',
        props: ['error', 'id'],
        template: '<p class="ui-error" :id="id" role="alert">{{ error }}</p>',
    },
    TextInput: {
        name: 'TextInput',
        props: ['id', 'modelValue', 'type', 'placeholder', 'disabled', 'required', 'invalid', 'describedby'],
        emits: ['update:modelValue'],
        template: `
            <input
                :id="id"
                :type="type || 'text'"
                class="ui-control ui-input"
                :value="modelValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :aria-required="required || undefined"
                :aria-invalid="invalid || undefined"
                :aria-describedby="describedby"
                @input="$emit('update:modelValue', $event.target.value)"
            />
        `,
    },
    NumberInput: {
        name: 'NumberInput',
        props: [
            'id',
            'modelValue',
            'min',
            'max',
            'step',
            'placeholder',
            'disabled',
            'required',
            'invalid',
            'describedby',
        ],
        emits: ['update:modelValue'],
        // Mirrors the real atom's honest-number contract: empty/NaN emits null,
        // otherwise the parsed number — so `v-model` round-trips number | null.
        template: `
            <input
                :id="id"
                type="number"
                class="ui-control ui-input"
                :value="modelValue"
                :min="min"
                :max="max"
                :step="step"
                :placeholder="placeholder"
                :disabled="disabled"
                :aria-required="required || undefined"
                :aria-invalid="invalid || undefined"
                :aria-describedby="describedby"
                @input="$emit('update:modelValue', Number.isNaN($event.target.valueAsNumber) ? null : $event.target.valueAsNumber)"
            />
        `,
    },
    DateInput: {
        name: 'DateInput',
        props: ['id', 'modelValue', 'min', 'max', 'disabled', 'required', 'invalid', 'describedby'],
        emits: ['update:modelValue'],
        template: `
            <input
                :id="id"
                type="date"
                class="ui-control ui-input"
                :value="modelValue"
                :min="min"
                :max="max"
                :disabled="disabled"
                :aria-required="required || undefined"
                :aria-invalid="invalid || undefined"
                :aria-describedby="describedby"
                @input="$emit('update:modelValue', $event.target.value)"
            />
        `,
    },
    Textarea: {
        name: 'Textarea',
        props: ['id', 'modelValue', 'rows', 'placeholder', 'disabled', 'required', 'invalid', 'describedby'],
        emits: ['update:modelValue'],
        template: `
            <textarea
                :id="id"
                class="ui-control"
                :value="modelValue"
                :rows="rows"
                :placeholder="placeholder"
                :disabled="disabled"
                :aria-required="required || undefined"
                :aria-invalid="invalid || undefined"
                :aria-describedby="describedby"
                @input="$emit('update:modelValue', $event.target.value)"
            />
        `,
    },
    SingleSelect: {
        name: 'SingleSelect',
        props: [
            'id',
            'modelValue',
            'options',
            'label',
            'placeholder',
            'disabled',
            'required',
            'invalid',
            'describedby',
            'optionsLabel',
            'alphabeticalSort',
            'emptyText',
        ],
        emits: ['update:modelValue'],
        template: `
            <div class="ui-select">
                <button
                    :id="id"
                    type="button"
                    role="combobox"
                    class="ui-control ui-select__trigger"
                    :disabled="disabled"
                    :aria-required="required || undefined"
                    :aria-invalid="invalid || undefined"
                    :aria-describedby="describedby"
                >{{ modelValue }}</button>
                <ul role="listbox" :aria-label="optionsLabel">
                    <li
                        v-for="option in options"
                        :key="String(option.id)"
                        role="option"
                        @click="$emit('update:modelValue', option.id)"
                    >{{ typeof label === 'function' ? label(option) : option[label] }}</li>
                </ul>
            </div>
        `,
    },
});
