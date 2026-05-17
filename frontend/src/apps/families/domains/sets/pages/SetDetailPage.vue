<script setup lang="ts">
import type {PartIdentity} from '@app/modals/PlacePartModal.vue';
import type {FamilySet} from '@app/types/familySet';
import type {SetPart, SetWithParts, StorageMapEntry, StorageMapResponse} from '@app/types/part';
import type {Adapted} from '@script-development/fs-adapter-store';

import PlacePartModal from '@app/modals/PlacePartModal.vue';
import {familyHttpService, familyRouterService, familyTranslationService} from '@app/services';
import {familySetStoreModule} from '@app/stores';
import {EntryNotFoundError} from '@script-development/fs-adapter-store';
import BackButton from '@shared/components/BackButton.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import PartListItem from '@shared/components/PartListItem.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {computed, onMounted, ref} from 'vue';

const {t} = familyTranslationService;
const adapted = ref<Adapted<FamilySet> | null>(null);
const setWithParts = ref<SetWithParts | null>(null);
const storageMap = ref<StorageMapEntry[]>([]);
const loading = ref(true);
const partsLoading = ref(false);
const partsSyncing = ref(false);
const partsError = ref<string | null>(null);
const selectedPart = ref<SetPart | null>(null);
const showAssignModal = ref(false);

interface PartsSyncPending {
    setNum: string;
    status: 'pending' | 'in_progress';
    message: string;
}

// Discriminate the parts endpoint's two success shapes: the synced payload
// (full SetWithParts) versus the 202 polling envelope.
const isPartsSyncPending = (data: SetWithParts | PartsSyncPending): data is PartsSyncPending =>
    typeof (data as PartsSyncPending).status === 'string' &&
    ['pending', 'in_progress'].includes((data as PartsSyncPending).status);

const statusKey: Record<
    FamilySet['status'],
    'sets.sealed' | 'sets.built' | 'sets.inProgress' | 'sets.inStorage' | 'sets.incomplete' | 'sets.wishlist'
> = {
    sealed: 'sets.sealed',
    built: 'sets.built',
    in_progress: 'sets.inProgress',
    in_storage: 'sets.inStorage',
    incomplete: 'sets.incomplete',
    wishlist: 'sets.wishlist',
};

const storageByPartKey = computed(() => {
    const map = new Map<string, StorageMapEntry[]>();
    for (const entry of storageMap.value) {
        const key = `${entry.partId}_${entry.colorId}`;
        const existing = map.get(key) ?? [];
        existing.push(entry);
        map.set(key, existing);
    }
    return map;
});

const getStorageLocations = (setPart: SetPart): StorageMapEntry[] => {
    const key = `${setPart.part.id}_${setPart.color.id}`;
    return storageByPartKey.value.get(key) ?? [];
};

const getAvailableQuantity = (setPart: SetPart): number => {
    const locations = getStorageLocations(setPart);
    return locations.reduce((sum, loc) => sum + loc.quantity, 0);
};

const buildStats = computed(() => {
    if (!setWithParts.value || storageMap.value.length === 0) return null;
    if (adapted.value?.status === 'wishlist') return null;

    const regularParts = setWithParts.value.parts.filter((p) => !p.isSpare);
    let partsComplete = 0;
    let totalNeeded = 0;
    let totalAvailable = 0;

    for (const part of regularParts) {
        const available = getAvailableQuantity(part);
        totalNeeded += part.quantity;
        totalAvailable += Math.min(available, part.quantity);
        if (available >= part.quantity) {
            partsComplete++;
        }
    }

    return {
        uniquePartsTotal: regularParts.length,
        uniquePartsComplete: partsComplete,
        totalNeeded,
        totalAvailable,
        canBuild: partsComplete === regularParts.length,
    };
});

