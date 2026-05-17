<script setup lang="ts">
import registry from '@shared/generated/component-registry.json';
import {computed, ref} from 'vue';

import SectionHeading from './SectionHeading.vue';

type ApiSurfaceItem = {name: string; required?: boolean};

type ComponentEntry = {
    path: string;
    category: string | null;
    consumers: Record<string, Record<string, string[]>>;
    adoption: {apps: number; domains: number};
    apiSurface: {props: ApiSurfaceItem[]; emits: ApiSurfaceItem[]; slots: ApiSurfaceItem[]; models: ApiSurfaceItem[]};
    churn: {commits: number; linesChanged: number};
    dependencyDepth: number;
};

const components = registry.components as Record<string, ComponentEntry>;
const entries = computed(() =>
    Object.entries(components)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, entry]) => ({name, ...entry})),
);

const expanded = ref(new Set<string>());

const toggle = (name: string) => {
    const next = new Set(expanded.value);
    if (next.has(name)) {
        next.delete(name);
    } else {
        next.add(name);
    }
    expanded.value = next;
};

const totalApiSurface = (entry: ComponentEntry): number => {
    const {props, emits, slots, models} = entry.apiSurface;
    return props.length + emits.length + slots.length + models.length;
};

const consumerCount = (entry: ComponentEntry): number => {
    let count = 0;
    for (const app of Object.values(entry.consumers)) {
        for (const files of Object.values(app)) {
            count += files.length;
        }
    }
    return count;
};

const maxChurnCommits = computed(() => Math.max(...entries.value.map((c) => c.churn.commits)));

const maxApiSurface = computed(() => Math.max(...entries.value.map(totalApiSurface)));

const multiAppCount = computed(() => entries.value.filter((c) => c.adoption.apps > 1).length);

const compositeCount = computed(() => entries.value.filter((c) => c.dependencyDepth > 0).length);
</script>

