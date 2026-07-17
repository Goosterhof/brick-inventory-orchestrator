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
const email = ref('');
const password = ref('');

type LoginField = 'email' | 'password';
const {errors, handleSubmit, submitting} = useForm<LoginField>(familyHttpService, {keyMapper: camelKey});

const emailId = useId();
const passwordId = useId();

const onSubmit = () =>
    handleSubmit(async () => {
        await familyAuthService.login({email: email.value, password: password.value});
        await familyRouterService.goToRoute('home');
    });
</script>

<template>
    <div max-w="md" m="x-auto">
        <h1 text="2xl" font="bold" uppercase tracking="wide" m="b-6">{{ t('auth.logIn').value }}</h1>

        <form flex="~ col" gap="4" @submit.prevent="onSubmit">
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

            <PrimaryButton type="submit" :disabled="submitting">{{ t('auth.logIn').value }}</PrimaryButton>
        </form>

        <p m="t-6" text="center">
            {{ t('auth.noAccountYet').value }}
            <FamilyRouterLink :to="{name: 'register'}" font="bold" text="decoration-underline">
                {{ t('auth.register').value }}
            </FamilyRouterLink>
        </p>
    </div>
</template>