const missingParts = computed(() => {
    if (!buildStats.value || buildStats.value.canBuild) return [];
    if (!setWithParts.value) return [];

    return setWithParts.value.parts
        .filter((p) => !p.isSpare)
        .filter((p) => getAvailableQuantity(p) < p.quantity)
        .map((p) => ({...p, available: getAvailableQuantity(p), missing: p.quantity - getAvailableQuantity(p)}));
});

const showMissingParts = ref(false);

const brickLinkUrl = (partNum: string): string =>
    `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${encodeURIComponent(partNum)}`;

const SYNC_POLL_INTERVAL_MS = 2000;
const SYNC_POLL_MAX_ATTEMPTS = 15;

const loadParts = async (setNum: string) => {
    partsLoading.value = true;
    partsSyncing.value = false;
    partsError.value = null;

    // Backend returns the full SetWithParts payload (HTTP 200) when parts are
    // already synced, a pending envelope (HTTP 202) while a sync job is still
    // running, and 5xx on a hard failure. Discriminate on payload shape
    // (a `status` of 'pending'/'in_progress' vs. the SetWithParts shape) so
    // the polling loop survives mock/test environments that don't surface
    // the underlying HTTP status code.
    for (let attempt = 1; attempt <= SYNC_POLL_MAX_ATTEMPTS; attempt++) {
        try {
            const response = await familyHttpService.getRequest<SetWithParts | PartsSyncPending>(
                `/sets/${setNum}/parts`,
            );

            if (isPartsSyncPending(response.data)) {
                partsSyncing.value = true;
                if (attempt === SYNC_POLL_MAX_ATTEMPTS) {
                    partsError.value = t('sets.syncTimeout').value;
                    partsSyncing.value = false;
                    partsLoading.value = false;
                    return;
                }
                await new Promise((resolve) => setTimeout(resolve, SYNC_POLL_INTERVAL_MS));
                continue;
            }

            setWithParts.value = response.data;
            break;
        } catch {
            partsError.value = t('sets.syncFailed').value;
            partsSyncing.value = false;
            partsLoading.value = false;
            return;
        }
    }

    try {
        const mapResponse = await familyHttpService.getRequest<StorageMapResponse>(`/sets/${setNum}/storage-map`);
        storageMap.value = mapResponse.data.entries;
    } catch {
        storageMap.value = [];
    }

    partsSyncing.value = false;
    partsLoading.value = false;
};

onMounted(async () => {
    const id = familyRouterService.currentRouteId.value;
    // Direct navigation (refresh, deep link, e2e test) lands here without the overview having
    // hydrated the store. Fall back to retrieveAll so getOrFailById has the item to return.
    try {
        adapted.value = await familySetStoreModule.getOrFailById(id);
    } catch (error) {
        if (!(error instanceof EntryNotFoundError)) throw error;
        await familySetStoreModule.retrieveAll();
        adapted.value = await familySetStoreModule.getOrFailById(id);
    }
    loading.value = false;
});

const ownedStatuses: FamilySet['status'][] = ['sealed', 'in_progress', 'built', 'in_storage', 'incomplete'];
const statusUpdating = ref(false);

const updateStatus = async (newStatus: FamilySet['status']) => {
    if (!adapted.value || adapted.value.status === newStatus) return;

    statusUpdating.value = true;
    try {
        await adapted.value.patch({status: newStatus});
    } finally {
        statusUpdating.value = false;
    }
};

const goToEdit = async () => {
    if (!adapted.value) return;
    await familyRouterService.goToRoute('sets-edit', adapted.value.id);
};

const goBack = async () => {
    await familyRouterService.goToRoute('sets');
};

const openAssignModal = (part: SetPart) => {
    selectedPart.value = part;
    showAssignModal.value = true;
};

const closeAssignModal = () => {
    showAssignModal.value = false;
    selectedPart.value = null;
};

const handleAssigned = () => {
    showAssignModal.value = false;
    selectedPart.value = null;
    if (adapted.value) {
        loadParts(adapted.value.set?.setNum ?? adapted.value.setNum);
    }
};

