<script setup lang="ts">
import NavLink from '@shared/components/NavLink.vue';

import {AdminRouterView, adminRouterService} from './router';
</script>

<template>
    <header p="4" border="b-3 black" bg="white">
        <nav flex gap="4" items="center">
            <span font="bold" text="lg">Admin</span>
            <NavLink to="/" @click="adminRouterService.goToRoute('home')">Dashboard</NavLink>
        </nav>
    </header>

    <main p="4">
        <AdminRouterView />
    </main>
</template>
