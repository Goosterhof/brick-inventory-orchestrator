<script setup lang="ts">
import type {StorageOption} from '@app/types/storageOption';
import type {Adapted} from '@script-development/fs-adapter-store';

import {familyHttpService, familyRouterService, familySoundService, familyTranslationService} from '@app/services';
import {storageOptionStoreModule} from '@app/stores';
import {EntryNotFoundError} from '@script-development/fs-adapter-store';
import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import DangerButton from '@shared/components/DangerButton.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import TextareaInput from '@shared/components/forms/inputs/TextareaInput.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {useFormSubmit} from '@shared/composables/useFormSubmit';
import {useValidationErrors} from '@shared/composables/useValidationErrors';
import {onMounted, ref} from 'vue';

const {t} = familyTranslationService;
const adapted = ref<Adapted<StorageOption> | null>(null);
const loading = ref(true);
const showDeleteConfirm = ref(false);

type EditStorageField = 'name' | 'description' | 'parentId' | 'row' | 'column';
const validationErrors = useValidationErrors<EditStorageField>(familyHttpService);
const {errors} = validationErrors;
const {handleSubmit, submitting} = useFormSubmit(validationErrors);

onMounted(async () => {
    const id = familyRouterService.currentRouteId.value;
    // Direct navigation (refresh, deep link, e2e test) lands here without the overview having
    // hydrated the store. retrieveAll guarantees the item is loaded; only run it on the fallback
    // path so the normal overview-then-edit flow keeps its single round-trip.
    try {
        adapted.value = await storageOptionStoreModule.getOrFailById(id);
    } catch (error) {
        if (!(error instanceof EntryNotFoundError)) throw error;
        await storageOptionStoreModule.retrieveAll();
        adapted.value = await storageOptionStoreModule.getOrFailById(id);
    }
    loading.value = false;
});

const onSubmit = () =>
    handleSubmit(async () => {
        if (!adapted.value) return;

        await adapted.value.patch({
            name: adapted.value.mutable.name,
            description: adapted.value.mutable.description,
            parentId: adapted.value.mutable.parentId,
            row: adapted.value.mutable.row,
            column: adapted.value.mutable.column,
        });
        await familyRouterService.goToRoute('storage-detail', adapted.value.id);
    });

const handleDelete = async () => {
    if (!adapted.value) return;

    await adapted.value.delete();
    await familyRouterService.goToRoute('storage');
};
</script>

<template>
    <div max-w="md" m="x-auto">
        <LoadingState v-if="loading" :message="t('common.loading').value" />

        <template v-else-if="adapted">
            <h1 text="2xl" font="bold" uppercase tracking="wide" m="b-2">{{ t('storage.editStorage').value }}</h1>
            <p text="[var(--brick-muted-text)]" m="b-6">{{ adapted.name }}</p>

            <form flex="~ col" gap="4" @submit.prevent="onSubmit">
                <TextInput v-model="adapted.mutable.name" :label="t('storage.name').value" :error="errors.name" />

                <TextareaInput v-model="adapted.mutable.description" :label="t('storage.description').value" optional />

                <div flex gap="4">
                    <div flex="1 ~ col" gap="2">
                        <NumberInput
                            v-model="adapted.mutable.row"
                            :label="t('storage.row').value"
                            :error="errors.row"
                            :min="0"
                            optional
                        />
                    </div>
                    <div flex="1 ~ col" gap="2">
                        <NumberInput
                            v-model="adapted.mutable.column"
                            :label="t('storage.column').value"
                            :error="errors.column"
                            :min="0"
                            optional
                        />
                    </div>
                </div>

                <div flex gap="4">
                    <PrimaryButton type="submit" :disabled="submitting" :sound-service="familySoundService" silent>{{
                        t('storage.save').value
                    }}</PrimaryButton>
                    <DangerButton @click="showDeleteConfirm = true">{{ t('storage.delete').value }}</DangerButton>
                </div>
            </form>

            <ConfirmDialog
                :open="showDeleteConfirm"
                :title="t('storage.delete').value"
                :message="t('storage.confirmDelete').value"
                :sound-service="familySoundService"
                @confirm="handleDelete"
                @cancel="showDeleteConfirm = false"
            >
                <template #confirm>{{ t('storage.delete').value }}</template>
                <template #cancel>{{ t('common.cancel').value }}</template>
            </ConfirmDialog>
        </template>
    </div>
</template>
