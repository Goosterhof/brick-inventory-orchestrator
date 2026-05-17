<script setup lang="ts">
import {createDialogService} from '@script-development/fs-dialog';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {defineComponent, h} from 'vue';

import SectionHeading from './SectionHeading.vue';

const dialogService = createDialogService();

const DemoDialogContent = defineComponent({
    name: 'DemoDialogContent',
    props: {
        title: {type: String, required: true},
        message: {type: String, required: true},
        showStack: {type: Boolean, default: false},
    },
    emits: ['close'],
    setup(props, {emit}) {
        const openStacked = () => {
            dialogService.open(DemoDialogContent, {
                title: 'Stacked Dialog',
                message:
                    'This dialog was opened from inside another dialog. The service manages the stack automatically.',
            });
        };

        return () =>
            h('div', {p: '6', bg: 'white', class: 'brick-border', min_w: 'sm:80', max_w: 'lg'}, [
                h('h3', {font: 'heading bold', text: 'xl', uppercase: '', tracking: 'wide', m: 'b-3'}, props.title),
                h('p', {m: 'b-4', text: 'gray-700'}, props.message),
                h('div', {flex: '~', gap: '3'}, [
                    ...(props.showStack
                        ? [
                              h(
                                  'button',
                                  {
                                      onClick: openStacked,
                                      p: 'x-4 y-2',
                                      font: 'bold',
                                      text: 'sm white',
                                      bg: '[#0055BF] hover:[#004299]',
                                      cursor: 'pointer',
                                      class: 'brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active',
                                  },
                                  'Open Stacked',
                              ),
                          ]
                        : []),
                    h(
                        'button',
                        {
                            onClick: () => emit('close'),
                            p: 'x-4 y-2',
                            font: 'bold',
                            text: 'sm',
                            bg: 'gray-100 hover:gray-200',
                            cursor: 'pointer',
                            class: 'brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active',
                        },
                        'Close',
                    ),
                ]),
            ]);
    },
});

const openSingleDialog = () => {
    dialogService.open(DemoDialogContent, {
        title: 'Single Dialog',
        message: 'Opened programmatically via dialogService.open(). Click Close or the backdrop to dismiss.',
    });
};

const openStackableDialog = () => {
    dialogService.open(DemoDialogContent, {
        title: 'First Dialog',
        message:
            'Click "Open Stacked" to open a second dialog on top. Each dialog gets its own native <dialog> element.',
        showStack: true,
    });
};

const closeAllDialogs = () => {
    dialogService.closeAll();
};
</script>

<template>
    <section p="y-20" id="dialog-service">
        <SectionHeading number="09" title="Dialog Service" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            Programmatic dialog management via
            <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">createDialogService()</code>. Opens components
            inside native
            <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">&lt;dialog&gt;</code>
            elements with
            <code font="mono" text="sm" bg="gray-100" p="x-1.5 y-0.5">showModal()</code>. Supports stacking, backdrop
            dismiss, and centralized close.
        </p>

        <!-- Single dialog -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Programmatic Open</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">dialogService.open(Component, props)</p>
                <PrimaryButton @click="openSingleDialog">Open Dialog</PrimaryButton>
            </div>
        </div>

        <!-- Stacking -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Dialog Stacking</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">
                    Open a dialog, then open another from within it
                </p>
                <PrimaryButton @click="openStackableDialog">Open Stackable</PrimaryButton>
            </div>
        </div>

        <!-- Close all -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Close All</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">dialogService.closeAll()</p>
                <div flex="~" gap="3">
                    <PrimaryButton @click="openStackableDialog">Open Two Dialogs</PrimaryButton>
                    <button
                        @click="closeAllDialogs"
                        p="x-4 y-3"
                        font="bold"
                        text="sm"
                        bg="[#C41A16] hover:[#A01612]"
                        text-color="white"
                        cursor="pointer"
                        class="brick-border brick-shadow brick-transition hover:brick-shadow-hover active:brick-shadow-active"
                    >
                        Close All
                    </button>
                </div>
            </div>
        </div>

        <!-- Container rendering note -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Container Component</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="sm" leading="relaxed" text-color="gray-700">
                    The
                    <code font="mono" text="xs" bg="gray-100" p="x-1.5 y-0.5">DialogContainerComponent</code>
                    must be mounted in your template for dialogs to render. It manages the dialog stack and error
                    boundaries internally.
                </p>
                <pre m="t-3" p="3" bg="gray-100" class="brick-border" text="xs" font="mono" overflow="x-auto">
&lt;component :is="dialogService.DialogContainerComponent" /&gt;</pre
                >
            </div>
        </div>

        <component :is="dialogService.DialogContainerComponent" />
    </section>
</template>
