<script setup lang="ts">
import type {ImportJob} from '@app/types/importJob';
import type {FamilyMember} from '@app/types/profile';

import {
    familyAuthService,
    familyHttpService,
    familySoundService,
    familyThemeService,
    familyTranslationService,
} from '@app/services';
import {FormField, TextInput} from '@script-development/ui-inputs';
import BadgeLabel from '@shared/components/BadgeLabel.vue';
import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import DangerButton from '@shared/components/DangerButton.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {isAxiosError} from 'axios';
import {computed, onMounted, onUnmounted, ref, useId} from 'vue';

const {t} = familyTranslationService;

const members = ref<FamilyMember[]>([]);
const membersLoading = ref(true);

const isHead = computed(() => {
    const userId = familyAuthService.userId();
    return members.value.some((member) => member.id === userId && member.isHead);
});

const memberToRemove = ref<FamilyMember | null>(null);
const showRemoveConfirm = ref(false);
const memberRemoved = ref(false);
const removeMemberError = ref('');

const confirmRemoveMember = (member: FamilyMember) => {
    memberToRemove.value = member;
    showRemoveConfirm.value = true;
    memberRemoved.value = false;
    removeMemberError.value = '';
};

const cancelRemoveMember = () => {
    showRemoveConfirm.value = false;
    memberToRemove.value = null;
};

const removeMember = async () => {
    if (!memberToRemove.value) return;

    const memberId = memberToRemove.value.id;
    showRemoveConfirm.value = false;

    try {
        await familyHttpService.deleteRequest(`/family/members/${String(memberId)}`);
        members.value = members.value.filter((m) => m.id !== memberId);
        memberRemoved.value = true;
        removeMemberError.value = '';
    } catch (error: unknown) {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status === 422) {
            removeMemberError.value = t('settings.removeMemberSelfError').value;
        } else if (status === 404) {
            removeMemberError.value = t('settings.removeMemberNotFound').value;
            members.value = members.value.filter((m) => m.id !== memberId);
        } else {
            removeMemberError.value = t('settings.removeMemberError').value;
        }
    } finally {
        memberToRemove.value = null;
    }
};

const rebrickableToken = ref('');
const tokenSaving = ref(false);
const tokenSaved = ref(false);
const tokenError = ref('');

const importing = ref(false);
const importJob = ref<ImportJob | null>(null);
const importError = ref('');
let pollInterval: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
    const response = await familyHttpService.getRequest<FamilyMember[]>('/family/members');
    members.value = response.data;
    membersLoading.value = false;
});

const rebrickableTokenId = useId();

const saveToken = async () => {
    tokenSaving.value = true;
    tokenSaved.value = false;
    tokenError.value = '';

    try {
        await familyHttpService.putRequest('/family/rebrickable-token', {rebrickableUserToken: rebrickableToken.value});
        tokenSaved.value = true;
        rebrickableToken.value = '';
    } catch (error: unknown) {
        const status = isAxiosError(error) ? error.response?.status : undefined;
        tokenError.value = status === 403 ? t('settings.notFamilyHead').value : t('settings.tokenSaveError').value;
    } finally {
        tokenSaving.value = false;
    }
};

const stopPolling = () => {
    if (pollInterval !== null) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
};

const pollImportStatus = () => {
    pollInterval = setInterval(async () => {
        try {
            const response = await familyHttpService.getRequest<ImportJob>('/family-sets/import-status');
            importJob.value = response.data;

            if (importJob.value.status === 'completed' || importJob.value.status === 'failed') {
                stopPolling();
                importing.value = false;
                if (importJob.value.status === 'completed') {
                    familySoundService.play('cascade');
                }
            }
        } catch {
            stopPolling();
            importing.value = false;
            importError.value = t('settings.importError').value;
        }
    }, 3000);
};

const importSets = async () => {
    importing.value = true;
    importJob.value = null;
    importError.value = '';

    try {
        const response = await familyHttpService.postRequest<ImportJob>('/family-sets/import-from-rebrickable', {});
        importJob.value = response.data;
        pollImportStatus();
    } catch (error: unknown) {
        importing.value = false;
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status === 403) {
            importError.value = t('settings.notFamilyHead').value;
        } else if (status === 422) {
            importError.value = t('settings.noTokenConfigured').value;
        } else {
            importError.value = t('settings.importError').value;
        }
    }
};

onUnmounted(() => {
    stopPolling();
});
</script>

