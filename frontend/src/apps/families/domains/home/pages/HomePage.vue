<script setup lang="ts">
import type {FamilyStats} from '@app/types/familyStats';

import {
    familyAuthService,
    familyHttpService,
    familyRouterService,
    familySoundService,
    familyTranslationService,
} from '@app/services';
import {familySetStoreModule} from '@app/stores';
import CardContainer from '@shared/components/CardContainer.vue';
import LegoBrick from '@shared/components/LegoBrick.vue';
import NavLink from '@shared/components/NavLink.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import StatCard from '@shared/components/StatCard.vue';
import {useBrickPickup} from '@shared/composables/useBrickPickup';
import {computed, onMounted, ref} from 'vue';

import YearDistributionChart from '../components/YearDistributionChart.vue';

const {t} = familyTranslationService;

const stats = ref<FamilyStats | null>(null);
const loading = ref(true);
const setsLoading = ref(true);
const statsFailed = ref(false);
const setsFailed = ref(false);

const statusKeys: Record<
    string,
    'sets.sealed' | 'sets.built' | 'sets.inProgress' | 'sets.inStorage' | 'sets.incomplete' | 'sets.wishlist'
> = {
    sealed: 'sets.sealed',
    built: 'sets.built',
    in_progress: 'sets.inProgress',
    in_storage: 'sets.inStorage',
    incomplete: 'sets.incomplete',
    wishlist: 'sets.wishlist',
};

const yearDistribution = computed(() => {
    const map = new Map<number, number>();
    for (const adaptedSet of familySetStoreModule.getAll.value) {
        const year = adaptedSet.set?.year;
        if (year !== null && year !== undefined) {
            map.set(year, (map.get(year) ?? 0) + 1);
        }
    }
    return map;
});

onMounted(async () => {
    if (!familyAuthService.isLoggedIn.value) {
        return;
    }

    // allSettled, not all: the two calls are independent, so a failure in one must not
    // blank the other's section. Every settlement path clears its own loading flag —
    // under Promise.all a rejection skipped both clears and the dashboard hung on
    // "loading" forever with no error and no way out.
    const [statsResult, setsResult] = await Promise.allSettled([
        familyHttpService.getRequest<FamilyStats>('/family/stats'),
        familySetStoreModule.retrieveAll(),
    ]);

    if (statsResult.status === 'fulfilled') {
        stats.value = statsResult.value.data;
    } else {
        statsFailed.value = true;
    }
    loading.value = false;

    setsFailed.value = setsResult.status === 'rejected';
    setsLoading.value = false;
});

// Three pickup instances — one per stacked hero brick. The home page is the
// first-impression surface and the only place where the LegoBrick decorations
// are directly tactile. Subtle hover lift (6px) keeps the interaction quiet;
// the snap on press makes the firm feel responsive.
const heroPickupTop = useBrickPickup({
    soundService: familySoundService,
    hoverLift: 6,
    pressLift: 4,
    hoverDuration: 180,
    pressDuration: 100,
    releaseDuration: 320,
});
const heroPickupMid = useBrickPickup({
    soundService: familySoundService,
    hoverLift: 6,
    pressLift: 4,
    hoverDuration: 180,
    pressDuration: 100,
    releaseDuration: 320,
});
const heroPickupBot = useBrickPickup({
    soundService: familySoundService,
    hoverLift: 6,
    pressLift: 4,
    hoverDuration: 180,
    pressDuration: 100,
    releaseDuration: 320,
});

const goToSets = async () => await familyRouterService.goToRoute('sets');
const goToStorage = async () => await familyRouterService.goToRoute('storage');
const goToParts = async () => await familyRouterService.goToRoute('parts');
const goToScan = async () => await familyRouterService.goToRoute('sets-scan');
const goToIdentify = async () => await familyRouterService.goToRoute('sets-identify');
const goToSettings = async () => await familyRouterService.goToRoute('settings');
</script>

