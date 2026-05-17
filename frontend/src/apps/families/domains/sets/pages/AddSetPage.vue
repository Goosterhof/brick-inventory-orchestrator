<script setup lang="ts">
import type {FamilySetStatus} from '@app/types/familySet';

import {familyHttpService, familyRouterService, familyTranslationService} from '@app/services';
import {familySetStoreModule} from '@app/stores';
import DateInput from '@shared/components/forms/inputs/DateInput.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import SelectInput from '@shared/components/forms/inputs/SelectInput.vue';
import TextareaInput from '@shared/components/forms/inputs/TextareaInput.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {useFormSubmit} from '@shared/composables/useFormSubmit';
import {useValidationErrors} from '@shared/composables/useValidationErrors';
import {isAxiosError} from 'axios';
import {computed, ref, watch} from 'vue';

const {t} = familyTranslationService;
const adapted = familySetStoreModule.generateNew();
const duplicateDismissed = ref(false);
const notFoundError = ref('');

watch(
    () => adapted.mutable.value.setNum,
    () => {
        duplicateDismissed.value = false;
        notFoundError.value = '';
    },
);

const duplicateMatch = computed(() => {
    const enteredSetNum = adapted.mutable.value.setNum.trim();
    if (!enteredSetNum) return null;
    return familySetStoreModule.getAll.value.find((s) => s.setNum === enteredSetNum) ?? null;
});

const showDuplicateWarning = computed(() => duplicateMatch.value !== null && !duplicateDismissed.value);

const dismissDuplicate = () => {
    duplicateDismissed.value = true;
};

type AddSetField = 'setNum' | 'quantity' | 'status' | 'purchaseDate' | 'notes';
const validationErrors = useValidationErrors<AddSetField>(familyHttpService);
const {errors} = validationErrors;
const {handleSubmit, submitting} = useFormSubmit(validationErrors);

const statusOptions: {
    value: FamilySetStatus;
    key: 'sets.sealed' | 'sets.built' | 'sets.inProgress' | 'sets.inStorage' | 'sets.incomplete' | 'sets.wishlist';
}[] = [
    {value: 'sealed', key: 'sets.sealed'},
    {value: 'built', key: 'sets.built'},
    {value: 'in_progress', key: 'sets.inProgress'},
    {value: 'in_storage', key: 'sets.inStorage'},
    {value: 'incomplete', key: 'sets.incomplete'},
    {value: 'wishlist', key: 'sets.wishlist'},
];

const onSubmit = () => {
    notFoundError.value = '';
    return handleSubmit(async () => {
        try {
            const created = await adapted.create();
            await familyRouterService.goToRoute('sets-detail', created.id);
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
                notFoundError.value = t('sets.setNotFound').value;
                return;
            }
            throw error;
        }
    });
};
</script>

<template>
    <div max-w="md" m="x-auto">
        <h1 text="2xl" font="bold" uppercase tracking="wide" m="b-6">{{ t('sets.addSet').value }}</h1>

        <form flex="~ col" gap="4" @submit.prevent="onSubmit">
            <TextInput
                v-model="adapted.mutable.value.setNum"
                :label="t('sets.setNumber').value"
                :error="errors.setNum"
            />

            <div
                v-if="notFoundError"
                p="4"
                bg="red-100"
                text="red-900"
                class="brick-border"
                border="1"
                data-testid="not-found-error"
            >
                <p font="bold" text="sm">{{ notFoundError }}</p>
            </div>

            <div
                v-if="showDuplicateWarning"
                p="4"
                bg="[var(--brick-surface-highlight)]"
                class="brick-border"
                border="1"
                flex="~ col"
                gap="2"
                data-testid="duplicate-warning"
            >
                <p font="bold" text="sm [var(--brick-highlight-text)]">
                    {{
                        t('sets.duplicateWarning')
                            .value.replace('{quantity}', String(duplicateMatch?.quantity ?? 0))
                            .replace('{status}', duplicateMatch?.status ?? '')
                    }}
                </p>
                <button
                    type="button"
                    text="xs"
                    font="bold"
                    uppercase
                    tracking="wide"
                    self="start"
                    @click="dismissDuplicate"
                >
                    {{ t('sets.duplicateDismiss').value }}
                </button>
            </div>

            <NumberInput
                v-model="adapted.mutable.value.quantity"
                :label="t('sets.quantity').value"
                :error="errors.quantity"
                :min="1"
                optional
            />

            <SelectInput v-model="adapted.mutable.value.status" :label="t('sets.status').value" :error="errors.status">
                <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ t(option.key).value }}
                </option>
            </SelectInput>

            <DateInput v-model="adapted.mutable.value.purchaseDate" :label="t('sets.purchaseDate').value" optional />

            <TextareaInput v-model="adapted.mutable.value.notes" :label="t('sets.notes').value" optional />

            <PrimaryButton type="submit" :disabled="submitting">{{ t('sets.add').value }}</PrimaryButton>
        </form>
    </div>
</template>
