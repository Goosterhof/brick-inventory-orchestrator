<script setup lang="ts">
import SectionHeading from './SectionHeading.vue';
</script>

<template>
    <section p="y-20" id="typography">
        <SectionHeading number="02" title="Typography Specimen" />

        <!-- Heading scale -->
        <div p="6" class="brick-border brick-shadow" bg="white" m="b-8">
            <p class="brick-label" m="b-6" text="gray-600">Heading Scale — Space Grotesk 700</p>

            <div flex="~ col" gap="6">
                <div border="b-1 gray-200" p="b-4">
                    <span text="xs" font="mono" text-color="gray-400" m="b-1" block> h1 — text-4xl / 36px </span>
                    <h1 font="heading bold" text="4xl" uppercase tracking="wide">Inventory Dashboard</h1>
                </div>

                <div border="b-1 gray-200" p="b-4">
                    <span text="xs" font="mono" text-color="gray-400" m="b-1" block> h2 — text-2xl / 24px </span>
                    <h2 font="heading bold" text="2xl" uppercase tracking="wide">Storage Locations</h2>
                </div>

                <div border="b-1 gray-200" p="b-4">
                    <span text="xs" font="mono" text-color="gray-400" m="b-1" block> h3 — text-xl / 20px </span>
                    <h3 font="heading bold" text="xl" uppercase tracking="wide">Part Details</h3>
                </div>

                <div>
                    <span text="xs" font="mono" text-color="gray-400" m="b-1" block> label — text-sm / 14px </span>
                    <span class="brick-label">Drawer Location</span>
                </div>
            </div>
        </div>

        <!-- Body text -->
        <div p="6" class="brick-border brick-shadow" bg="white" m="b-8">
            <p class="brick-label" m="b-6" text="gray-600">Body Text — System Font Stack</p>
            <p text="base" leading="relaxed" max-w="prose">
                The system font stack ensures body text renders natively on every platform. No loading delay, no layout
                shift. Headings get Space Grotesk to mark visual hierarchy — body text gets the OS default because
                readability beats branding at paragraph scale.
            </p>
        </div>

        <!-- Before / After comparison -->
        <div grid="~ cols-1 md:cols-2" gap="6">
            <div p="6" class="brick-border" bg="gray-100">
                <p class="brick-label" m="b-4" text="brick-red-dark">Before — System font heading</p>
                <h2 font="bold sans" text="2xl" uppercase tracking="wide">Storage Locations</h2>
                <p text="sm gray-600" m="t-3">Generic. Could be any enterprise app. No personality.</p>
            </div>

            <div p="6" class="brick-border brick-shadow" bg="white">
                <p class="brick-label" m="b-4" text="baseplate-green">After — Space Grotesk heading</p>
                <h2 font="heading bold" text="2xl" uppercase tracking="wide">Storage Locations</h2>
                <p text="sm gray-600" m="t-3">Industrial. Precise. You know it's Brick Brutalism.</p>
            </div>
        </div>
    </section>
</template>
