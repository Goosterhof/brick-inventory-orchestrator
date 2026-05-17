<script setup lang="ts">
import type {Adapted, AdapterStoreModule, NewAdapted} from '@script-development/fs-adapter-store';
import type {HttpService} from '@script-development/fs-http';
import type {LoadingService} from '@script-development/fs-loading';
import type {StorageService} from '@script-development/fs-storage';
import type {Item} from '@shared/types/item';

import {createAdapterStoreModule, resourceAdapter} from '@script-development/fs-adapter-store';
import DangerButton from '@shared/components/DangerButton.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {deepSnakeKeys} from '@shared/helpers/string';
import {computed, ref, shallowRef, watch} from 'vue';

import SectionHeading from './SectionHeading.vue';

interface Minifig extends Item {
    displayName: string;
    partCount: number;
    themeGroup: string;
}

let nextId = 1;

const mockStorageData = ref<Record<string, unknown>>({});

const mockStorageService: Pick<StorageService, 'get' | 'put'> = {
    get: <T>(key: string, defaultValue?: T): T => {
        const stored = mockStorageData.value[key];
        return (stored ?? defaultValue) as T;
    },
    put: (key: string, value: unknown): void => {
        mockStorageData.value = {...mockStorageData.value, [key]: value};
    },
};

const mockLoadingService = {} as unknown as Pick<LoadingService, 'ensureLoadingFinished'>;

const mockHttpService = {
    postRequest: <T>(_endpoint: string, data: unknown) => {
        const created = {...(data as Record<string, unknown>), id: nextId++} as T;
        return Promise.resolve({data: created});
    },
    patchRequest: <T>(_endpoint: string, data: unknown) => Promise.resolve({data: data as T}),
    deleteRequest: () => Promise.resolve({data: undefined}),
} as unknown as HttpService;

function minifigAdapter(storeModule: AdapterStoreModule<Minifig>): NewAdapted<Minifig>;
function minifigAdapter(storeModule: AdapterStoreModule<Minifig>, resourceGetter: () => Minifig): Adapted<Minifig>;
function minifigAdapter(
    storeModule: AdapterStoreModule<Minifig>,
    resourceGetter?: () => Minifig,
): Adapted<Minifig> | NewAdapted<Minifig> {
    if (resourceGetter) {
        return resourceAdapter(resourceGetter, 'minifigs', storeModule, mockHttpService);
    }

    return resourceAdapter<Minifig>(
        {displayName: '', partCount: 4, themeGroup: 'City'},
        'minifigs',
        storeModule,
        mockHttpService,
    );
}

const storeModule = createAdapterStoreModule<Minifig>({
    domainName: 'minifigs',
    adapter: minifigAdapter,
    httpService: mockHttpService,
    storageService: mockStorageService,
    loadingService: mockLoadingService,
});

const newAdapted = shallowRef(storeModule.generateNew());

const toSnakeSnapshot = (item: {mutable: {value: Record<string, unknown>}}): Record<string, unknown> =>
    deepSnakeKeys({...item.mutable.value});

const newSnakeSnapshot = computed(() => toSnakeSnapshot(newAdapted.value));
const lastAction = ref('');
const selectedId = ref<number | null>(null);
const selectedItem = computed(() =>
    selectedId.value !== null ? storeModule.getById(selectedId.value).value : undefined,
);

const handleCreate = async () => {
    const created = await newAdapted.value.create();
    lastAction.value = `Created minifig #${created.id}: "${created.displayName}"`;
    selectedId.value = created.id;
    newAdapted.value = storeModule.generateNew();
};

const handlePatch = async (item: Adapted<Minifig>) => {
    await item.patch({
        displayName: item.mutable.value.displayName,
        partCount: item.mutable.value.partCount,
        themeGroup: item.mutable.value.themeGroup,
    });
    lastAction.value = `Patched minifig #${item.id}`;
};

const handleReset = (item: Adapted<Minifig>) => {
    item.reset();
    lastAction.value = `Reset minifig #${item.id} to saved state`;
};

const handleDelete = async (item: Adapted<Minifig>) => {
    const deletedId = item.id;
    await item.delete();
    lastAction.value = `Deleted minifig #${deletedId}`;
    selectedId.value = null;
};

const clearStorage = () => {
    mockStorageData.value = {};
    lastAction.value = 'Cleared localStorage mock';
};

const storageJson = computed(() => JSON.stringify(mockStorageData.value, null, 2));
const storeCount = computed(() => storeModule.getAll.value.length);

