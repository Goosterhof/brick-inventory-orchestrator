<script setup lang="ts">
import type {HttpService} from '@script-development/fs-http';
import type {AxiosError} from 'axios';

import DateInput from '@shared/components/forms/inputs/DateInput.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import SelectInput from '@shared/components/forms/inputs/SelectInput.vue';
import TextareaInput from '@shared/components/forms/inputs/TextareaInput.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {useFormSubmit} from '@shared/composables/useFormSubmit';
import {useValidationErrors} from '@shared/composables/useValidationErrors';
import {AxiosError as AxiosErrorClass} from 'axios';
import {computed, ref, watch} from 'vue';

import SectionHeading from './SectionHeading.vue';

type SetFormField = 'name' | 'setNumber' | 'pieceCount' | 'theme' | 'purchaseDate' | 'notes';

type CapturedMiddleware = (error: AxiosError<Record<string, unknown>>) => void;

let capturedMiddleware: CapturedMiddleware;

const mockHttpService = {
    registerResponseErrorMiddleware: (middleware: CapturedMiddleware) => {
        capturedMiddleware = middleware;
        return () => {};
    },
} as unknown as HttpService;

const {errors, clearErrors} = useValidationErrors<SetFormField>(mockHttpService);
const {handleSubmit, submitting} = useFormSubmit<SetFormField>({errors, clearErrors});

const name = ref('');
const setNumber = ref('');
const pieceCount = ref<number | null>(null);
const theme = ref('');
const purchaseDate = ref<string | null>(null);
const notes = ref<string | null>(null);

const successMessage = ref(false);
const serverError = ref('');

const inspectorJson = computed(() => JSON.stringify(errors.value, null, 2));

const resetForm = () => {
    name.value = '';
    setNumber.value = '';
    pieceCount.value = null;
    theme.value = '';
    purchaseDate.value = null;
    notes.value = null;
    serverError.value = '';
};

const simulateSuccess = async () => {
    await handleSubmit(async () => {
        await new Promise<void>((resolve) => {
            setTimeout(resolve, 400);
        });
    });
    successMessage.value = true;
    resetForm();
    setTimeout(() => {
        successMessage.value = false;
    }, 2000);
};

const simulate422 = async () => {
    await handleSubmit(async () => {
        const axiosError = new AxiosErrorClass('Validation failed', 'ERR_BAD_REQUEST', undefined, undefined, {
            status: 422,
            statusText: 'Unprocessable Entity',
            headers: {},
            config: {headers: new AxiosErrorClass('').config?.headers ?? ({} as never)},
            data: {
                message: 'The given data was invalid.',
                errors: {
                    name: ['The name field is required.'],
                    set_number: ['The set number must be unique.'],
                    piece_count: ['The piece count must be at least 1.'],
                    theme: ['The selected theme is invalid.'],
                    purchase_date: ['The purchase date must be a valid date.'],
                    notes: ['The notes may not be greater than 500 characters.'],
                },
            },
        } as never);

        capturedMiddleware(axiosError as AxiosError<Record<string, unknown>>);

        throw axiosError;
    });
};

const simulateServerError = async () => {
    try {
        await handleSubmit(async () => {
            throw new Error('Internal Server Error: The brick vault is offline.');
        });
    } catch {
        serverError.value = 'Internal Server Error: The brick vault is offline.';
    }
};

watch([name, setNumber, pieceCount, theme, purchaseDate, notes], () => {
    if (Object.keys(errors.value).length > 0) {
        clearErrors();
    }
    serverError.value = '';
});
</script>

<template>
    <section p="y-20" id="form-validation-workbench">
        <SectionHeading number="11" title="Form Validation Workbench" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            End-to-end demonstration of
            <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">useValidationErrors</code>
            and
            <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">useFormSubmit</code>
            composables working with every input type. Simulates real HTTP middleware behavior without a backend.
        </p>

        <!-- Demo Form -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Add a LEGO Set</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">
                    useValidationErrors(httpService) + useFormSubmit(validationErrors)
                </p>
                <div grid="~ cols-1 md:cols-2" gap="4" m="b-6">
                    <TextInput
                        v-model="name"
                        label="Set Name"
                        placeholder="e.g. Millennium Falcon"
                        :error="errors.name"
                    />
                    <TextInput
                        v-model="setNumber"
                        label="Set Number"
                        placeholder="e.g. 75192"
                        :error="errors.setNumber"
                    />
                    <NumberInput
                        v-model="pieceCount"
                        label="Piece Count"
                        :min="1"
                        placeholder="e.g. 7541"
                        :error="errors.pieceCount"
                    />
                    <SelectInput v-model="theme" label="Theme" :error="errors.theme">
                        <option value="" disabled>Select a theme</option>
                        <option value="star-wars">Star Wars</option>
                        <option value="technic">Technic</option>
                        <option value="city">City</option>
                        <option value="creator">Creator</option>
                    </SelectInput>
                    <DateInput v-model="purchaseDate" label="Purchase Date" :error="errors.purchaseDate" />
                    <TextareaInput v-model="notes" label="Notes" :rows="3" optional :error="errors.notes" />
                </div>

                <div flex="~ wrap" gap="3" items="center">
                    <PrimaryButton :disabled="submitting" @click="simulateSuccess">
                        {{ submitting ? 'Submitting...' : 'Submit (Success)' }}
                    </PrimaryButton>
                    <PrimaryButton :disabled="submitting" @click="simulate422">Submit (422 Errors)</PrimaryButton>
                    <PrimaryButton :disabled="submitting" @click="simulateServerError">
                        Submit (Server Error)
                    </PrimaryButton>
                </div>

                <p v-if="successMessage" m="t-4" p="3" bg="[#237841]" text="white sm" font="bold" class="brick-border">
                    Set added successfully!
                </p>

                <p v-if="serverError" m="t-4" p="3" bg="[#C41A16]" text="white sm" font="bold" class="brick-border">
                    {{ serverError }}
                </p>
            </div>
        </div>

        <!-- Inspector Panel -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Inspector Panel</p>
            <div p="6" class="brick-border" bg="gray-900" text="gray-100">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">errors.value (live)</p>
                <pre text="xs" font="mono" leading="relaxed" overflow="x-auto" data-testid="inspector-json">{{
                    inspectorJson
                }}</pre>
            </div>
        </div>

        <!-- How It Works -->
        <div m="b-12">
            <p class="brick-label" m="b-6">How It Works</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="sm" leading="relaxed" text-color="gray-700" m="b-3">
                    The composables intercept HTTP 422 responses via middleware registered on the
                    <code font="mono" text="xs" bg="gray-100" p="x-1.5 y-0.5">HttpService</code>. Backend validation
                    errors arrive as
                    <code font="mono" text="xs" bg="gray-100" p="x-1.5 y-0.5">snake_case</code>
                    and are automatically converted to
                    <code font="mono" text="xs" bg="gray-100" p="x-1.5 y-0.5">camelCase</code>
                    field names. The submit handler prevents double-submission and clears previous errors before each
                    attempt.
                </p>
                <pre m="t-3" p="3" bg="gray-100" class="brick-border" text="xs" font="mono" overflow="x-auto">
const {errors, clearErrors} = useValidationErrors&lt;SetFormField&gt;(httpService);
const {handleSubmit, submitting} = useFormSubmit(validationErrors);</pre
                >
            </div>
        </div>
    </section>
</template>