<template>
    <section p="y-20" id="health">
        <SectionHeading number="08" title="Component Health" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            Live metrics from the component registry. Five signals that answer: who depends on this, is it truly shared,
            is it bloating, is it thrashed, and is the nesting justified?
        </p>

        <!-- Summary stats -->
        <div grid="~ cols-2 sm:cols-4" gap="4" m="b-12">
            <div p="4" class="brick-border brick-shadow" bg="white" text="center">
                <p font="heading bold" text="3xl">{{ registry.meta.componentCount }}</p>
                <p text="xs" font="bold" uppercase tracking="widest" m="t-1">Components</p>
            </div>
            <div p="4" class="brick-border brick-shadow" bg="white" text="center">
                <p font="heading bold" text="3xl">{{ multiAppCount }}</p>
                <p text="xs" font="bold" uppercase tracking="widest" m="t-1">Multi-App</p>
            </div>
            <div p="4" class="brick-border brick-shadow" bg="white" text="center">
                <p font="heading bold" text="3xl">{{ compositeCount }}</p>
                <p text="xs" font="bold" uppercase tracking="widest" m="t-1">Composites</p>
            </div>
            <div p="4" class="brick-border brick-shadow" bg="white" text="center">
                <p font="heading bold" text="3xl">{{ registry.meta.churnWindowDays }}d</p>
                <p text="xs" font="bold" uppercase tracking="widest" m="t-1">Churn Window</p>
            </div>
        </div>

        <!-- Component list -->
        <div flex="~ col" gap="3">
            <div v-for="entry in entries" :key="entry.name" class="brick-border" bg="white" overflow="hidden">
                <!-- Row header -->
                <button
                    w="full"
                    p="4"
                    flex="~"
                    items="center"
                    gap="4"
                    bg="white hover:brick-yellow"
                    cursor="pointer"
                    border="none"
                    text="left black"
                    class="brick-transition"
                    :aria-expanded="expanded.has(entry.name)"
                    @click="toggle(entry.name)"
                >
                    <!-- Expand indicator -->
                    <span
                        font="mono bold"
                        text="sm"
                        w="6"
                        text-align="center"
                        flex="shrink-0"
                        transition="transform"
                        duration="150"
                        :class="expanded.has(entry.name) ? 'rotate-90' : ''"
                    >
                        &rsaquo;
                    </span>

                    <!-- Name -->
                    <span font="mono bold" text="sm" min-w="0" truncate flex="1">{{ entry.name }}</span>

                    <!-- Metric badges -->
                    <div flex="~ wrap shrink-0" gap="2" items="center" justify="end">
                        <!-- Adoption -->
                        <span
                            text="xs"
                            font="mono bold"
                            p="x-2 y-0.5"
                            class="brick-border"
                            :bg="entry.adoption.apps > 1 ? '[#F5C518]' : 'gray-100'"
                            :title="`${entry.adoption.apps} app(s), ${entry.adoption.domains} domain(s)`"
                        >
                            {{ entry.adoption.apps }}A / {{ entry.adoption.domains }}D
                        </span>

                        <!-- API surface -->
                        <span
                            text="xs"
                            font="mono bold"
                            p="x-2 y-0.5"
                            class="brick-border"
                            :bg="totalApiSurface(entry) >= maxApiSurface ? '[#F8D0CF]' : 'gray-100'"
                            :title="`${totalApiSurface(entry)} total API surface`"
                        >
                            {{ totalApiSurface(entry) }} API
                        </span>

                        <!-- Churn -->
                        <span
                            text="xs"
                            font="mono bold"
                            p="x-2 y-0.5"
                            class="brick-border"
                            :bg="
                                entry.churn.commits >= maxChurnCommits && maxChurnCommits > 1 ? '[#F8D0CF]' : 'gray-100'
                            "
                            :title="`${entry.churn.commits} commits, ${entry.churn.linesChanged} lines changed`"
                        >
                            {{ entry.churn.commits }}c / {{ entry.churn.linesChanged }}L
                        </span>

                        <!-- Depth -->
                        <span
                            v-if="entry.dependencyDepth > 0"
                            text="xs"
                            font="mono bold"
                            p="x-2 y-0.5"
                            class="brick-border"
                            bg="gray-100"
                            :title="`Dependency depth: ${entry.dependencyDepth}`"
                        >
                            d{{ entry.dependencyDepth }}
                        </span>
                    </div>
                </button>

                <!-- Expanded detail -->
                <div v-if="expanded.has(entry.name)" border="t-3 black" p="4" bg="gray-50">
                    <div grid="~ cols-1 md:cols-2" gap="6">
                        <!-- API Surface -->
                        <div>
                            <p class="brick-label" m="b-3">API Surface</p>
                            <div flex="~ col" gap="2">
                                <div v-if="entry.apiSurface.props.length" flex="~" gap="2" items="start">
                                    <span text="xs" font="bold mono" w="16" flex="shrink-0">Props</span>
                                    <div flex="~ wrap" gap="1">
                                        <span
                                            v-for="prop in entry.apiSurface.props"
                                            :key="prop.name"
                                            text="xs"
                                            font="mono"
                                            p="x-1.5 y-0.5"
                                            class="brick-border"
                                            :bg="prop.required ? '[#F5C518]' : 'white'"
                                        >
                                            {{ prop.name }}{{ prop.required ? '*' : '' }}
                                        </span>
                                    </div>
                                </div>
                                <div v-if="entry.apiSurface.emits.length" flex="~" gap="2" items="start">
                                    <span text="xs" font="bold mono" w="16" flex="shrink-0">Emits</span>
                                    <div flex="~ wrap" gap="1">
                                        <span
                                            v-for="emit in entry.apiSurface.emits"
                                            :key="emit.name"
                                            text="xs"
                                            font="mono"
                                            p="x-1.5 y-0.5"
                                            class="brick-border"
                                            bg="white"
                                        >
                                            {{ emit.name }}
                                        </span>
                                    </div>
                                </div>
                                <div v-if="entry.apiSurface.slots.length" flex="~" gap="2" items="start">
                                    <span text="xs" font="bold mono" w="16" flex="shrink-0">Slots</span>
                                    <div flex="~ wrap" gap="1">
                                        <span
                                            v-for="slot in entry.apiSurface.slots"
                                            :key="slot.name"
                                            text="xs"
                                            font="mono"
                                            p="x-1.5 y-0.5"
                                            class="brick-border"
                                            bg="white"
                                        >
                                            {{ slot.name }}
                                        </span>
                                    </div>
                                </div>
                                <div v-if="entry.apiSurface.models.length" flex="~" gap="2" items="start">
                                    <span text="xs" font="bold mono" w="16" flex="shrink-0">Models</span>
                                    <div flex="~ wrap" gap="1">
                                        <span
                                            v-for="model in entry.apiSurface.models"
                                            :key="model.name"
                                            text="xs"
                                            font="mono"
                                            p="x-1.5 y-0.5"
                                            class="brick-border"
                                            :bg="model.required ? '[#F5C518]' : 'white'"
                                        >
                                            {{ model.name }}{{ model.required ? '*' : '' }}
                                        </span>
                                    </div>
                                </div>
                                <p v-if="totalApiSurface(entry) === 0" text="xs gray-500" font="mono italic">
                                    No props, emits, slots, or models
                                </p>
                            </div>
                        </div>

                        <!-- Consumer Map -->
                        <div>
                            <p class="brick-label" m="b-3">
                                Consumer Map
                                <span font="normal" text="gray-500">({{ consumerCount(entry) }} files)</span>
                            </p>
                            <div flex="~ col" gap="3">
                                <div
                                    v-for="(domains, app) in entry.consumers"
                                    :key="app"
                                    p="3"
                                    class="brick-border"
                                    bg="white"
                                >
                                    <p text="xs" font="bold mono" uppercase m="b-2">{{ app }}</p>
                                    <div v-for="(files, domain) in domains" :key="domain" m="b-1 last:b-0">
                                        <p text="xs" font="mono" text-color="gray-500" m="b-1">
                                            {{ domain === '_root' ? '(root)' : domain }}
                                        </p>
                                        <p
                                            v-for="file in files"
                                            :key="file"
                                            text="xs"
                                            font="mono"
                                            text-color="gray-700"
                                            truncate
                                            :title="file"
                                        >
                                            {{ file.split('/').pop() }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Churn + Depth footer -->
                    <div m="t-4" p="t-4" border="t-2 gray-200" flex="~ wrap" gap="6">
                        <div>
                            <span text="xs" font="bold" uppercase tracking="widest">Churn</span>
                            <span text="xs" font="mono" m="l-2">
                                {{ entry.churn.commits }} commits &middot; {{ entry.churn.linesChanged }} lines changed
                            </span>
                        </div>
                        <div>
                            <span text="xs" font="bold" uppercase tracking="widest">Depth</span>
                            <span text="xs" font="mono" m="l-2">{{ entry.dependencyDepth }}</span>
                        </div>
                        <div>
                            <span text="xs" font="bold" uppercase tracking="widest">Path</span>
                            <span text="xs" font="mono" m="l-2">{{ entry.path }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