const resetNewForm = () => {
    newAdapted.value.reset();
    lastAction.value = 'Reset new minifig form';
};

watch(
    () => storeModule.getAll.value,
    (all) => {
        if (selectedId.value !== null) {
            const exists = all.find((item) => item.id === selectedId.value);
            if (!exists) {
                selectedId.value = null;
            }
        }
    },
);
</script>

<template>
    <section p="y-20" id="resource-adapter-playground">
        <SectionHeading number="12" title="Resource Adapter Playground" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            Interactive demonstration of the
            <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">resourceAdapter</code>
            and
            <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">createAdapterStoreModule</code>
            patterns. Create, edit, persist, and reset resources in real-time with a mock HTTP service.
        </p>

        <!-- Status Bar -->
        <div
            v-if="lastAction"
            m="b-8"
            p="3"
            bg="[#237841]"
            text="white sm"
            font="bold"
            class="brick-border"
            data-testid="last-action"
        >
            {{ lastAction }}
        </div>

        <div grid="~ cols-1 lg:cols-2" gap="8" m="b-12">
            <!-- Create Panel -->
            <div>
                <p class="brick-label" m="b-4">Generate New (Creation Form)</p>
                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-4">
                        storeModule.generateNew() &rarr; NewAdapted&lt;Minifig&gt;
                    </p>

                    <div flex="~ col" gap="4" m="b-4">
                        <TextInput
                            v-model="newAdapted.mutable.value.displayName"
                            label="Display Name"
                            placeholder="e.g. Police Officer"
                        />
                        <NumberInput
                            v-model="newAdapted.mutable.value.partCount"
                            label="Part Count"
                            :min="1"
                            placeholder="e.g. 4"
                        />
                        <TextInput
                            v-model="newAdapted.mutable.value.themeGroup"
                            label="Theme Group"
                            placeholder="e.g. City"
                        />
                    </div>

                    <div flex="~ wrap" gap="3">
                        <PrimaryButton data-testid="create-btn" @click="handleCreate">Create</PrimaryButton>
                        <DangerButton data-testid="reset-new-btn" @click="resetNewForm">Reset Form</DangerButton>
                    </div>
                </div>
            </div>

            <!-- Case Conversion Panel -->
            <div>
                <p class="brick-label" m="b-4">Case Conversion (Live)</p>
                <div p="6" class="brick-border" bg="gray-900" text="gray-100">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">camelCase (app state)</p>
                    <pre
                        text="xs"
                        font="mono"
                        leading="relaxed"
                        overflow="x-auto"
                        m="b-4"
                        data-testid="camel-case-view"
                        >{{ JSON.stringify(newAdapted.mutable.value, null, 2) }}</pre
                    >
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">
                        snake_case (API payload via deepSnakeKeys)
                    </p>
                    <pre text="xs" font="mono" leading="relaxed" overflow="x-auto" data-testid="snake-case-view">{{
                        JSON.stringify(newSnakeSnapshot, null, 2)
                    }}</pre>
                </div>
            </div>
        </div>

        <!-- Store Contents -->
        <div m="b-12">
            <p class="brick-label" m="b-4">
                Adapter Store ({{ storeCount }} {{ storeCount === 1 ? 'item' : 'items' }})
            </p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="xs" font="mono" text-color="gray-500" m="b-4">
                    storeModule.getAll &rarr; ComputedRef&lt;Adapted&lt;Minifig&gt;[]&gt;
                </p>

                <div v-if="storeCount === 0" text="sm gray-500" p="y-4" text-align="center">
                    No minifigs in store. Create one above.
                </div>

                <div v-else grid="~ cols-1 md:cols-2 lg:cols-3" gap="4">
                    <button
                        v-for="item in storeModule.getAll.value"
                        :key="item.id"
                        p="4"
                        class="brick-border brick-transition"
                        :class="selectedId === item.id ? 'brick-shadow-hover' : 'brick-shadow'"
                        :bg="selectedId === item.id ? 'brick-yellow' : 'white'"
                        text="left"
                        cursor="pointer"
                        w="full"
                        @click="selectedId = item.id"
                    >
                        <p font="bold" text="sm">{{ item.displayName || '(unnamed)' }}</p>
                        <p text="xs gray-600">
                            #{{ item.id }} &middot; {{ item.partCount }} parts &middot; {{ item.themeGroup }}
                        </p>
                    </button>
                </div>
            </div>
        </div>

        <!-- Edit Panel -->
        <div v-if="selectedItem" m="b-12">
            <p class="brick-label" m="b-4">Edit Resource #{{ selectedItem.id }}</p>
            <div grid="~ cols-1 lg:cols-2" gap="8">
                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-4">
                        adapted.mutable &rarr; Ref&lt;Writable&lt;Minifig&gt;&gt;
                    </p>

                    <div flex="~ col" gap="4" m="b-4">
                        <TextInput
                            v-model="selectedItem.mutable.value.displayName"
                            label="Display Name"
                            placeholder="e.g. Firefighter"
                        />
                        <NumberInput
                            v-model="selectedItem.mutable.value.partCount"
                            label="Part Count"
                            :min="1"
                            placeholder="e.g. 5"
                        />
                        <TextInput
                            v-model="selectedItem.mutable.value.themeGroup"
                            label="Theme Group"
                            placeholder="e.g. Space"
                        />
                    </div>

                    <div flex="~ wrap" gap="3">
                        <PrimaryButton data-testid="patch-btn" @click="handlePatch(selectedItem)">Patch</PrimaryButton>
                        <PrimaryButton data-testid="reset-btn" @click="handleReset(selectedItem)">Reset</PrimaryButton>
                        <DangerButton data-testid="delete-btn" @click="handleDelete(selectedItem)">Delete</DangerButton>
                    </div>
                </div>

                <!-- Selected item snake_case view -->
                <div p="6" class="brick-border" bg="gray-900" text="gray-100">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">Frozen (readonly from store)</p>
                    <pre text="xs" font="mono" leading="relaxed" overflow="x-auto" m="b-4" data-testid="frozen-view">{{
                        JSON.stringify(
                            {
                                id: selectedItem.id,
                                displayName: selectedItem.displayName,
                                partCount: selectedItem.partCount,
                                themeGroup: selectedItem.themeGroup,
                            },
                            null,
                            2,
                        )
                    }}</pre>
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">Mutable (editable copy)</p>
                    <pre text="xs" font="mono" leading="relaxed" overflow="x-auto" m="b-4" data-testid="mutable-view">{{
                        JSON.stringify(selectedItem.mutable.value, null, 2)
                    }}</pre>
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">snake_case (API payload)</p>
                    <pre text="xs" font="mono" leading="relaxed" overflow="x-auto" data-testid="selected-snake-view">{{
                        JSON.stringify(toSnakeSnapshot(selectedItem), null, 2)
                    }}</pre>
                </div>
            </div>
        </div>

        <!-- Storage Panel -->
        <div m="b-12">
            <p class="brick-label" m="b-4">localStorage Persistence</p>
            <div p="6" class="brick-border" bg="gray-900" text="gray-100">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">
                    storageService.get("minifigs") — mock in-memory
                </p>
                <pre
                    text="xs"
                    font="mono"
                    leading="relaxed"
                    overflow="x-auto"
                    m="b-4"
                    max-h="48"
                    data-testid="storage-json"
                    >{{ storageJson }}</pre
                >
                <DangerButton data-testid="clear-storage-btn" @click="clearStorage">Clear Storage</DangerButton>
            </div>
        </div>

        <!-- How It Works -->
        <div m="b-12">
            <p class="brick-label" m="b-4">How It Works</p>
            <div p="6" class="brick-border" bg="gray-50">
                <div grid="~ cols-1 md:cols-2" gap="6">
                    <div>
                        <p font="bold" text="sm" m="b-2">Resource Adapter</p>
                        <p text="sm" leading="relaxed" text-color="gray-700">
                            Wraps a resource with a frozen readonly view and a mutable
                            <code font="mono" text="xs" bg="gray-100" p="x-1">Ref</code>
                            copy. The
                            <code font="mono" text="xs" bg="gray-100" p="x-1">reset()</code>
                            method reverts the mutable state to the frozen original. CRUD methods (create, update,
                            patch, delete) route through the HTTP service with automatic snake_case conversion.
                        </p>
                    </div>
                    <div>
                        <p font="bold" text="sm" m="b-2">Adapter Store Module</p>
                        <p text="sm" leading="relaxed" text-color="gray-700">
                            Maintains a reactive dictionary of frozen resources, each wrapped by the adapter. Provides
                            <code font="mono" text="xs" bg="gray-100" p="x-1">getAll</code>,
                            <code font="mono" text="xs" bg="gray-100" p="x-1">getById(id)</code>, and
                            <code font="mono" text="xs" bg="gray-100" p="x-1">generateNew()</code>
                            for creating new items. Persists to localStorage and caches adapted instances.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
