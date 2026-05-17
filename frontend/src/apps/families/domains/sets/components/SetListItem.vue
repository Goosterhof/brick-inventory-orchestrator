<script setup lang="ts">
import type {FamilySet, FamilySetStatus} from '@app/types/familySet';

import {familyTranslationService} from '@app/services';
import BadgeLabel from '@shared/components/BadgeLabel.vue';
import ListItemButton from '@shared/components/ListItemButton.vue';

import CompletionGauge from './CompletionGauge.vue';

const {familySet, completionPercentage, completionLoading} = defineProps<{
    familySet: FamilySet;
    completionPercentage: number | null;
    completionLoading: boolean;
}>();

defineEmits<{click: []}>();

const {t} = familyTranslationService;

const statusKey: Record<
    FamilySetStatus,
    'sets.sealed' | 'sets.built' | 'sets.inProgress' | 'sets.inStorage' | 'sets.incomplete' | 'sets.wishlist'
> = {
    sealed: 'sets.sealed',
    built: 'sets.built',
    in_progress: 'sets.inProgress',
    in_storage: 'sets.inStorage',
    incomplete: 'sets.incomplete',
    wishlist: 'sets.wishlist',
};
</script>

<template>
    <ListItemButton @click="$emit('click')">
        <img
            v-if="familySet.set?.imageUrl"
            :src="familySet.set.imageUrl"
            :alt="familySet.set.name"
            w="20"
            h="20"
            object="contain"
        />
        <div
            v-else
            w="20"
            h="20"
            bg="[var(--brick-surface-subtle)]"
            flex
            items="center"
            justify="center"
            text="sm [var(--brick-muted-text)]"
        >
            {{ t('common.noImage').value }}
        </div>
        <div flex="1" min-w="0">
            <p font="bold">{{ familySet.set?.name ?? familySet.setNum }}</p>
            <p text="sm [var(--brick-muted-text)]">{{ familySet.set?.setNum ?? familySet.setNum }}</p>
            <div flex gap="2" m="t-1" items="center">
                <BadgeLabel :variant="familySet.status === 'wishlist' ? 'muted' : 'default'">
                    {{ t(statusKey[familySet.status]).value }}
                </BadgeLabel>
                <span text="xs [var(--brick-muted-text)]">{{ familySet.quantity }}x</span>
            </div>
            <div v-if="familySet.status !== 'wishlist'" m="t-2" max-w="48">
                <p v-if="completionLoading" text="xs [var(--brick-muted-text)]" aria-label="set-completion-loading">
                    {{ t('common.loading').value }}
                </p>
                <CompletionGauge
                    v-else
                    :percentage="completionPercentage"
                    :unknown-label="t('sets.completionUnknown').value"
                />
            </div>
        </div>
    </ListItemButton>
</template>
