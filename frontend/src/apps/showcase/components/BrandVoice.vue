<script setup lang="ts">
import {PhCheckCircle, PhTrash, PhWarningCircle} from '@phosphor-icons/vue';

import SectionHeading from './SectionHeading.vue';
</script>

<template>
    <section p="y-20" id="voice">
        <SectionHeading number="06" title="Brand Voice Specimens" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            Microcopy is interface. Every message is a brick in the user's experience — placed with the same precision
            as a visual element.
        </p>

        <div flex="~ col" gap="8">
            <!-- Empty states -->
            <div>
                <p class="brick-label" m="b-6">Empty States</p>
                <div grid="~ cols-1 md:cols-2" gap="6">
                    <div p="8" class="brick-border" bg="gray-50" text="center">
                        <p text="gray-600" m="b-4">No sets in your inventory yet.</p>
                        <button
                            p="x-4 y-3"
                            bg="black"
                            text="white"
                            font="bold"
                            uppercase
                            tracking="wide"
                            cursor="default"
                            class="brick-border brick-shadow"
                        >
                            Add Your First Set
                        </button>
                    </div>

                    <div p="8" class="brick-border" bg="gray-50" text="center">
                        <p text="gray-600">No bricks found. Time to go shopping.</p>
                    </div>
                </div>
            </div>

            <!-- Error messages -->
            <div>
                <p class="brick-label" m="b-6">Error Messages</p>
                <div flex="~ col" gap="4" max-w="lg">
                    <div
                        flex
                        gap="3"
                        items="center"
                        p="3 r-4"
                        bg="white"
                        border="3 brick-red"
                        class="brick-shadow-error"
                    >
                        <PhWarningCircle size="20" text="brick-red-dark" aria-hidden="true" />
                        <p flex="1" text="brick-red-dark" font="medium">
                            Could not connect to the brick vault. Try again.
                        </p>
                    </div>

                    <div flex gap="3" items="start" p="4" bg="[#F8D0CF]" border="3 [#C41A16]">
                        <PhWarningCircle size="20" text="[#9B1510]" flex="shrink-0" m="t-0.5" aria-hidden="true" />
                        <div>
                            <p text="[#9B1510]" font="bold" m="b-1">Import failed</p>
                            <p text="sm [#9B1510]">3 of 47 parts could not be matched. The rest were saved.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Success messages -->
            <div>
                <p class="brick-label" m="b-6">Success Messages</p>
                <div flex="~ col" gap="4" max-w="lg">
                    <div flex gap="3" items="center" p="3 r-4" bg="white" class="brick-border brick-shadow">
                        <PhCheckCircle size="20" aria-hidden="true" />
                        <p flex="1" text="black" font="medium">Set added to your inventory.</p>
                    </div>

                    <div flex gap="3" items="center" p="3 r-4" bg="white" class="brick-border brick-shadow">
                        <PhCheckCircle size="20" aria-hidden="true" />
                        <p flex="1" text="black" font="medium">Storage location updated.</p>
                    </div>
                </div>
            </div>

            <!-- Destructive confirmation -->
            <div>
                <p class="brick-label" m="b-6">Destructive Confirmation</p>
                <div max-w="md" p="6" bg="white" class="brick-border brick-shadow">
                    <h3 font="heading bold" text="lg" uppercase tracking="wide" m="b-3">Delete Set?</h3>
                    <p text="sm" leading="relaxed" m="b-6">
                        This will permanently remove "10297 — Boutique Hotel" and all its parts from your inventory.
                        This cannot be undone.
                    </p>
                    <div flex gap="3">
                        <button
                            p="x-4 y-3"
                            border="3 brick-red"
                            bg="white"
                            text="brick-red-dark"
                            font="bold"
                            uppercase
                            tracking="wide"
                            cursor="default"
                            class="brick-shadow-danger"
                            flex
                            gap="2"
                            items="center"
                        >
                            <PhTrash size="16" aria-hidden="true" />
                            Delete
                        </button>
                        <button
                            p="x-4 y-3"
                            bg="black"
                            text="white"
                            font="bold"
                            uppercase
                            tracking="wide"
                            cursor="default"
                            class="brick-border brick-shadow"
                        >
                            Keep Set
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
