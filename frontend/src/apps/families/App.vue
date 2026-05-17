<script setup lang="ts">
import {
    FamilyRouterLink,
    FamilyRouterView,
    familyAuthService,
    familyRouterService,
    familyToastService,
    familyTranslationService,
} from '@app/services';
import {PhSignOut} from '@phosphor-icons/vue';
import NavHeader from '@shared/components/NavHeader.vue';
import NavMobileLink from '@shared/components/NavMobileLink.vue';
import PageTransition from '@shared/components/PageTransition.vue';
import {computed} from 'vue';

const {t} = familyTranslationService;
const currentRouteName = computed(() => familyRouterService.currentRouteRef.value.name);

const handleLogout = async () => {
    await familyAuthService.logout();
    await familyRouterService.goToRoute('login');
};
</script>

<template>
    <NavHeader>
        <template #links>
            <FamilyRouterLink :to="{name: 'home'}">{{ t('navigation.home').value }}</FamilyRouterLink>
            <FamilyRouterLink :to="{name: 'about'}">{{ t('navigation.about').value }}</FamilyRouterLink>
            <FamilyRouterLink v-show="familyAuthService.isLoggedIn.value" :to="{name: 'sets'}">
                {{ t('navigation.sets').value }}
            </FamilyRouterLink>
            <FamilyRouterLink v-show="familyAuthService.isLoggedIn.value" :to="{name: 'storage'}">
                {{ t('navigation.storage').value }}
            </FamilyRouterLink>
            <FamilyRouterLink v-show="familyAuthService.isLoggedIn.value" :to="{name: 'parts'}">
                {{ t('navigation.parts').value }}
            </FamilyRouterLink>
            <FamilyRouterLink v-show="familyAuthService.isLoggedIn.value" :to="{name: 'brick-dna'}">
                {{ t('navigation.brickDna').value }}
            </FamilyRouterLink>
            <FamilyRouterLink v-show="familyAuthService.isLoggedIn.value" :to="{name: 'settings'}">
                {{ t('navigation.settings').value }}
            </FamilyRouterLink>
            <FamilyRouterLink v-show="!familyAuthService.isLoggedIn.value" :to="{name: 'login'}">
                {{ t('auth.logIn').value }}
            </FamilyRouterLink>
            <FamilyRouterLink v-show="!familyAuthService.isLoggedIn.value" :to="{name: 'register'}">
                {{ t('auth.register').value }}
            </FamilyRouterLink>
        </template>

        <template #mobile-links>
            <NavMobileLink to="/" :active="currentRouteName === 'home'" @click="familyRouterService.goToRoute('home')">
                {{ t('navigation.home').value }}
            </NavMobileLink>
            <NavMobileLink
                to="/about"
                :active="currentRouteName === 'about'"
                @click="familyRouterService.goToRoute('about')"
            >
                {{ t('navigation.about').value }}
            </NavMobileLink>
            <NavMobileLink
                v-show="familyAuthService.isLoggedIn.value"
                to="/sets"
                :active="currentRouteName === 'sets'"
                @click="familyRouterService.goToRoute('sets')"
            >
                {{ t('navigation.sets').value }}
            </NavMobileLink>
            <NavMobileLink
                v-show="familyAuthService.isLoggedIn.value"
                to="/storage"
                :active="currentRouteName === 'storage'"
                @click="familyRouterService.goToRoute('storage')"
            >
                {{ t('navigation.storage').value }}
            </NavMobileLink>
            <NavMobileLink
                v-show="familyAuthService.isLoggedIn.value"
                to="/parts"
                :active="currentRouteName === 'parts'"
                @click="familyRouterService.goToRoute('parts')"
            >
                {{ t('navigation.parts').value }}
            </NavMobileLink>
            <NavMobileLink
                v-show="familyAuthService.isLoggedIn.value"
                to="/brick-dna"
                :active="currentRouteName === 'brick-dna'"
                @click="familyRouterService.goToRoute('brick-dna')"
            >
                {{ t('navigation.brickDna').value }}
            </NavMobileLink>
            <NavMobileLink
                v-show="familyAuthService.isLoggedIn.value"
                to="/settings"
                :active="currentRouteName === 'settings'"
                @click="familyRouterService.goToRoute('settings')"
            >
                {{ t('navigation.settings').value }}
            </NavMobileLink>
            <NavMobileLink
                v-show="!familyAuthService.isLoggedIn.value"
                to="/login"
                :active="currentRouteName === 'login'"
                @click="familyRouterService.goToRoute('login')"
            >
                {{ t('auth.logIn').value }}
            </NavMobileLink>
            <NavMobileLink
                v-show="!familyAuthService.isLoggedIn.value"
                to="/register"
                :active="currentRouteName === 'register'"
                @click="familyRouterService.goToRoute('register')"
            >
                {{ t('auth.register').value }}
            </NavMobileLink>
        </template>

        <template #actions>
            <button
                v-if="familyAuthService.isLoggedIn.value"
                @click="handleLogout"
                flex
                items="center"
                gap="2"
                p="x-4 y-2"
                bg="[var(--brick-card-bg)] hover:brick-yellow focus:brick-yellow"
                font="bold"
                uppercase
                tracking="wide"
                cursor="pointer"
                outline="none"
                focus-visible:brick-focus
                class="brick-border brick-shadow brick-transition hover:brick-shadow-hover focus:brick-shadow-hover active:brick-shadow-active active:translate-x-[2px] active:translate-y-[2px]"
            >
                <PhSignOut size="20" aria-hidden="true" />
                {{ t('auth.logout').value }}
            </button>
        </template>
    </NavHeader>

    <main p="4">
        <PageTransition :route-path="familyRouterService.currentRouteRef.value.path">
            <FamilyRouterView />
        </PageTransition>
    </main>

    <component :is="familyToastService.ToastContainerComponent" />
</template>
