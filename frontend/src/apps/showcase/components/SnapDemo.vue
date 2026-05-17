<script setup lang="ts">
import {ref} from 'vue';

import SectionHeading from './SectionHeading.vue';

type InteractionState = 'default' | 'hover' | 'focus' | 'active';

const buttonState = ref<InteractionState>('default');
const inputState = ref<InteractionState>('default');
const cardState = ref<InteractionState>('default');
const linkState = ref<InteractionState>('default');

const shadowValues = {
    default: '4px 4px 0px 0px rgba(0,0,0,1)',
    hover: '6px 6px 0px 0px rgba(0,0,0,1)',
    focus: '6px 6px 0px 0px rgba(0,0,0,1)',
    active: '2px 2px 0px 0px rgba(0,0,0,1)',
};

const stateColors: Record<InteractionState, string> = {
    default: 'bg-gray-100',
    hover: 'bg-[#F5C518]',
    focus: 'bg-[#F5C518]',
    active: 'bg-[#FDF0C4]',
};
</script>

<template>
    <section p="y-20" id="snap">
        <SectionHeading number="03" title="The Snap Principle" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            Every interactive element follows the same physical contract: shadows grow on hover (the brick lifts),
            shrink on press (the brick snaps down), and yellow signals "you can touch this." No exceptions.
        </p>

        <div grid="~ cols-1 md:cols-2" gap="8">
            <!-- Button demo -->
            <div p="6" class="brick-border brick-shadow" bg="white">
                <div flex justify="between" items="center" m="b-4">
                    <p class="brick-label">Button</p>
                    <span
                        text="xs"
                        font="bold mono"
                        p="x-2 y-1"
                        :class="stateColors[buttonState]"
                        class="brick-border"
                        transition="colors"
                        duration="150"
                    >
                        {{ buttonState.toUpperCase() }}
                    </span>
                </div>

                <button
                    p="x-4 y-3"
                    bg="black hover:brick-yellow focus:brick-yellow"
                    text="white hover:black focus:black"
                    font="bold"
                    uppercase
                    tracking="wide"
                    cursor="pointer"
                    outline="none"
                    focus-visible:brick-focus
                    class="brick-border brick-shadow brick-transition hover:brick-shadow-hover focus:brick-shadow-hover active:brick-shadow-active active:translate-x-[2px] active:translate-y-[2px]"
                    @mouseenter="buttonState = 'hover'"
                    @mouseleave="buttonState = 'default'"
                    @focus="buttonState = 'focus'"
                    @blur="buttonState = 'default'"
                    @mousedown="buttonState = 'active'"
                    @mouseup="buttonState = 'hover'"
                >
                    Click me
                </button>

                <p font="mono" text="xs gray-500" m="t-4">box-shadow: {{ shadowValues[buttonState] }}</p>
            </div>

            <!-- Input demo -->
            <div p="6" class="brick-border brick-shadow" bg="white">
                <div flex justify="between" items="center" m="b-4">
                    <p class="brick-label">Input</p>
                    <span
                        text="xs"
                        font="bold mono"
                        p="x-2 y-1"
                        :class="stateColors[inputState]"
                        class="brick-border"
                        transition="colors"
                        duration="150"
                    >
                        {{ inputState.toUpperCase() }}
                    </span>
                </div>

                <input
                    type="text"
                    value="3001 — Brick 2×4"
                    p="x-4 y-3"
                    text="black"
                    font="medium"
                    w="full"
                    outline="none"
                    focus-visible:brick-focus
                    class="brick-border brick-shadow brick-transition focus:brick-shadow-hover focus:bg-brick-yellow"
                    bg="white"
                    @mouseenter="inputState = 'hover'"
                    @mouseleave="inputState = 'default'"
                    @focus="inputState = 'focus'"
                    @blur="inputState = 'default'"
                />

                <p font="mono" text="xs gray-500" m="t-4">box-shadow: {{ shadowValues[inputState] }}</p>
            </div>

            <!-- Card demo -->
            <div p="6" class="brick-border brick-shadow" bg="white">
                <div flex justify="between" items="center" m="b-4">
                    <p class="brick-label">Card</p>
                    <span
                        text="xs"
                        font="bold mono"
                        p="x-2 y-1"
                        :class="stateColors[cardState]"
                        class="brick-border"
                        transition="colors"
                        duration="150"
                    >
                        {{ cardState.toUpperCase() }}
                    </span>
                </div>

                <div
                    p="4"
                    bg="white hover:brick-yellow focus-within:brick-yellow"
                    cursor="pointer"
                    tabindex="0"
                    class="brick-border brick-shadow brick-transition hover:brick-shadow-hover focus:brick-shadow-hover active:brick-shadow-active active:translate-x-[2px] active:translate-y-[2px]"
                    @mouseenter="cardState = 'hover'"
                    @mouseleave="cardState = 'default'"
                    @focus="cardState = 'focus'"
                    @blur="cardState = 'default'"
                    @mousedown="cardState = 'active'"
                    @mouseup="cardState = 'hover'"
                >
                    <p font="bold">Brick 2x4</p>
                    <p text="sm gray-600">Drawer A-12 — 47 in stock</p>
                </div>

                <p font="mono" text="xs gray-500" m="t-4">box-shadow: {{ shadowValues[cardState] }}</p>
            </div>

            <!-- Link demo -->
            <div p="6" class="brick-border brick-shadow" bg="white">
                <div flex justify="between" items="center" m="b-4">
                    <p class="brick-label">Link</p>
                    <span
                        text="xs"
                        font="bold mono"
                        p="x-2 y-1"
                        :class="stateColors[linkState]"
                        class="brick-border"
                        transition="colors"
                        duration="150"
                    >
                        {{ linkState.toUpperCase() }}
                    </span>
                </div>

                <a
                    href="#snap"
                    font="bold"
                    text="black"
                    underline="~ offset-4"
                    decoration="3 black"
                    class="hover:decoration-[#F5C518] focus:decoration-[#F5C518] hover:bg-[#F5C518] focus:bg-[#F5C518]"
                    outline="none"
                    focus-visible:brick-focus
                    p="x-1"
                    @mouseenter="linkState = 'hover'"
                    @mouseleave="linkState = 'default'"
                    @focus="linkState = 'focus'"
                    @blur="linkState = 'default'"
                    @mousedown="linkState = 'active'"
                    @mouseup="linkState = 'hover'"
                >
                    View all storage locations
                </a>

                <p font="mono" text="xs gray-500" m="t-4">
                    decoration: 3px solid {{ linkState === 'hover' || linkState === 'focus' ? '#F5C518' : '#000000' }}
                </p>
            </div>
        </div>
    </section>
</template>
