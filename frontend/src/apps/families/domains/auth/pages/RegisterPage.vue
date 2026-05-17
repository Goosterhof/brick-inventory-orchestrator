<script setup lang="ts">
import {
    FamilyRouterLink,
    familyAuthService,
    familyHttpService,
    familyRouterService,
    familyTranslationService,
} from '@app/services';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {useFormSubmit} from '@shared/composables/useFormSubmit';
import {useValidationErrors} from '@shared/composables/useValidationErrors';
import {ref} from 'vue';

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
const validationErrors = useValidationErrors<RegistrationField>(familyHttpService);
const {errors} = validationErrors;
const {handleSubmit, submitting} = useFormSubmit(validationErrors);

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
            <TextInput
                v-model="inviteCode"
                :label="t('auth.inviteCode').value"
                :error="errors.inviteCode"
                :optional="true"
            />

            <TextInput v-model="familyName" :label="t('auth.familyName').value" :error="errors.familyName" />

            <TextInput v-model="name" :label="t('auth.name').value" :error="errors.name" />

            <TextInput v-model="email" :label="t('auth.email').value" type="email" :error="errors.email" />

            <TextInput v-model="password" :label="t('auth.password').value" type="password" :error="errors.password" />

            <TextInput
                v-model="passwordConfirmation"
                :label="t('auth.passwordConfirmation').value"
                type="password"
                :error="errors.passwordConfirmation"
            />

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
