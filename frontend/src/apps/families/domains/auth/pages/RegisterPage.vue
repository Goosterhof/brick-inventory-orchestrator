<script setup lang="ts">
import {
    FamilyRouterLink,
    familyAuthService,
    familyHttpService,
    familyRouterService,
    familyTranslationService,
} from '@app/services';
import {useForm} from '@script-development/fs-form';
import {FormField, TextInput} from '@script-development/ui-inputs';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {camelKey} from '@shared/helpers/string';
import {ref, useId} from 'vue';

const {t} = familyTranslationService;
const inviteQuery = familyRouterService.currentRouteRef.value.query.invite;
const initialInviteCode = typeof inviteQuery === 'string' ? inviteQuery : '';
const inviteCode = ref(initialInviteCode);
const familyName = ref('');
const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');

type RegistrationField = 'inviteCode' | 'familyName' | 'name' | 'email' | 'password' | 'passwordConfirmation';
const {errors, handleSubmit, submitting} = useForm<RegistrationField>(familyHttpService, {keyMapper: camelKey});

const inviteCodeId = useId();
const familyNameId = useId();
const nameId = useId();
const emailId = useId();
const passwordId = useId();
const passwordConfirmationId = useId();

const onSubmit = () =>
    handleSubmit(async () => {
        await familyAuthService.register({
            inviteCode: inviteCode.value || undefined,
            familyName: familyName.value,
            name: name.value,
            email: email.value,
            password: password.value,
            passwordConfirmation: passwordConfirmation.value,
        });
        await familyRouterService.goToRoute('home');
    });
</script>

<template>
    <div max-w="md" m="x-auto">
        <h1 text="2xl" font="bold" uppercase tracking="wide" m="b-6">{{ t('auth.createAccount').value }}</h1>

        <form flex="~ col" gap="4" @submit.prevent="onSubmit">
            <FormField :id="inviteCodeId" :label="t('auth.inviteCode').value" :error="errors.inviteCode">
                <template #default="{controlId, required, invalid, describedby}">
                    <TextInput
                        :id="controlId"
                        v-model="inviteCode"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

            <FormField :id="familyNameId" :label="t('auth.familyName').value" required :error="errors.familyName">
                <template #default="{controlId, required, invalid, describedby}">
                    <TextInput
                        :id="controlId"
                        v-model="familyName"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

            <FormField :id="nameId" :label="t('auth.name').value" required :error="errors.name">
                <template #default="{controlId, required, invalid, describedby}">
                    <TextInput
                        :id="controlId"
                        v-model="name"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

            <FormField :id="emailId" :label="t('auth.email').value" required :error="errors.email">
                <template #default="{controlId, required, invalid, describedby}">
                    <TextInput
                        :id="controlId"
                        v-model="email"
                        type="email"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

            <FormField :id="passwordId" :label="t('auth.password').value" required :error="errors.password">
                <template #default="{controlId, required, invalid, describedby}">
                    <TextInput
                        :id="controlId"
                        v-model="password"
                        type="password"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

            <FormField
                :id="passwordConfirmationId"
                :label="t('auth.passwordConfirmation').value"
                required
                :error="errors.passwordConfirmation"
            >
                <template #default="{controlId, required, invalid, describedby}">
                    <TextInput
                        :id="controlId"
                        v-model="passwordConfirmation"
                        type="password"
                        :required="required"
                        :invalid="invalid"
                        :describedby="describedby"
                    />
                </template>
            </FormField>

            <PrimaryButton type="submit" :disabled="submitting">{{ t('auth.register').value }}</PrimaryButton>
        </form>

        <p m="t-6" text="center">
            {{ t('auth.alreadyHaveAccount').value }}
            <FamilyRouterLink :to="{name: 'login'}" font="bold" text="decoration-underline">
                {{ t('auth.logIn').value }}
            </FamilyRouterLink>
        </p>
    </div>
</template>