const toPartIdentity = (part: SetPart): PartIdentity => ({
    partId: part.part.id,
    partNum: part.part.partNum,
    partName: part.part.name,
    colorId: part.color.id,
    colorName: part.color.name,
    colorHex: part.color.rgb,
    partImageUrl: part.part.imageUrl,
});
</script>

<template>
    <div max-w="6xl" m="x-auto">
        <LoadingState v-if="loading" :message="t('common.loading').value" />

        <template v-else-if="adapted">
            <div m="b-6">
                <BackButton @click="goBack">&larr; {{ t('sets.backToOverview').value }}</BackButton>
            </div>

            <div flex="~ col md:row" gap="6">
                <div shrink="0">
                    <img
                        v-if="adapted.set?.imageUrl"
                        :src="adapted.set.imageUrl"
                        :alt="adapted.set.name"
                        w="48"
                        h="48"
                        object="contain"
                    />
                    <div
                        v-else
                        w="48"
                        h="48"
                        bg="[var(--brick-surface-subtle)]"
                        flex
                        items="center"
                        justify="center"
                        text="[var(--brick-muted-text)]"
                    >
                        {{ t('common.noImage').value }}
                    </div>
                </div>

                <div flex="1 ~ col" gap="3">
                    <h1 text="2xl" font="bold" uppercase tracking="wide">
                        {{ adapted.set?.name ?? adapted.setNum }}
                    </h1>
                    <p text="[var(--brick-muted-text)]">{{ adapted.set?.setNum ?? adapted.setNum }}</p>

                    <div flex="~ col" gap="2" m="t-2">
                        <div flex gap="2">
                            <span font="bold">{{ t('sets.year').value }}:</span>
                            <span>{{ adapted.set?.year ?? t('sets.unknown').value }}</span>
                        </div>
                        <div flex gap="2">
                            <span font="bold">{{ t('sets.theme').value }}:</span>
                            <span>{{ adapted.set?.theme ?? t('sets.unknown').value }}</span>
                        </div>
                        <div flex gap="2">
                            <span font="bold">{{ t('sets.numParts').value }}:</span>
                            <span>{{ adapted.set?.numParts ?? t('sets.unknown').value }}</span>
                        </div>
                        <div flex gap="2">
                            <span font="bold">{{ t('sets.quantity').value }}:</span>
                            <span>{{ adapted.quantity }}x</span>
                        </div>
                        <div v-if="adapted.status !== 'wishlist'" flex="~ col" gap="2">
                            <span font="bold">{{ t('sets.status').value }}:</span>
                            <div flex gap="2" flex-wrap="wrap">
                                <button
                                    v-for="status in ownedStatuses"
                                    :key="status"
                                    type="button"
                                    text="xs"
                                    p="x-3 y-1"
                                    font="bold"
                                    uppercase
                                    tracking="wide"
                                    cursor="pointer"
                                    outline="none"
                                    focus-visible:brick-focus
                                    class="brick-border brick-transition"
                                    :bg="
                                        adapted.status === status
                                            ? 'yellow-300'
                                            : '[var(--brick-card-bg)] hover:yellow-100'
                                    "
                                    :disabled="statusUpdating"
                                    @click="updateStatus(status)"
                                >
                                    {{ t(statusKey[status]).value }}
                                </button>
                            </div>
                        </div>
                        <div v-if="adapted.status === 'wishlist'">
                            <PrimaryButton :disabled="statusUpdating" @click="updateStatus('sealed')">
                                {{ t('sets.addToCollection').value }}
                            </PrimaryButton>
                        </div>
                        <div v-if="adapted.purchaseDate" flex gap="2">
                            <span font="bold">{{ t('sets.purchaseDate').value }}:</span>
                            <span>{{ adapted.purchaseDate }}</span>
                        </div>
                        <div v-if="adapted.notes" flex gap="2">
                            <span font="bold">{{ t('sets.notes').value }}:</span>
                            <span>{{ adapted.notes }}</span>
                        </div>
                    </div>

                    <div flex gap="4" m="t-4">
                        <PrimaryButton @click="goToEdit">{{ t('sets.edit').value }}</PrimaryButton>
                        <PrimaryButton
                            v-if="!setWithParts && adapted.status !== 'wishlist'"
                            :disabled="partsLoading"
                            @click="loadParts(adapted.set?.setNum ?? adapted.setNum)"
                        >
                            {{ t('sets.loadParts').value }}
                        </PrimaryButton>
                    </div>
                </div>
            </div>

            <div v-if="partsLoading" m="t-8">
                <LoadingState :message="partsSyncing ? t('sets.syncingParts').value : t('sets.loadingParts').value" />
            </div>

            <div
                v-else-if="partsError"
                m="t-8"
                p="4"
                bg="brick-red-light"
                class="brick-border brick-shadow"
                data-testid="parts-error"
            >
                <p font="bold">{{ partsError }}</p>
            </div>

            <div v-else-if="setWithParts" m="t-8">
                <div
                    v-if="buildStats"
                    p="4"
                    m="b-6"
                    class="brick-border brick-shadow"
                    :bg="buildStats.canBuild ? 'baseplate-green/15' : '[var(--brick-card-bg)]'"
                >
                    <h2 text="xl" font="bold" uppercase tracking="wide" m="b-3">
                        {{ t('sets.buildCheck').value }}
                    </h2>
                    <p
                        font="bold"
                        text="lg"
                        :class="buildStats.canBuild ? 'text-baseplate-green' : 'text-[var(--brick-danger-text)]'"
                    >
                        {{ buildStats.canBuild ? t('sets.readyToBuild').value : t('sets.notReadyToBuild').value }}
                    </p>
                    <div flex gap="6" m="t-2" text="sm">
                        <span>
                            {{ t('sets.uniqueParts').value }}: {{ buildStats.uniquePartsComplete }}/{{
                                buildStats.uniquePartsTotal
                            }}
                        </span>
                        <span>
                            {{ t('sets.totalPieces').value }}: {{ buildStats.totalAvailable }}/{{
                                buildStats.totalNeeded
                            }}
                        </span>
                    </div>

                    <div v-if="missingParts.length > 0" m="t-4">
                        <button
                            type="button"
                            text="sm"
                            font="bold"
                            uppercase
                            tracking="wide"
                            cursor="pointer"
                            bg="transparent"
                            p="0"
                            outline="none"
                            focus-visible:brick-focus
                            class="brick-transition"
                            @click="showMissingParts = !showMissingParts"
                        >
                            {{ showMissingParts ? '&#9662;' : '&#9656;' }}
                            {{ t('sets.missingBricks').value }} ({{ missingParts.length }})
                        </button>

                        <div v-if="showMissingParts" flex="~ col" gap="2" m="t-3">
                            <div
                                v-for="part in missingParts"
                                :key="part.id"
                                flex
                                items="center"
                                gap="3"
                                p="3"
                                bg="brick-red-light"
                                class="brick-border"
                            >
                                <img
                                    v-if="part.part.imageUrl"
                                    :src="part.part.imageUrl"
                                    :alt="part.part.name"
                                    w="10"
                                    h="10"
                                    object="contain"
                                />
                                <div flex="1">
                                    <p font="bold" text="sm">{{ part.part.name }}</p>
                                    <p text="xs [var(--brick-muted-text)]">
                                        {{ part.part.partNum }} · {{ part.color.name }}
                                    </p>
                                </div>
                                <div text="sm" font="bold" text-color="[var(--brick-danger-text)]">
                                    {{ part.available }}/{{ part.quantity }}
                                </div>
                                <a
                                    :href="brickLinkUrl(part.part.partNum)"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    text="xs"
                                    p="x-2 y-1"
                                    font="bold"
                                    uppercase
                                    tracking="wide"
                                    class="brick-border brick-transition"
                                    bg="[var(--brick-card-bg)] hover:brick-yellow"
                                >
                                    BrickLink
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 text="xl" font="bold" uppercase tracking="wide" m="b-4">
                    {{ t('sets.parts').value }} ({{ setWithParts.parts.filter((p) => !p.isSpare).length }})
                </h2>

                <div flex="~ col" gap="2">
                    <button
                        v-for="setPart in setWithParts.parts.filter((p) => !p.isSpare)"
                        :key="setPart.id"
                        type="button"
                        w="full"
                        text="left"
                        bg="transparent"
                        p="0"
                        cursor="pointer"
                        outline="none"
                        focus-visible:brick-focus
                        @click="openAssignModal(setPart)"
                    >
                        <PartListItem
                            :name="setPart.part.name"
                            :part-num="setPart.part.partNum"
                            :quantity="setPart.quantity"
                            :image-url="setPart.part.imageUrl"
                            :color-name="setPart.color.name"
                            :color-rgb="setPart.color.rgb"
                        >
                            <div v-if="storageMap.length > 0" flex gap="1" m="t-1" flex-wrap="wrap" items="center">
                                <span
                                    v-for="loc in getStorageLocations(setPart)"
                                    :key="loc.storageOptionId"
                                    text="xs"
                                    p="x-2 y-0.5"
                                    bg="brick-yellow"
                                    font="bold"
                                    class="brick-border"
                                    border="1"
                                >
                                    {{ loc.storageOptionName }} ({{ loc.quantity }}x)
                                </span>
                                <span
                                    text="xs"
                                    p="x-2 y-0.5"
                                    font="bold"
                                    class="brick-border"
                                    border="1"
                                    :bg="
                                        getAvailableQuantity(setPart) >= setPart.quantity
                                            ? 'baseplate-green/25'
                                            : 'brick-red-light'
                                    "
                                >
                                    {{ getAvailableQuantity(setPart) }}/{{ setPart.quantity }}
                                </span>
                            </div>
                        </PartListItem>
                    </button>
                </div>

                <div v-if="setWithParts.parts.filter((p) => p.isSpare).length > 0" m="t-6">
                    <h2 text="xl" font="bold" uppercase tracking="wide" m="b-4">
                        {{ t('sets.spareParts').value }} ({{ setWithParts.parts.filter((p) => p.isSpare).length }})
                    </h2>

                    <div flex="~ col" gap="2">
                        <button
                            v-for="setPart in setWithParts.parts.filter((p) => p.isSpare)"
                            :key="setPart.id"
                            type="button"
                            w="full"
                            text="left"
                            bg="transparent"
                            p="0"
                            cursor="pointer"
                            outline="none"
                            focus-visible:brick-focus
                            @click="openAssignModal(setPart)"
                        >
                            <PartListItem
                                :name="setPart.part.name"
                                :part-num="setPart.part.partNum"
                                :quantity="setPart.quantity"
                                :color-name="setPart.color.name"
                                :color-rgb="setPart.color.rgb"
                                spare
                            >
                                <div
                                    v-if="getStorageLocations(setPart).length > 0"
                                    flex
                                    gap="1"
                                    m="t-1"
                                    flex-wrap="wrap"
                                >
                                    <span
                                        v-for="loc in getStorageLocations(setPart)"
                                        :key="loc.storageOptionId"
                                        text="xs"
                                        p="x-2 y-0.5"
                                        bg="brick-yellow"
                                        font="bold"
                                        class="brick-border"
                                        border="1"
                                    >
                                        {{ loc.storageOptionName }} ({{ loc.quantity }}x)
                                    </span>
                                </div>
                            </PartListItem>
                        </button>
                    </div>
                </div>
            </div>

            <PlacePartModal
                v-if="selectedPart"
                :open="showAssignModal"
                :part-identity="toPartIdentity(selectedPart)"
                :default-quantity="selectedPart.quantity"
                :existing-locations="getStorageLocations(selectedPart)"
                :title="t('sets.assignPartTitle').value"
                @close="closeAssignModal"
                @assigned="handleAssigned"
            />
        </template>
    </div>
</template>
