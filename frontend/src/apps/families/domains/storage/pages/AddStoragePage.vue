<script setup lang="ts">
import {familyHttpService, familyRouterService, familyTranslationService} from '@app/services';
import {storageOptionStoreModule} from '@app/stores';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import TextareaInput from '@shared/components/forms/inputs/TextareaInput.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {useFormSubmit} from '@shared/composables/useFormSubmit';
import {useValidationErrors} from '@shared/composables/useValidationErrors';

const {t} = familyTranslationService;
const adapted = storageOptionStoreModule.generateNew();

type AddStorageField = 'name' | 'description' | 'parentId' | 'row' | 'column';
const validationErrors = useValidationErrors<AddStorageField>(familyHttpService);
const {errors} = validationErrors;
const {handleSubmit, submitting} = useFormSubmit(validationErrors);

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
            <TextInput v-model="adapted.mutable.value.name" :label="t('storage.name').value" :error="errors.name" />

            <TextareaInput
                v-model="adapted.mutable.value.description"
                :label="t('storage.description').value"
                optional
            />

            <div flex gap="4">
                <div flex="1 ~ col" gap="2">
                    <NumberInput
                        v-model="adapted.mutable.value.row"
                        :label="t('storage.row').value"
                        :error="errors.row"
                        :min="0"
                        optional
                    />
                </div>
                <div flex="1 ~ col" gap="2">
                    <NumberInput
                        v-model="adapted.mutable.value.column"
                        :label="t('storage.column').value"
                        :error="errors.column"
                        :min="0"
                        optional
                    />
                </div>
            </div>

            <PrimaryButton type="submit" :disabled="submitting">{{ t('storage.add').value }}</PrimaryButton>
        </form>
    </div>
</template>
