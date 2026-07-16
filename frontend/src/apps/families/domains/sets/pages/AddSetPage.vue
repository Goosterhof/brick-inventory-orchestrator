<script setup lang="ts">
import type {FamilySetStatus} from '@app/types/familySet';

import {familyHttpService, familyRouterService, familyTranslationService} from '@app/services';
import {familySetStoreModule} from '@app/stores';
import {useForm} from '@script-development/fs-form';
import {FormField, SingleSelect, TextInput} from '@script-development/ui-inputs';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {camelKey} from '@shared/helpers/string';
import {isAxiosError} from 'axios';
import {computed, ref, useId, watch} from 'vue';

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
const {errors, handleSubmit, submitting} = useForm<AddSetField>(familyHttpService, {keyMapper: camelKey});

const setNumId = useId();
const quantityId = useId();
const statusId = useId();
const purchaseDateId = useId();
const notesId = useId();

const statusOptions = computed<{id: FamilySetStatus; label: string}[]>(() => [
    {id: 'sealed', label: t('sets.sealed').value},
    {id: 'built', label: t('sets.built').value},
    {id: 'in_progress', label: t('sets.inProgress').value},
    {id: 'in_storage', label: t('sets.inStorage').value},
    {id: 'incomplete', label: t('sets.incomplete').value},
    {id: 'wishlist', label: t('sets.wishlist').value},
]);

const onQuantityInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    // quantity is a non-nullable number (defaults to 1); ignore empty/NaN input
    // rather than write null. The old NumberInput molecule wrote null here via
    // v-model indirection — a latent unsoundness the atom conversion surfaces.
    if (!Number.isNaN(value)) {
        adapted.mutable.value.quantity = value;
    }
};

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
            <FormField :id="setNumId" :label="t('sets.setNumber').value" required :error="errors.setNum">
                <template #default="{controlId, required, invalid, describedby}">
                    <TextInput
                        :id="controlId"
                        v-model="adapted.mutable.value.setNum"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

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

            <FormField :id="quantityId" :label="t('sets.quantity').value" :error="errors.quantity">
                <template #default="{controlId, required, invalid, describedby}">
                    <input
                        :id="controlId"
                        class="ui-control ui-input"
                        :class="{'is-invalid': invalid}"
                        type="number"
                        :min="1"
                        :value="adapted.mutable.value.quantity"
                        :aria-required="required || undefined"
                        :aria-invalid="invalid || undefined"
                        :aria-describedby="describedby"
                        @input="onQuantityInput"
                    />
                </template>
            </FormField>

            <FormField :id="statusId" :label="t('sets.status').value" required :error="errors.status">
                <template #default="{controlId, required, invalid, describedby}">
                    <SingleSelect
                        :id="controlId"
                        v-model="adapted.mutable.value.status"
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
                    <input
                        :id="controlId"
                        class="ui-control ui-input"
                        :class="{'is-invalid': invalid}"
                        type="date"
                        v-model="adapted.mutable.value.purchaseDate"
                        :aria-required="required || undefined"
                        :aria-invalid="invalid || undefined"
                        :aria-describedby="describedby"
                    />
                </template>
            </FormField>

            <FormField :id="notesId" :label="t('sets.notes').value">
                <template #default="{controlId, required, invalid, describedby}">
                    <textarea
                        :id="controlId"
                        class="ui-control"
                        :class="{'is-invalid': invalid}"
                        rows="3"
                        v-model="adapted.mutable.value.notes"
                        :aria-required="required || undefined"
                        :aria-invalid="invalid || undefined"
                        :aria-describedby="describedby"
                    />
                </template>
            </FormField>

            <PrimaryButton type="submit" :disabled="submitting">{{ t('sets.add').value }}</PrimaryButton>
        </form>
    </div>
</template>
