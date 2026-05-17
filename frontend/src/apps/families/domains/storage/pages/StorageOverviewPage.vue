<script setup lang="ts">
import type {StorageOption} from '@app/types/storageOption';
import type {Adapted} from '@script-development/fs-adapter-store';

import {familyLoadingService, familyRouterService, familySoundService, familyTranslationService} from '@app/services';
import {storageOptionStoreModule} from '@app/stores';
import EmptyState from '@shared/components/EmptyState.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import ListItemButton from '@shared/components/ListItemButton.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {computed, onMounted, ref} from 'vue';

const {t} = familyTranslationService;
const {isLoading} = familyLoadingService;
const {getAll, retrieveAll} = storageOptionStoreModule;
const searchQuery = ref('');

const isSearching = computed(() => searchQuery.value.trim().length > 0);

const filteredOptions = computed(() => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!query) return getAll.value;

    return getAll.value.filter(
        (o) =>
            o.name.toLowerCase().includes(query) ||
            (o.description !== null && o.description.toLowerCase().includes(query)),
    );
});

const topLevelOptions = computed(() => getAll.value.filter((o) => o.parentId === null));

const getChildren = (parentId: number): Adapted<StorageOption>[] => getAll.value.filter((o) => o.parentId === parentId);

onMounted(async () => {
    await retrieveAll();
});

const goToAdd = async () => {
    await familyRouterService.goToRoute('storage-add');
};

const goToDetail = async (id: number) => {
    await familyRouterService.goToRoute('storage-detail', id);
};
</script>

<template>
    <div max-w="6xl" m="x-auto">
        <PageHeader :title="t('storage.title').value">
            <PrimaryButton :sound-service="familySoundService" @click="goToAdd">{{
                t('storage.addStorage').value
            }}</PrimaryButton>
        </PageHeader>

        <p v-if="isLoading" text="[var(--brick-muted-text)]">{{ t('common.loading').value }}</p>

        <EmptyState
            v-else-if="getAll.length === 0"
            :message="t('storage.noStorage').value"
            show-brick
            brick-color="#0055BF"
        />

        <template v-else>
            <div m="b-4">
                <TextInput
                    v-model="searchQuery"
                    :label="t('common.search').value"
                    type="search"
                    :placeholder="t('storage.searchPlaceholder').value"
                    optional
                />
            </div>

            <!-- Flat list when searching -->
            <template v-if="isSearching">
                <EmptyState v-if="filteredOptions.length === 0" :message="t('common.noResults').value" />

                <div v-else flex="~ col" gap="4">
                    <ListItemButton v-for="option in filteredOptions" :key="option.id" @click="goToDetail(option.id)">
                        <div flex="1">
                            <p font="bold">{{ option.name }}</p>
                            <p v-if="option.description" text="sm [var(--brick-muted-text)]">
                                {{ option.description }}
                            </p>
                        </div>
                    </ListItemButton>
                </div>
            </template>

            <!-- Tree view when not searching -->
            <div v-else flex="~ col" gap="4">
                <div v-for="parent in topLevelOptions" :key="parent.id" flex="~ col" gap="2">
                    <ListItemButton @click="goToDetail(parent.id)">
                        <div flex="1">
                            <p font="bold">{{ parent.name }}</p>
                            <p v-if="parent.description" text="sm [var(--brick-muted-text)]">
                                {{ parent.description }}
                            </p>
                            <div flex gap="2" m="t-1">
                                <span
                                    v-if="parent.childIds.length > 0"
                                    text="xs"
                                    p="x-2 y-1"
                                    bg="[var(--brick-surface-subtle)]"
                                    font="bold"
                                >
                                    {{ t('storage.subLocationsCount', {count: String(parent.childIds.length)}).value }}
                                </span>
                                <span
                                    v-if="parent.row !== null && parent.column !== null"
                                    text="xs [var(--brick-muted-text)]"
                                >
                                    {{
                                        t('storage.rowColumnLabel', {
                                            row: String(parent.row),
                                            column: String(parent.column),
                                        }).value
                                    }}
                                </span>
                            </div>
                        </div>
                    </ListItemButton>

                    <div v-if="getChildren(parent.id).length > 0" flex="~ col" gap="2" m="l-8">
                        <ListItemButton
                            v-for="child in getChildren(parent.id)"
                            :key="child.id"
                            @click="goToDetail(child.id)"
                        >
                            <div flex="1">
                                <p font="bold">{{ child.name }}</p>
                                <p v-if="child.description" text="sm [var(--brick-muted-text)]">
                                    {{ child.description }}
                                </p>
                                <div flex gap="2" m="t-1">
                                    <span
                                        v-if="child.row !== null && child.column !== null"
                                        text="xs [var(--brick-muted-text)]"
                                    >
                                        {{
                                            t('storage.rowColumnLabel', {
                                                row: String(child.row),
                                                column: String(child.column),
                                            }).value
                                        }}
                                    </span>
                                </div>
                            </div>
                        </ListItemButton>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
