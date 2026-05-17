<script setup lang="ts">
import {createToastService} from '@script-development/fs-toast';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import ToastMessage from '@shared/components/ToastMessage.vue';
import {ref} from 'vue';

import SectionHeading from './SectionHeading.vue';

const toastService = createToastService(ToastMessage);
const lastToastId = ref<string | null>(null);
const toastLog = ref<string[]>([]);

const addLog = (entry: string) => {
    toastLog.value = [...toastLog.value.slice(-9), entry];
};

const showSuccess = () => {
    const id = toastService.show({message: 'Set added to your inventory.', variant: 'success'});
    lastToastId.value = id;
    addLog(`show() -> ${id}`);
};

const showError = () => {
    const id = toastService.show({message: 'Could not connect to the brick vault.', variant: 'error'});
    lastToastId.value = id;
    addLog(`show() -> ${id}`);
};

const showMany = () => {
    for (let i = 1; i <= 6; i++) {
        const id = toastService.show({
            message: `Toast #${i} — oldest get removed when max (4) exceeded.`,
            variant: i % 2 === 0 ? 'error' : 'success',
        });
        addLog(`show() -> ${id}`);
    }
};

const hideLastToast = () => {
    if (lastToastId.value) {
        toastService.hide(lastToastId.value);
        addLog(`hide(${lastToastId.value})`);
        lastToastId.value = null;
    }
};

const clearLog = () => {
    toastLog.value = [];
};
</script>

<template>
    <section p="y-20" id="toast-service">
        <SectionHeading number="10" title="Toast Service" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            Programmatic toast management via
            <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">createToastService(ToastMessage)</code>. Shows
            toasts with <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">show()</code> returning a unique ID.
            FIFO queue with a maximum of 4 visible toasts.
        </p>

        <!-- Show variants -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Show Toasts</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">toastService.show(props) returns a unique ID</p>
                <div flex="~ wrap" gap="3">
                    <PrimaryButton @click="showSuccess">Success Toast</PrimaryButton>
                    <PrimaryButton @click="showError">Error Toast</PrimaryButton>
                </div>
            </div>
        </div>

        <!-- FIFO behavior -->
        <div m="b-12">
            <p class="brick-label" m="b-6">FIFO Queue (max 4)</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">
                    Shows 6 toasts — oldest are removed when max (4) is exceeded
                </p>
                <PrimaryButton @click="showMany">Show 6 Toasts</PrimaryButton>
            </div>
        </div>

        <!-- Programmatic hide -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Programmatic Hide</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">toastService.hide(id)</p>
                <div flex="~ wrap" gap="3" items="center">
                    <PrimaryButton @click="showSuccess">Show Toast</PrimaryButton>
                    <button
                        :disabled="!lastToastId"
                        @click="hideLastToast"
                        p="x-4 y-3"
                        font="bold"
                        text="sm"
                        bg="[#C41A16] hover:[#A01612]"
                        text-color="white"
                        cursor="pointer"
                        class="brick-border brick-transition"
                        :class="
                            lastToastId
                                ? 'brick-shadow hover:brick-shadow-hover active:brick-shadow-active'
                                : 'brick-disabled'
                        "
                    >
                        Hide Last
                    </button>
                </div>
                <p v-if="lastToastId" text="xs" font="mono" text-color="gray-500" m="t-2">Last ID: {{ lastToastId }}</p>
            </div>
        </div>

        <!-- Container rendering note -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Container Component</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="sm" leading="relaxed" text-color="gray-700">
                    The
                    <code font="mono" text="xs" bg="gray-100" p="x-1.5 y-0.5">ToastContainerComponent</code>
                    must be mounted for toasts to render. It manages the toast queue and FIFO eviction internally.
                </p>
                <pre m="t-3" p="3" bg="gray-100" class="brick-border" text="xs" font="mono" overflow="x-auto">
&lt;component :is="toastService.ToastContainerComponent" /&gt;</pre
                >
            </div>
        </div>

        <!-- Event log -->
        <div v-if="toastLog.length > 0" m="b-12">
            <p class="brick-label" m="b-6">Event Log</p>
            <div p="4" class="brick-border" bg="gray-900" text="gray-100">
                <div flex="~" justify="between" items="center" m="b-3">
                    <p text="xs" font="mono bold" uppercase tracking="widest">Toast Events</p>
                    <button
                        @click="clearLog"
                        text="xs"
                        font="mono bold"
                        bg="transparent hover:gray-700"
                        text-color="gray-400 hover:gray-100"
                        cursor="pointer"
                        border="none"
                        p="x-2 y-1"
                    >
                        Clear
                    </button>
                </div>
                <p v-for="(entry, index) in toastLog" :key="index" text="xs" font="mono" leading="relaxed">
                    {{ entry }}
                </p>
            </div>
        </div>

        <!-- Toast container (renders at bottom-right via the component's own positioning) -->
        <component
            :is="toastService.ToastContainerComponent"
            fixed="~"
            bottom="4"
            right="4"
            z="50"
            flex="~ col"
            gap="2"
            w="sm"
            max-w="[calc(100vw-2rem)]"
        />
    </section>
</template>
