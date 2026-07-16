<script setup lang="ts">
import {familyHttpService, familyRouterService, familyTranslationService} from '@app/services';
import {storageOptionStoreModule} from '@app/stores';
import {useForm} from '@script-development/fs-form';
import {FormField, TextInput} from '@script-development/ui-inputs';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {camelKey} from '@shared/helpers/string';
import {useId} from 'vue';

const {t} = familyTranslationService;
const adapted = storageOptionStoreModule.generateNew();

type AddStorageField = 'name' | 'description' | 'parentId' | 'row' | 'column';
const {errors, handleSubmit, submitting} = useForm<AddStorageField>(familyHttpService, {keyMapper: camelKey});

const nameId = useId();
const descriptionId = useId();
const rowId = useId();
const columnId = useId();

// row/column are nullable numbers; clear-to-null on empty/NaN input (preserving
// the old NumberInput molecule's behaviour) rather than leaving a stale value.
const onNumberInput = (event: Event, field: 'row' | 'column') => {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    adapted.mutable.value[field] = Number.isNaN(value) ? null : value;
};

const onSubmit = () =>
    handleSubmit(async () => {
        const created = await adapted.create();
        await familyRouterService.goToRoute('storage-detail', created.id);
    });
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

            <FormField :id="descriptionId" :label="t('storage.description').value">
                <template #default="{controlId, required, invalid, describedby}">
                    <textarea
                        :id="controlId"
                        v-model="adapted.mutable.value.description"
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
                                :value="adapted.mutable.value.row"
                                :aria-required="required || undefined"
                                :aria-invalid="invalid || undefined"
                                :aria-describedby="describedby"
                                @input="onNumberInput($event, 'row')"
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
                                :value="adapted.mutable.value.column"
                                :aria-required="required || undefined"
                                :aria-invalid="invalid || undefined"
                                :aria-describedby="describedby"
                                @input="onNumberInput($event, 'column')"
                            />
                        </template>
                    </FormField>
                </div>
            </div>

            <PrimaryButton type="submit" :disabled="submitting">{{ t('storage.add').value }}</PrimaryButton>
        </form>
    </div>
</template>