<template>
    <div max-w="md" m="x-auto">
        <PageHeader :title="t('settings.title').value" />

        <div flex="~ col" gap="8">
            <section flex="~ col" gap="4">
                <h2 text="xl" font="bold" uppercase tracking="wide">{{ t('settings.themeTitle').value }}</h2>
                <p text="[var(--brick-muted-text)]">{{ t('settings.themeDescription').value }}</p>

                <button
                    @click="familyThemeService.toggleTheme()"
                    p="x-4 y-3"
                    bg="[var(--brick-card-bg)] hover:brick-yellow"
                    font="bold"
                    uppercase
                    tracking="wide"
                    cursor="pointer"
                    class="brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active active:translate-x-[2px] active:translate-y-[2px]"
                >
                    {{
                        familyThemeService.isDark.value ? t('settings.themeDark').value : t('settings.themeLight').value
                    }}
                </button>
            </section>

            <hr border="t-3 [var(--brick-border-color)]" />

            <section flex="~ col" gap="4">
                <h2 text="xl" font="bold" uppercase tracking="wide">{{ t('settings.membersTitle').value }}</h2>

                <p v-if="membersLoading" text="[var(--brick-muted-text)]">{{ t('common.loading').value }}</p>

                <div v-else flex="~ col" gap="2">
                    <div
                        v-for="member in members"
                        :key="member.id"
                        flex
                        items="center"
                        gap="3"
                        p="3"
                        bg="[var(--brick-card-bg)]"
                        class="brick-border"
                    >
                        <div flex="1">
                            <p font="bold">{{ member.name }}</p>
                            <p text="sm [var(--brick-muted-text)]">{{ member.email }}</p>
                        </div>
                        <BadgeLabel v-if="member.isHead" variant="highlight">
                            {{ t('settings.familyHead').value }}
                        </BadgeLabel>
                        <DangerButton v-if="isHead && !member.isHead" @click="confirmRemoveMember(member)">
                            {{ t('settings.removeMember').value }}
                        </DangerButton>
                    </div>

                    <p v-if="memberRemoved" text="baseplate-green" font="bold">
                        {{ t('settings.memberRemoved').value }}
                    </p>
                    <p v-if="removeMemberError" text="[var(--brick-danger-text)]" font="bold">
                        {{ removeMemberError }}
                    </p>
                </div>

                <ConfirmDialog
                    :open="showRemoveConfirm"
                    :title="t('settings.removeMemberTitle').value"
                    :message="t('settings.removeMemberMessage').value"
                    :sound-service="familySoundService"
                    @confirm="removeMember"
                    @cancel="cancelRemoveMember"
                >
                    <template #confirm>{{ t('settings.removeMember').value }}</template>
                    <template #cancel>{{ t('common.cancel').value }}</template>
                </ConfirmDialog>
            </section>

            <hr border="t-3 [var(--brick-border-color)]" />

            <section flex="~ col" gap="4">
                <h2 text="xl" font="bold" uppercase tracking="wide">{{ t('settings.rebrickableTitle').value }}</h2>
                <p text="[var(--brick-muted-text)]">{{ t('settings.rebrickableDescription').value }}</p>

                <form flex="~ col" gap="4" @submit.prevent="saveToken">
                    <FormField
                        :id="rebrickableTokenId"
                        :label="t('settings.rebrickableToken').value"
                        required
                        :error="tokenError"
                    >
                        <template #default="{controlId, required, invalid, describedby}">
                            <TextInput
                                :id="controlId"
                                v-model="rebrickableToken"
                                :required="required"
                                :invalid="invalid"
                                :describedby="describedby"
                            />
                        </template>
                    </FormField>

                    <p v-if="tokenSaved" text="baseplate-green" font="bold">{{ t('settings.tokenSaved').value }}</p>

                    <PrimaryButton
                        type="submit"
                        :disabled="tokenSaving || !rebrickableToken"
                        :sound-service="familySoundService"
                        silent
                    >
                        {{ t('settings.saveToken').value }}
                    </PrimaryButton>
                </form>
            </section>

            <hr border="t-3 [var(--brick-border-color)]" />

            <section flex="~ col" gap="4">
                <h2 text="xl" font="bold" uppercase tracking="wide">{{ t('settings.importTitle').value }}</h2>
                <p text="[var(--brick-muted-text)]">{{ t('settings.importDescription').value }}</p>

                <div v-if="importJob" p="4" bg="[var(--brick-card-bg)]" class="brick-border" flex="~ col" gap="2">
                    <p v-if="importJob.status === 'completed'" font="bold">
                        {{
                            t('settings.importComplete', {
                                processed: String(importJob.processedSets),
                                failed: String(importJob.failedSets),
                            }).value
                        }}
                    </p>
                    <p v-else-if="importJob.status === 'failed'" font="bold" text="[var(--brick-danger-text)]">
                        {{ t('settings.importFailed').value }}
                    </p>
                    <p v-else font="bold">
                        {{
                            t('settings.importProgress', {
                                processed: String(importJob.processedSets),
                                total: String(importJob.totalSets),
                            }).value
                        }}
                    </p>
                    <div
                        v-if="importJob.failedSetDetails && importJob.failedSetDetails.length > 0"
                        flex="~ col"
                        gap="1"
                        text="sm"
                    >
                        <p
                            v-for="(detail, index) in importJob.failedSetDetails"
                            :key="index"
                            text="[var(--brick-danger-text)]"
                        >
                            {{ detail.setNum }}: {{ detail.error }}
                        </p>
                    </div>
                </div>

                <p v-if="importError" text="[var(--brick-danger-text)]" font="bold">{{ importError }}</p>

                <PrimaryButton :disabled="importing" :sound-service="familySoundService" @click="importSets">
                    {{ importing ? t('settings.importing').value : t('settings.importButton').value }}
                </PrimaryButton>
            </section>
        </div>
    </div>
</template>
