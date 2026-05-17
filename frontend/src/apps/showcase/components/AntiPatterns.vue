<script setup lang="ts">
import SectionHeading from './SectionHeading.vue';
</script>

<template>
    <section p="y-20" id="anti-patterns">
        <SectionHeading number="05" title="Anti-Patterns Wall" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            Every rule exists because someone broke it. This wall shows what Brick Brutalism is
            <strong>not</strong> — and why the correct version works.
        </p>

        <div flex="~ col" gap="8">
            <!-- Rounded vs Sharp -->
            <div grid="~ cols-1 md:cols-2" gap="6">
                <div p="6" border="3 red-400 dashed" bg="red-50">
                    <p text="xs" font="bold mono" text-color="brick-red-dark" uppercase m="b-4">
                        Wrong — Rounded corners
                    </p>
                    <button p="x-4 y-3" bg="black" text="white" font="bold" rounded="lg" shadow="md" cursor="default">
                        Save Changes
                    </button>
                    <p text="sm" text-color="red-700" m="t-3">
                        Rounded corners signal softness. Bricks don't have soft edges.
                    </p>
                </div>

                <div p="6" class="brick-border brick-shadow" bg="white">
                    <p text="xs" font="bold mono" text-color="baseplate-green" uppercase m="b-4">
                        Correct — Sharp corners
                    </p>
                    <button
                        p="x-4 y-3"
                        bg="black"
                        text="white"
                        font="bold"
                        uppercase
                        tracking="wide"
                        class="brick-border brick-shadow"
                        cursor="default"
                    >
                        Save Changes
                    </button>
                    <p text="sm gray-600" m="t-3">Sharp corners. Zero border-radius. Every edge is intentional.</p>
                </div>
            </div>

            <!-- Blurred vs Hard shadow -->
            <div grid="~ cols-1 md:cols-2" gap="6">
                <div p="6" border="3 red-400 dashed" bg="red-50">
                    <p text="xs" font="bold mono" text-color="brick-red-dark" uppercase m="b-4">
                        Wrong — Blurred shadow
                    </p>
                    <div p="4" bg="white" border="1 gray-200" rounded="md" shadow="lg">
                        <p font="bold">Part Card</p>
                        <p text="sm gray-600">Floating in undefined space.</p>
                    </div>
                    <p text="sm" text-color="red-700" m="t-3">
                        Blurred shadows have no direction. They float instead of stack.
                    </p>
                </div>

                <div p="6" class="brick-border brick-shadow" bg="white">
                    <p text="xs" font="bold mono" text-color="baseplate-green" uppercase m="b-4">
                        Correct — Hard offset shadow
                    </p>
                    <div p="4" bg="white" class="brick-border brick-shadow">
                        <p font="bold">Part Card</p>
                        <p text="sm gray-600">Physically stacked. You can feel the depth.</p>
                    </div>
                    <p text="sm gray-600" m="t-3">
                        4px hard offset. No blur. The shadow tells you exactly where the light is.
                    </p>
                </div>
            </div>

            <!-- Gradient vs Flat -->
            <div grid="~ cols-1 md:cols-2" gap="6">
                <div p="6" border="3 red-400 dashed" bg="red-50">
                    <p text="xs" font="bold mono" text-color="brick-red-dark" uppercase m="b-4">
                        Wrong — Gradient fill
                    </p>
                    <button
                        p="x-4 y-3"
                        text="white"
                        font="bold"
                        rounded="md"
                        cursor="default"
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    >
                        Save Changes
                    </button>
                    <p text="sm" text-color="red-700" m="t-3">
                        Gradients are decoration. Bricks are solid-colored plastic.
                    </p>
                </div>

                <div p="6" class="brick-border brick-shadow" bg="white">
                    <p text="xs" font="bold mono" text-color="baseplate-green" uppercase m="b-4">
                        Correct — Flat solid color
                    </p>
                    <button
                        p="x-4 y-3"
                        bg="black"
                        text="white"
                        font="bold"
                        uppercase
                        tracking="wide"
                        class="brick-border brick-shadow"
                        cursor="default"
                    >
                        Save Changes
                    </button>
                    <p text="sm gray-600" m="t-3">One color. No gradients. ABS plastic doesn't do gradients.</p>
                </div>
            </div>

            <!-- Thin border vs 3px -->
            <div grid="~ cols-1 md:cols-2" gap="6">
                <div p="6" border="3 red-400 dashed" bg="red-50">
                    <p text="xs" font="bold mono" text-color="brick-red-dark" uppercase m="b-4">Wrong — 1px border</p>
                    <div p="4" bg="white" border="1 gray-300" rounded="sm" shadow="sm">
                        <p font="bold">Part Card</p>
                        <p text="sm gray-600">Timid. Apologetic. Barely there.</p>
                    </div>
                    <p text="sm" text-color="red-700" m="t-3">
                        Thin borders disappear. They whisper when they should declare.
                    </p>
                </div>

                <div p="6" class="brick-border brick-shadow" bg="white">
                    <p text="xs" font="bold mono" text-color="baseplate-green" uppercase m="b-4">
                        Correct — 3px border
                    </p>
                    <div p="4" bg="white" class="brick-border brick-shadow">
                        <p font="bold">Part Card</p>
                        <p text="sm gray-600">Present. Committed. Unapologetic.</p>
                    </div>
                    <p text="sm gray-600" m="t-3">3px solid black. Every element announces itself.</p>
                </div>
            </div>
        </div>
    </section>
</template>
