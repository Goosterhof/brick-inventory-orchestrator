<script setup lang="ts">
import {PhList, PhX} from '@phosphor-icons/vue';
import {ref} from 'vue';

const menuOpen = ref(false);

const toggleMenu = () => {
    menuOpen.value = !menuOpen.value;
};

const closeMenu = () => {
    menuOpen.value = false;
};
</script>

<template>
    <header border="b-3 [var(--brick-border-color)]">
        <nav p="4" flex items="center" justify="between">
            <div hidden sm:flex gap="4" items="center">
                <slot name="links" />
            </div>

            <button
                sm:hidden
                @click="toggleMenu"
                w="11"
                h="11"
                flex
                items="center"
                justify="center"
                bg="[var(--brick-card-bg)] hover:brick-yellow focus:brick-yellow"
                :class="[
                    'brick-border brick-transition',
                    menuOpen
                        ? 'brick-shadow-active translate-x-[2px] translate-y-[2px]'
                        : 'brick-shadow hover:brick-shadow-hover focus:brick-shadow-hover active:brick-shadow-active active:translate-x-[2px] active:translate-y-[2px]',
                ]"
                cursor="pointer"
                outline="none"
                focus-visible:brick-focus
                :aria-expanded="menuOpen"
                aria-controls="mobile-menu"
                aria-label="Menu"
            >
                <PhX v-if="menuOpen" size="20" aria-hidden="true" />
                <PhList v-else size="20" aria-hidden="true" />
            </button>

            <div flex items="center" gap="4">
                <slot name="actions" />
            </div>
        </nav>

        <div
            id="mobile-menu"
            sm:hidden
            :class="menuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            class="grid transition-property-[grid-template-rows] transition-duration-150 transition-ease-[cubic-bezier(0.2,0,0,1)]"
        >
            <div overflow="hidden">
                <div border="t-3 [var(--brick-border-color)]" @click="closeMenu">
                    <slot name="mobile-links" />
                </div>
            </div>
        </div>
    </header>
</template>
