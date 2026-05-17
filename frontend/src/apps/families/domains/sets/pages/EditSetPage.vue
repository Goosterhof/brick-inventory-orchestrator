<script setup lang="ts">
import type {FamilySet, FamilySetStatus} from '@app/types/familySet';
import type {Adapted} from '@script-development/fs-adapter-store';

import {familyHttpService, familyRouterService, familySoundService, familyTranslationService} from '@app/services';
import {familySetStoreModule} from '@app/stores';
import {EntryNotFoundError} from '@script-development/fs-adapter-store';
import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import DangerButton from '@shared/components/DangerButton.vue';
import DateInput from '@shared/components/forms/inputs/DateInput.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import SelectInput from '@shared/components/forms/inputs/SelectInput.vue';
import TextareaInput from '@shared/components/forms/inputs/TextareaInput.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {useFormSubmit} from '@shared/composables/useFormSubmit';
import {useValidationErrors} from '@shared/composables/useValidationErrors';
import {onMounted, ref} from 'vue';

const {t} = familyTranslationService;
const adapted = ref<Adapted<FamilySet> | null>(null);
const loading = ref(true);
const showDeleteConfirm = ref(false);

type EditSetField = 'quantity' | 'status' | 'purchaseDate' | 'notes';
const validationErrors = useValidationErrors<EditSetField>(familyHttpService);
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

onMounted(async () => {
    const id = familyRouterService.currentRouteId.value;
    // Direct navigation (refresh, deep link, e2e test) lands here without the overview having
    // hydrated the store. Fall back to retrieveAll so getOrFailById has the item to return.
    try {
        adapted.value = await familySetStoreModule.getOrFailById(id);
    } catch (error) {
        if (!(error instanceof EntryNotFoundError)) throw error;
        await familySetStoreModule.retrieveAll();
        adapted.value = await familySetStoreModule.getOrFailById(id);
    }
    loading.value = false;
});

const onSubmit = () =>
    handleSubmit(async () => {
        if (!adapted.value) return;

        await adapted.value.patch({
            quantity: adapted.value.mutable.quantity,
            status: adapted.value.mutable.status,
            purchaseDate: adapted.value.mutable.purchaseDate,
            notes: adapted.value.mutable.notes,
        });
        await familyRouterService.goToRoute('sets-detail', adapted.value.id);
    });

const handleDelete = async () => {
    if (!adapted.value) return;

    await adapted.value.delete();
    await familyRouterService.goToRoute('sets');
};
</script>

<template>
    <div max-w="md" m="x-auto">
        <LoadingState v-if="loading" :message="t('common.loading').value" />

        <template v-else-if="adapted">
            <h1 text="2xl" font="bold" uppercase tracking="wide" m="b-2">{{ t('sets.editSet').value }}</h1>
            <p text="[var(--brick-muted-text)]" m="b-6">
                {{ adapted.set?.name }} ({{ adapted.set?.setNum ?? adapted.setNum }})
            </p>

            <form flex="~ col" gap="4" @submit.prevent="onSubmit">
                <NumberInput
                    v-model="adapted.mutable.quantity"
                    :label="t('sets.quantity').value"
                    :error="errors.quantity"
                    :min="1"
                />

                <SelectInput v-model="adapted.mutable.status" :label="t('sets.status').value" :error="errors.status">
                    <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                        {{ t(option.key).value }}
                    </option>
                </SelectInput>

                <DateInput v-model="adapted.mutable.purchaseDate" :label="t('sets.purchaseDate').value" optional />

                <TextareaInput v-model="adapted.mutable.notes" :label="t('sets.notes').value" optional />

                <div flex gap="4">
                    <PrimaryButton type="submit" :disabled="submitting" :sound-service="familySoundService" silent>{{
                        t('sets.save').value
                    }}</PrimaryButton>
                    <DangerButton @click="showDeleteConfirm = true">{{ t('sets.delete').value }}</DangerButton>
                </div>
            </form>

            <ConfirmDialog
                :open="showDeleteConfirm"
                :title="t('sets.delete').value"
                :message="t('sets.confirmDelete').value"
                :sound-service="familySoundService"
                @confirm="handleDelete"
                @cancel="showDeleteConfirm = false"
            >
                <template #confirm>{{ t('sets.delete').value }}</template>
                <template #cancel>{{ t('common.cancel').value }}</template>
            </ConfirmDialog>
        </template>
    </div>
</template>
