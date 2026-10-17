<script setup lang="ts">
import type {StorageOption} from '@app/types/storageOption';
import type {Adapted} from '@script-development/fs-adapter-store';

import {familyTranslationService} from '@app/services';
import ListItemButton from '@shared/components/ListItemButton.vue';
const {option, options} = defineProps<{option: Adapted<StorageOption>; options: Adapted<StorageOption>[]}>();
const emit = defineEmits<{select: [id: number]}>();
const {t} = familyTranslationService;
const children = () => options.filter((child) => child.parentId === option.id);
</script>
<template>
    <div flex="~ col" gap="2">
        <ListItemButton @click="emit('select', option.id)">
            <div flex="1">
                <p font="bold">{{ option.name }}</p>
                <p v-if="option.description" text="sm [var(--brick-muted-text)]">{{ option.description }}</p>
                <p v-if="option.gridRows !== null && option.gridColumns !== null" text="sm [var(--brick-muted-text)]">
                    {{
                        t('storage.gridDimensions', {
                            rows: String(option.gridRows),
                            columns: String(option.gridColumns),
                        }).value
                    }}
                </p>
                <div flex gap="2" m="t-1">
                    <span
                        v-if="option.childIds.length > 0"
                        text="xs"
                        p="x-2 y-1"
                        bg="[var(--brick-surface-subtle)]"
                        font="bold"
                        >{{ t('storage.subLocationsCount', {count: String(option.childIds.length)}).value }}</span
                    >
                    <span v-if="option.row !== null && option.column !== null" text="xs [var(--brick-muted-text)]">{{
                        t('storage.rowColumnLabel', {row: String(option.row), column: String(option.column)}).value
                    }}</span>
                </div>
            </div>
        </ListItemButton>
        <div v-if="children().length > 0" flex="~ col" gap="2" m="l-8">
            <StorageTreeNode
                v-for="child in children()"
                :key="child.id"
                :option="child"
                :options="options"
                @select="emit('select', $event)"
            />
        </div>
    </div>
</template>