<template>
    <div max-w="6xl" m="x-auto">
        <!-- Logged out: landing page -->
        <template v-if="!familyAuthService.isLoggedIn.value">
            <div flex="~ col sm:row" items="center sm:start" gap="8 sm:12">
                <!-- Copy block -->
                <div flex="1 ~ col">
                    <h1 text="2xl" font="bold" uppercase tracking="wide" m="b-4">
                        {{ t('home.brandTitle').value }}
                    </h1>
                    <p text="[var(--brick-muted-text)]" m="b-2">{{ t('home.tagline').value }}</p>
                    <p text="[var(--brick-muted-text)]" m="b-6">{{ t('home.brandDescription').value }}</p>

                    <NavLink to="/register" @click="familyRouterService.goToRoute('register')">
                        {{ t('auth.createAccount').value }}
                    </NavLink>
                </div>

                <!-- Brick hero — three staggered LegoBricks with snap-and-pull pickup -->
                <div flex="~ col" items="end" gap="0" shrink="0" order="-1 sm:0">
                    <div
                        class="brick-anim-pickup"
                        :style="heroPickupTop.style.value"
                        @mouseenter="heroPickupTop.onEnter"
                        @mouseleave="heroPickupTop.onLeave"
                        @mousedown="heroPickupTop.onPress"
                        @mouseup="heroPickupTop.onRelease"
                    >
                        <LegoBrick :columns="4" :rows="2" color="#F5C518" />
                    </div>
                    <div
                        class="brick-anim-pickup"
                        m="t-[-4px] r-8"
                        :style="heroPickupMid.style.value"
                        @mouseenter="heroPickupMid.onEnter"
                        @mouseleave="heroPickupMid.onLeave"
                        @mousedown="heroPickupMid.onPress"
                        @mouseup="heroPickupMid.onRelease"
                    >
                        <LegoBrick :columns="2" :rows="2" color="#C41A16" />
                    </div>
                    <div
                        class="brick-anim-pickup"
                        m="t-[-4px] l-4"
                        :style="heroPickupBot.style.value"
                        @mouseenter="heroPickupBot.onEnter"
                        @mouseleave="heroPickupBot.onLeave"
                        @mousedown="heroPickupBot.onPress"
                        @mouseup="heroPickupBot.onRelease"
                    >
                        <LegoBrick :columns="3" :rows="1" color="#0055BF" />
                    </div>
                </div>
            </div>
        </template>

        <!-- Logged in: dashboard -->
        <template v-else>
            <PageHeader :title="t('home.dashboardTitle').value" />

            <p v-if="loading" text="[var(--brick-muted-text)]">{{ t('home.loadingStats').value }}</p>

            <p v-else-if="statsFailed" text="[var(--brick-danger-text)]" font="bold" m="b-6">
                {{ t('home.statsError').value }}
            </p>

            <template v-else-if="stats">
                <!-- Headline stats -->
                <div grid grid-cols="1 sm:2 lg:3" gap="4" m="b-6">
                    <StatCard :label="t('home.statSets').value" :value="String(stats.totalSets)">
                        <p v-if="stats.totalSetQuantity !== stats.totalSets" text="sm [var(--brick-muted-text)]">
                            {{ t('home.totalIncludingDuplicates', {count: String(stats.totalSetQuantity)}).value }}
                        </p>
                    </StatCard>

                    <StatCard
                        :label="t('home.statStorageLocations').value"
                        :value="String(stats.totalStorageLocations)"
                    />

                    <StatCard :label="t('home.statStoredParts').value" :value="String(stats.totalUniqueParts)">
                        <p v-if="stats.totalPartsQuantity > 0" text="sm [var(--brick-muted-text)]">
                            {{ t('home.totalPieces', {count: String(stats.totalPartsQuantity)}).value }}
                        </p>
                    </StatCard>
                </div>

                <!-- Sets by status -->
                <template v-if="Object.keys(stats.setsByStatus).length > 0">
                    <h2 text="lg" font="bold" uppercase tracking="wide" m="b-4">
                        {{ t('home.setsByStatus').value }}
                    </h2>
                    <div grid grid-cols="2 sm:4" gap="4" m="b-6">
                        <StatCard
                            v-for="(count, status) in stats.setsByStatus"
                            :key="status"
                            :label="statusKeys[status] ? t(statusKeys[status]).value : String(status)"
                            :value="String(count)"
                        />
                    </div>
                </template>
            </template>

            <!-- Year distribution — fed by the set store, independent of the stats call.
                 Kept outside the stats block so a stats failure does not blank a section
                 whose own data loaded fine. -->
            <template v-if="!setsLoading && !setsFailed && yearDistribution.size > 0">
                <h2 text="lg" font="bold" uppercase tracking="wide" m="b-4">
                    {{ t('home.yearDistribution').value }}
                </h2>
                <CardContainer m="b-6">
                    <YearDistributionChart :distribution="yearDistribution" />
                </CardContainer>
            </template>

            <p v-else-if="!setsLoading && setsFailed" text="[var(--brick-danger-text)]" font="bold" m="b-6">
                {{ t('home.setsError').value }}
            </p>

            <p v-else-if="!setsLoading && yearDistribution.size === 0" text="[var(--brick-muted-text)]" m="b-6">
                {{ t('home.yearDistributionEmpty').value }}
            </p>

            <!-- Quick actions — pure navigation, no data dependency. Always available so a
                 failed fetch never strands the user on a dead-end page. -->
            <h2 text="lg" font="bold" uppercase tracking="wide" m="b-4">
                {{ t('home.quickActions').value }}
            </h2>
            <div grid grid-cols="2 sm:3" gap="4">
                <NavLink to="/sets" @click="goToSets">{{ t('navigation.sets').value }}</NavLink>
                <NavLink to="/storage" @click="goToStorage">{{ t('navigation.storage').value }}</NavLink>
                <NavLink to="/parts" @click="goToParts">{{ t('navigation.parts').value }}</NavLink>
                <NavLink to="/sets/scan" @click="goToScan">{{ t('home.actionScan').value }}</NavLink>
                <NavLink to="/sets/identify" @click="goToIdentify">{{ t('home.actionIdentify').value }}</NavLink>
                <NavLink to="/settings" @click="goToSettings">{{ t('home.actionImport').value }}</NavLink>
            </div>
        </template>
    </div>
</template>
