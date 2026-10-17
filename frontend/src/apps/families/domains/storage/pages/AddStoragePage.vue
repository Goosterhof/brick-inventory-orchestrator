<script setup lang="ts">
import {familyHttpService, familyRouterService, familyTranslationService} from '@app/services';
import {storageOptionStoreModule} from '@app/stores';
import {useForm} from '@script-development/fs-form';
import {FormField, NumberInput, SingleSelect, Textarea, TextInput} from '@script-development/ui-inputs';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {camelKey} from '@shared/helpers/string';
import {computed, onMounted, useId, watch} from 'vue';

const {t} = familyTranslationService;
const adapted = storageOptionStoreModule.generateNew();
const {getAll, retrieveAll} = storageOptionStoreModule;
const parentId = useId();
const parentOptions = computed(() => getAll.value.map((option) => ({id: option.id, label: option.name})));
const selectedParent = computed(() => getAll.value.find((option) => option.id === adapted.mutable.value.parentId));
const hasParentGrid = computed(
    () =>
        selectedParent.value !== undefined &&
        selectedParent.value.gridRows !== null &&
        selectedParent.value.gridColumns !== null,
);
watch(
    () => adapted.mutable.value.parentId,
    () => {
        adapted.mutable.value.row = null;
        adapted.mutable.value.column = null;
    },
);

type AddStorageField = 'name' | 'description' | 'parentId' | 'row' | 'column' | 'gridRows' | 'gridColumns';
const {errors, handleSubmit, submitting} = useForm<AddStorageField>(familyHttpService, {keyMapper: camelKey});

const nameId = useId();
const descriptionId = useId();
const rowId = useId();
const columnId = useId();
const gridRowsId = useId();
const gridColumnsId = useId();

const onSubmit = () =>
    handleSubmit(async () => {
        const {gridRows, gridColumns} = adapted.mutable.value;
        if ((gridRows === null) !== (gridColumns === null)) return;
        const created = await adapted.create();
        await retrieveAll();
        await familyRouterService.goToRoute('storage-detail', created.id);
    });

onMounted(() => retrieveAll());
</script>

<template>
    <div max-w="md" m="x-auto">
        <h1 text="2xl" font="bold" uppercase tracking="wide" m="b-6">{{ t('storage.addStorage').value }}</h1>

        <form flex="~ col" gap="4" @submit.prevent="onSubmit">
            <FormField :id="nameId" :label="t('storage.name').value" required :error="errors.name">
                <template #default="{controlId, required, invalid, describedby}">
                    <TextInput
                        :id="controlId"
                        v-model="adapted.mutable.value.name"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

            <fieldset flex="~ col" gap="4" border="1 [var(--brick-border)]" p="4" rounded>
                <legend font="bold">{{ t('storage.grid').value }}</legend>
                <p text="sm [var(--brick-muted-text)]">{{ t('storage.gridHelp').value }}</p>
                <div flex gap="4">
                    <FormField
                        :id="gridRowsId"
                        :label="t('storage.gridRows').value"
                        :error="errors.gridRows"
                        :required="adapted.mutable.value.gridColumns !== null"
                    >
                        <template #default="{controlId, required, invalid, describedby}">
                            <NumberInput
                                :id="controlId"
                                v-model="adapted.mutable.value.gridRows"
                                :min="1"
                                :max="100"
                                :required="required"
                                :invalid="invalid"
                                :describedby="describedby"
                            />
                        </template>
                    </FormField>
                    <FormField
                        :id="gridColumnsId"
                        :label="t('storage.gridColumns').value"
                        :error="errors.gridColumns"
                        :required="adapted.mutable.value.gridRows !== null"
                    >
                        <template #default="{controlId, required, invalid, describedby}">
                            <NumberInput
                                :id="controlId"
                                v-model="adapted.mutable.value.gridColumns"
                                :min="1"
                                :max="100"
                                :required="required"
                                :invalid="invalid"
                                :describedby="describedby"
                            />
                        </template>
                    </FormField>
                </div>
            </fieldset>

            <FormField :id="parentId" :label="t('storage.parentLocation').value" :error="errors.parentId">
                <template #default="{controlId, required, invalid, describedby}">
                    <SingleSelect
                        :id="controlId"
                        v-model="adapted.mutable.value.parentId"
                        :options="parentOptions"
                        label="label"
                        :clear-label="t('storage.noParent').value"
                        :options-label="t('storage.parentLocation').value"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

            <FormField :id="descriptionId" :label="t('storage.description').value">
                <template #default="{controlId, required, invalid, describedby}">
                    <Textarea
                        :id="controlId"
                        v-model="adapted.mutable.value.description"
                        :rows="3"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

            <div v-if="hasParentGrid" flex gap="4">
                <div flex="1 ~ col" gap="2">
                    <FormField :id="rowId" :label="t('storage.row').value" :error="errors.row">
                        <template #default="{controlId, required, invalid, describedby}">
                            <NumberInput
                                :id="controlId"
                                v-model="adapted.mutable.value.row"
                                :min="1"
                                :max="selectedParent?.gridRows ?? undefined"
                                :required="required"
                                :invalid="invalid"
                                :describedby="describedby"
                            />
                        </template>
                    </FormField>
                </div>
                <div flex="1 ~ col" gap="2">
                    <FormField :id="columnId" :label="t('storage.column').value" :error="errors.column">
                        <template #default="{controlId, required, invalid, describedby}">
                            <NumberInput
                                :id="controlId"
                                v-model="adapted.mutable.value.column"
                                :min="1"
                                :max="selectedParent?.gridColumns ?? undefined"
                                :required="required"
                                :invalid="invalid"
                                :describedby="describedby"
                            />
                        </template>
                    </FormField>
                </div>
            </div>

            <PrimaryButton type="submit" :disabled="submitting">{{ t('storage.add').value }}</PrimaryButton>
        </form>
    </div>
</template>
