<script setup lang="ts">
import type {StorageOption} from '@app/types/storageOption';
import type {Adapted} from '@script-development/fs-adapter-store';

import {familyHttpService, familyRouterService, familySoundService, familyTranslationService} from '@app/services';
import {storageOptionStoreModule} from '@app/stores';
import {EntryNotFoundError} from '@script-development/fs-adapter-store';
import {useForm} from '@script-development/fs-form';
import {FormField, TextInput} from '@script-development/ui-inputs';
import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import DangerButton from '@shared/components/DangerButton.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {camelKey} from '@shared/helpers/string';
import {onMounted, ref, useId} from 'vue';

const {t} = familyTranslationService;
const adapted = ref<Adapted<StorageOption> | null>(null);
const loading = ref(true);
const showDeleteConfirm = ref(false);

type EditStorageField = 'name' | 'description' | 'parentId' | 'row' | 'column';
const {errors, handleSubmit, submitting} = useForm<EditStorageField>(familyHttpService, {keyMapper: camelKey});

const nameId = useId();
const descriptionId = useId();
const rowId = useId();
const columnId = useId();

// row/column are nullable numbers; clear-to-null on empty/NaN. The mutable object
// is passed in from the template (narrowed non-null by v-else-if), so there is no
// unreachable null branch to leave uncovered.
const onNumberInput = (event: Event, mutable: {row: number | null; column: number | null}, field: 'row' | 'column') => {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    mutable[field] = Number.isNaN(value) ? null : value;
};

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
                <FormField :id="nameId" :label="t('storage.name').value" required :error="errors.name">
                    <template #default="{controlId, required, invalid, describedby}">
                        <TextInput
                            :id="controlId"
                            v-model="adapted.mutable.name"
                            :required="required"
                            :invalid="invalid"
                            :describedby="describedby"
                        />
                    </template>
                </FormField>

                <FormField :id="descriptionId" :label="t('storage.description').value">
                    <template #default="{controlId, required, invalid, describedby}">
                        <textarea
                            :id="controlId"
                            v-model="adapted.mutable.description"
                            class="ui-control"
                            :class="{'is-invalid': invalid}"
                            rows="3"
                            :aria-required="required || undefined"
                            :aria-invalid="invalid || undefined"
                            :aria-describedby="describedby"
                        />
                    </template>
                </FormField>

                <div flex gap="4">
                    <div flex="1 ~ col" gap="2">
                        <FormField :id="rowId" :label="t('storage.row').value" :error="errors.row">
                            <template #default="{controlId, required, invalid, describedby}">
                                <input
                                    :id="controlId"
                                    class="ui-control ui-input"
                                    :class="{'is-invalid': invalid}"
                                    type="number"
                                    :min="0"
                                    :value="adapted.mutable.row"
                                    :aria-required="required || undefined"
                                    :aria-invalid="invalid || undefined"
                                    :aria-describedby="describedby"
                                    @input="onNumberInput($event, adapted.mutable, 'row')"
                                />
                            </template>
                        </FormField>
                    </div>
                    <div flex="1 ~ col" gap="2">
                        <FormField :id="columnId" :label="t('storage.column').value" :error="errors.column">
                            <template #default="{controlId, required, invalid, describedby}">
                                <input
                                    :id="controlId"
                                    class="ui-control ui-input"
                                    :class="{'is-invalid': invalid}"
                                    type="number"
                                    :min="0"
                                    :value="adapted.mutable.column"
                                    :aria-required="required || undefined"
                                    :aria-invalid="invalid || undefined"
                                    :aria-describedby="describedby"
                                    @input="onNumberInput($event, adapted.mutable, 'column')"
                                />
                            </template>
                        </FormField>
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
