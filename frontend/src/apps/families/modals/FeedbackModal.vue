<script setup lang="ts">
import {familyHttpService, familyToastService, familyTranslationService} from '@app/services';
import {PhPaperclip, PhX} from '@phosphor-icons/vue';
import {useForm} from '@script-development/fs-form';
import {FormField, Textarea, TextInput} from '@script-development/ui-inputs';
import ModalDialog from '@shared/components/ModalDialog.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {camelKey} from '@shared/helpers/string';
import {isAxiosError} from 'axios';
import {computed, ref, useId} from 'vue';

const MAX_SCREENSHOTS = 5;
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/bmp,image/gif,image/tiff,image/webp';

defineProps<{open: boolean}>();
const emit = defineEmits<{close: []}>();

const {t} = familyTranslationService;

type FeedbackField = 'title' | 'description' | 'screenshots';
const {errors, handleSubmit, submitting} = useForm<FeedbackField>(familyHttpService, {keyMapper: camelKey});

const title = ref('');
const description = ref('');
const screenshots = ref<File[]>([]);

// Re-keying the input recreates the element, clearing the browser's own file
// selection so re-picking the same file fires `change` again.
const fileInputKey = ref(0);

const fileInputId = useId();
const titleId = useId();
const descriptionId = useId();

// The backend keys per-file errors as `screenshots.0`, `screenshots.1`, … —
// the files share one control, so join every screenshots* error (array-level
// and per-file) into its single error display instead of surfacing them one
// resubmit at a time.
const screenshotsError = computed(() => {
    const entries = Object.entries(errors.value as Record<string, string | undefined>);

    return entries
        .flatMap(([key, message]) => (key.startsWith('screenshots') && message !== undefined ? [message] : []))
        .join(' ');
});

const handleFilesSelected = (event: Event) => {
    const input = event.target as HTMLInputElement;
    screenshots.value = [...(input.files ?? [])].slice(0, MAX_SCREENSHOTS);
};

const removeScreenshot = (index: number) => {
    screenshots.value = screenshots.value.filter((_, fileIndex) => fileIndex !== index);
    if (screenshots.value.length === 0) fileInputKey.value += 1;
};

const resetForm = () => {
    title.value = '';
    description.value = '';
    screenshots.value = [];
    fileInputKey.value += 1;
};

// ADR-0029 note: the request middleware skips FormData (no camelCase→snake_case
// conversion for multipart), so these field names are sent exactly as the
// backend's SubmitFeedbackRequest expects: title, description, screenshots[].
const buildFormData = () => {
    const formData = new FormData();
    formData.append('title', title.value);
    formData.append('description', description.value);
    for (const file of screenshots.value) formData.append('screenshots[]', file);

    return formData;
};

const onSubmit = () =>
    handleSubmit(async () => {
        try {
            await familyHttpService.postRequest('/feedback', buildFormData());
            familyToastService.show({message: t('feedback.success').value, variant: 'success'});
            resetForm();
            emit('close');
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 422) throw error;
            familyToastService.show({message: t('feedback.error').value, variant: 'error'});
        }
    });
</script>

<template>
    <ModalDialog :open="open" @close="emit('close')">
        <template #title>{{ t('feedback.title').value }}</template>

        <form flex="~ col" gap="4" @submit.prevent="onSubmit">
            <FormField :id="titleId" :label="t('feedback.titleLabel').value" required :error="errors.title">
                <template #default="{controlId, required, invalid, describedby}">
                    <TextInput
                        :id="controlId"
                        v-model="title"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

            <FormField
                :id="descriptionId"
                :label="t('feedback.descriptionLabel').value"
                required
                :error="errors.description"
            >
                <template #default="{controlId, required, invalid, describedby}">
                    <Textarea
                        :id="controlId"
                        v-model="description"
                        :rows="5"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

            <div flex="~ col" gap="2">
                <label :for="fileInputId" font="bold" uppercase tracking="wide" text="sm">
                    {{ t('feedback.screenshotsLabel').value }}
                </label>
                <input
                    :id="fileInputId"
                    :key="fileInputKey"
                    type="file"
                    multiple
                    :accept="ACCEPTED_IMAGE_TYPES"
                    @change="handleFilesSelected"
                    p="2"
                    bg="[var(--brick-card-bg)]"
                    cursor="pointer"
                    class="brick-border brick-shadow brick-transition"
                    :aria-describedby="screenshotsError ? `${fileInputId}-error` : undefined"
                />
                <p text="xs [var(--brick-muted-text)]">{{ t('feedback.screenshotsHint').value }}</p>
                <p v-if="screenshotsError" :id="`${fileInputId}-error`" text="sm brick-red" font="bold" role="alert">
                    {{ screenshotsError }}
                </p>

                <ul v-if="screenshots.length > 0" flex="~ col" gap="1" data-testid="feedback-screenshot-list">
                    <li
                        v-for="(file, index) in screenshots"
                        :key="`${file.name}-${index}`"
                        flex
                        items="center"
                        gap="2"
                        p="x-2 y-1"
                        bg="[var(--brick-surface-subtle)]"
                        text="sm"
                        class="brick-border"
                        border="1"
                    >
                        <PhPaperclip size="14" aria-hidden="true" />
                        <span flex="1" truncate>{{ file.name }}</span>
                        <button
                            type="button"
                            :aria-label="t('feedback.removeScreenshot').value.replace('{name}', file.name)"
                            @click="removeScreenshot(index)"
                            p="1"
                            cursor="pointer"
                            bg="transparent hover:brick-yellow"
                            class="brick-transition"
                        >
                            <PhX size="14" aria-hidden="true" />
                        </button>
                    </li>
                </ul>
            </div>

            <PrimaryButton type="submit" :disabled="submitting">{{ t('feedback.send').value }}</PrimaryButton>
        </form>
    </ModalDialog>
</template>
