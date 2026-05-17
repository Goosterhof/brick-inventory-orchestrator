<script setup lang="ts">
import type {FamilyStats} from '@app/types/familyStats';

import {familyAuthService, familyHttpService, familyRouterService, familyTranslationService} from '@app/services';
import {familySetStoreModule} from '@app/stores';
import CardContainer from '@shared/components/CardContainer.vue';
import LegoBrick from '@shared/components/LegoBrick.vue';
import NavLink from '@shared/components/NavLink.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import StatCard from '@shared/components/StatCard.vue';
import {computed, onMounted, ref} from 'vue';

import YearDistributionChart from '../components/YearDistributionChart.vue';

const {t} = familyTranslationService;

const stats = ref<FamilyStats | null>(null);
const loading = ref(true);
const setsLoading = ref(true);

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

    const [response] = await Promise.all([
        familyHttpService.getRequest<FamilyStats>('/family/stats'),
        familySetStoreModule.retrieveAll(),
    ]);

    stats.value = response.data;
    loading.value = false;
    setsLoading.value = false;
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

                <!-- Brick hero — three staggered LegoBricks -->
                <div flex="~ col" items="end" gap="0" shrink="0" order="-1 sm:0">
                    <LegoBrick :columns="4" :rows="2" color="#F5C518" />
                    <LegoBrick :columns="2" :rows="2" color="#C41A16" m="t-[-4px] r-8" />
                    <LegoBrick :columns="3" :rows="1" color="#0055BF" m="t-[-4px] l-4" />
                </div>
            </div>
        </template>

        <!-- Logged in: dashboard -->
        <template v-else>
            <PageHeader :title="t('home.dashboardTitle').value" />

            <p v-if="loading" text="[var(--brick-muted-text)]">{{ t('home.loadingStats').value }}</p>

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

                <!-- Year distribution -->
                <template v-if="!setsLoading && yearDistribution.size > 0">
                    <h2 text="lg" font="bold" uppercase tracking="wide" m="b-4">
                        {{ t('home.yearDistribution').value }}
                    </h2>
                    <CardContainer m="b-6">
                        <YearDistributionChart :distribution="yearDistribution" />
                    </CardContainer>
                </template>

                <p v-else-if="!setsLoading && yearDistribution.size === 0" text="[var(--brick-muted-text)]" m="b-6">
                    {{ t('home.yearDistributionEmpty').value }}
                </p>

                <!-- Quick actions -->
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
        </template>
    </div>
</template>
