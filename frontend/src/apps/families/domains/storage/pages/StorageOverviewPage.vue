<script setup lang="ts">
import {familyLoadingService, familyRouterService, familySoundService, familyTranslationService} from '@app/services';
import {storageOptionStoreModule} from '@app/stores';
import {FormField, TextInput} from '@script-development/ui-inputs';
import EmptyState from '@shared/components/EmptyState.vue';
import ListItemButton from '@shared/components/ListItemButton.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {computed, onMounted, ref, useId} from 'vue';

import StorageTreeNode from '../components/StorageTreeNode.vue';

const {t} = familyTranslationService;
const {isLoading} = familyLoadingService;
const {getAll, retrieveAll} = storageOptionStoreModule;
const searchQuery = ref('');
const searchId = useId();

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
                <FormField :id="searchId" :label="t('common.search').value">
                    <template #default="{controlId, required, invalid, describedby}">
                        <TextInput
                            :id="controlId"
                            v-model="searchQuery"
                            type="search"
                            :placeholder="t('storage.searchPlaceholder').value"
                            :required="required"
                            :invalid="invalid"
                            :describedby="describedby"
                        />
                    </template>
                </FormField>
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
                            <p
                                v-if="option.gridRows !== null && option.gridColumns !== null"
                                text="sm [var(--brick-muted-text)]"
                            >
                                {{
                                    t('storage.gridDimensions', {
                                        rows: String(option.gridRows),
                                        columns: String(option.gridColumns),
                                    }).value
                                }}
                            </p>
                        </div>
                    </ListItemButton>
                </div>
            </template>

            <!-- Tree view when not searching -->
            <div v-else flex="~ col" gap="4">
                <StorageTreeNode
                    v-for="parent in topLevelOptions"
                    :key="parent.id"
                    :option="parent"
                    :options="getAll"
                    @select="goToDetail"
                />
            </div>
        </template>
    </div>
</template>
