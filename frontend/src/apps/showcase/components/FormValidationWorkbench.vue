<script setup lang="ts">
import type {HttpService} from '@script-development/fs-http';
import type {AxiosError} from 'axios';

import {useForm} from '@script-development/fs-form';
import {FormField, SingleSelect, TextInput} from '@script-development/ui-inputs';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {camelKey} from '@shared/helpers/string';
import {AxiosError as AxiosErrorClass} from 'axios';
import {computed, ref, useId, watch} from 'vue';

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

const {errors, clearErrors, handleSubmit, submitting} = useForm<SetFormField>(mockHttpService, {keyMapper: camelKey});

const name = ref('');
const setNumber = ref('');
const pieceCount = ref<number | null>(null);
const theme = ref('');
const purchaseDate = ref<string | null>(null);
const notes = ref<string | null>(null);

const successMessage = ref(false);
const serverError = ref('');

const nameId = useId();
const setNumberId = useId();
const pieceCountId = useId();
const themeId = useId();
const purchaseDateId = useId();
const notesId = useId();

const themeOptions = [
    {id: 'star-wars', label: 'Star Wars'},
    {id: 'technic', label: 'Technic'},
    {id: 'city', label: 'City'},
    {id: 'creator', label: 'Creator'},
];

// pieceCount is a nullable number; clear-to-null on empty/NaN input.
const onPieceCountInput = (event: Event) => {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    pieceCount.value = Number.isNaN(value) ? null : value;
};

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
            End-to-end demonstration of the one-call
            <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">useForm</code>
            composable — which composes the
            <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">useValidationErrors</code>
            and
            <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">useFormSubmit</code>
            primitives — working with every input type. Simulates real HTTP middleware behavior without a backend.
        </p>

        <!-- Demo Form -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Add a LEGO Set</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">
                    useForm(httpService) = useValidationErrors + useFormSubmit
                </p>
                <div grid="~ cols-1 md:cols-2" gap="4" m="b-6">
                    <FormField :id="nameId" label="Set Name" required :error="errors.name">
                        <template #default="{controlId, required, invalid, describedby}">
                            <TextInput
                                :id="controlId"
                                v-model="name"
                                placeholder="e.g. Millennium Falcon"
                                :required="required"
                                :invalid="invalid"
                                :describedby="describedby"
                            />
                        </template>
                    </FormField>
                    <FormField :id="setNumberId" label="Set Number" required :error="errors.setNumber">
                        <template #default="{controlId, required, invalid, describedby}">
                            <TextInput
                                :id="controlId"
                                v-model="setNumber"
                                placeholder="e.g. 75192"
                                :required="required"
                                :invalid="invalid"
                                :describedby="describedby"
                            />
                        </template>
                    </FormField>
                    <FormField :id="pieceCountId" label="Piece Count" required :error="errors.pieceCount">
                        <template #default="{controlId, required, invalid, describedby}">
                            <input
                                :id="controlId"
                                class="ui-control ui-input"
                                :class="{'is-invalid': invalid}"
                                type="number"
                                :min="1"
                                placeholder="e.g. 7541"
                                :value="pieceCount"
                                :aria-required="required"
                                :aria-invalid="invalid || undefined"
                                :aria-describedby="describedby"
                                @input="onPieceCountInput"
                            />
                        </template>
                    </FormField>
                    <FormField :id="themeId" label="Theme" required :error="errors.theme">
                        <template #default="{controlId, required, invalid, describedby}">
                            <SingleSelect
                                :id="controlId"
                                v-model="theme"
                                :options="themeOptions"
                                label="label"
                                options-label="Theme"
                                placeholder="Select a theme"
                                :required="required"
                                :invalid="invalid"
                                :describedby="describedby"
                            />
                        </template>
                    </FormField>
                    <FormField :id="purchaseDateId" label="Purchase Date" required :error="errors.purchaseDate">
                        <template #default="{controlId, required, invalid, describedby}">
                            <input
                                :id="controlId"
                                v-model="purchaseDate"
                                class="ui-control ui-input"
                                :class="{'is-invalid': invalid}"
                                type="date"
                                :aria-required="required"
                                :aria-invalid="invalid || undefined"
                                :aria-describedby="describedby"
                            />
                        </template>
                    </FormField>
                    <FormField :id="notesId" label="Notes" :error="errors.notes">
                        <template #default="{controlId, required, invalid, describedby}">
                            <textarea
                                :id="controlId"
                                v-model="notes"
                                class="ui-control"
                                :class="{'is-invalid': invalid}"
                                rows="3"
                                :aria-required="required"
                                :aria-invalid="invalid || undefined"
                                :aria-describedby="describedby"
                            />
                        </template>
                    </FormField>
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
                    <code font="mono" text="xs" bg="gray-100" p="x-1.5 y-0.5">useForm</code>
                    intercepts HTTP 422 responses via middleware registered on the
                    <code font="mono" text="xs" bg="gray-100" p="x-1.5 y-0.5">HttpService</code>. Backend validation
                    errors arrive as
                    <code font="mono" text="xs" bg="gray-100" p="x-1.5 y-0.5">snake_case</code>
                    and are automatically converted to
                    <code font="mono" text="xs" bg="gray-100" p="x-1.5 y-0.5">camelCase</code>
                    field names. The submit handler prevents double-submission and clears previous errors before each
                    attempt.
                </p>
                <pre m="t-3" p="3" bg="gray-100" class="brick-border" text="xs" font="mono" overflow="x-auto">
const {errors, clearErrors, handleSubmit, submitting} = useForm&lt;SetFormField&gt;(httpService);</pre>
            </div>
        </div>
    </section>
</template>
