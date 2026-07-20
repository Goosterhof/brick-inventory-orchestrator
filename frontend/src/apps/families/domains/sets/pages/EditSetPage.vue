<script setup lang="ts">
import type {FamilySet, FamilySetStatus} from '@app/types/familySet';
import type {Adapted} from '@script-development/fs-adapter-store';

import {familyHttpService, familyRouterService, familySoundService, familyTranslationService} from '@app/services';
import {familySetStoreModule} from '@app/stores';
import {EntryNotFoundError} from '@script-development/fs-adapter-store';
import {useForm} from '@script-development/fs-form';
import {DateInput, FormField, NumberInput, SingleSelect, Textarea} from '@script-development/ui-inputs';
import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import DangerButton from '@shared/components/DangerButton.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {camelKey} from '@shared/helpers/string';
import {computed, onMounted, ref, useId} from 'vue';

const {t} = familyTranslationService;
const adapted = ref<Adapted<FamilySet> | null>(null);
const loading = ref(true);
const showDeleteConfirm = ref(false);

type EditSetField = 'quantity' | 'status' | 'purchaseDate' | 'notes';
const {errors, handleSubmit, submitting} = useForm<EditSetField>(familyHttpService, {keyMapper: camelKey});

const quantityId = useId();
const statusId = useId();
const purchaseDateId = useId();
const notesId = useId();

const statusChoices: {
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

// SingleSelect wants `{id, label}` options; a computed keeps labels reactive to
// the translation service.
const statusOptions = computed<{id: FamilySetStatus; label: string}[]>(() =>
    statusChoices.map((choice) => ({id: choice.value, label: t(choice.key).value})),
);

// NumberInput emits null on empty; the fetched quantity is a non-null number, so
// hold the editable value in a local nullable ref (seeded on load) and coerce to 1
// at submit. Keeps the wire type untouched and lets the field go empty mid-edit.
const quantity = ref<number | null>(null);

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
    if (adapted.value) quantity.value = adapted.value.mutable.quantity;
    loading.value = false;
});

const onSubmit = () =>
    handleSubmit(async () => {
        if (!adapted.value) return;

        await adapted.value.patch({
            quantity: quantity.value ?? 1,
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
                <FormField :id="quantityId" :label="t('sets.quantity').value" required :error="errors.quantity">
                    <template #default="{controlId, required, invalid, describedby}">
                        <NumberInput
                            :id="controlId"
                            v-model="quantity"
                            :min="1"
                            :required="required"
                            :invalid="invalid"
                            :describedby="describedby"
                        />
                    </template>
                </FormField>

                <FormField :id="statusId" :label="t('sets.status').value" required :error="errors.status">
                    <template #default="{controlId, required, invalid, describedby}">
                        <SingleSelect
                            :id="controlId"
                            v-model="adapted.mutable.status"
                            :options="statusOptions"
                            label="label"
                            :options-label="t('sets.status').value"
                            :required="required"
                            :invalid="invalid"
                            :describedby="describedby"
                        />
                    </template>
                </FormField>

                <FormField :id="purchaseDateId" :label="t('sets.purchaseDate').value">
                    <template #default="{controlId, required, invalid, describedby}">
                        <DateInput
                            :id="controlId"
                            v-model="adapted.mutable.purchaseDate"
                            :required="required"
                            :invalid="invalid"
                            :describedby="describedby"
                        />
                    </template>
                </FormField>

                <FormField :id="notesId" :label="t('sets.notes').value">
                    <template #default="{controlId, required, invalid, describedby}">
                        <Textarea
                            :id="controlId"
                            v-model="adapted.mutable.notes"
                            :rows="3"
                            :required="required"
                            :invalid="invalid"
                            :describedby="describedby"
                        />
                    </template>
                </FormField>

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
