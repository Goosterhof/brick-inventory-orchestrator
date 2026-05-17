<script setup lang="ts">
import FormError from '@shared/components/forms/FormError.vue';
import FormField from '@shared/components/forms/FormField.vue';
import FormLabel from '@shared/components/forms/FormLabel.vue';
import {computed, useId} from 'vue';

const {
    label,
    type = 'text',
    placeholder = '',
    disabled = false,
    optional = false,
    error = '',
} = defineProps<{
    label: string;
    type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
    placeholder?: string;
    disabled?: boolean;
    optional?: boolean;
    error?: string;
}>();

const model = defineModel<string>({required: true});

const inputId = useId();
const errorId = `${inputId}-error`;

const inputStateClass = computed(() => {
    if (disabled) {
        return 'brick-disabled';
    }
    if (error) {
        return 'bg-brick-red-light border-brick-red brick-shadow-error focus:brick-shadow-error-hover';
    }
    return 'bg-[var(--brick-card-bg)] brick-shadow focus:brick-shadow-hover focus:bg-brick-yellow focus:text-brick-ink';
});
</script>

<template>
    <FormField>
        <FormLabel :for="inputId" :optional="optional">{{ label }}</FormLabel>
        <input
            :id="inputId"
            v-model="model"
            :type="type"
            :placeholder="placeholder"
            :disabled="disabled"
            :required="!optional"
            :aria-invalid="error ? true : undefined"
            :aria-describedby="error ? errorId : undefined"
            p="x-4 y-3"
            text="[var(--brick-page-text)]"
            font="medium"
            class="brick-border brick-transition"
            outline="none"
            focus-visible:brick-focus
            :class="inputStateClass"
        />
        <FormError v-if="error" :id="errorId" :message="error" />
    </FormField>
</template>
