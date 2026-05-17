<script setup lang="ts">
import BackButton from '@shared/components/BackButton.vue';
import BadgeLabel from '@shared/components/BadgeLabel.vue';
import CardContainer from '@shared/components/CardContainer.vue';
import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import DangerButton from '@shared/components/DangerButton.vue';
import DetailRow from '@shared/components/DetailRow.vue';
import EmptyState from '@shared/components/EmptyState.vue';
import FilterChip from '@shared/components/FilterChip.vue';
import FormError from '@shared/components/forms/FormError.vue';
import FormField from '@shared/components/forms/FormField.vue';
import FormLabel from '@shared/components/forms/FormLabel.vue';
import DateInput from '@shared/components/forms/inputs/DateInput.vue';
import NumberInput from '@shared/components/forms/inputs/NumberInput.vue';
import SelectInput from '@shared/components/forms/inputs/SelectInput.vue';
import TextareaInput from '@shared/components/forms/inputs/TextareaInput.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import LegoBrick from '@shared/components/LegoBrick.vue';
import LegoBrickCuboidCss from '@shared/components/LegoBrickCuboidCss.vue';
import LegoBrickIsometricSvg from '@shared/components/LegoBrickIsometricSvg.vue';
import LegoBrickSideSvg from '@shared/components/LegoBrickSideSvg.vue';
import LegoBrickSvg from '@shared/components/LegoBrickSvg.vue';
import ListItemButton from '@shared/components/ListItemButton.vue';
import LoadingState from '@shared/components/LoadingState.vue';
import ModalDialog from '@shared/components/ModalDialog.vue';
import NavHeader from '@shared/components/NavHeader.vue';
import NavLink from '@shared/components/NavLink.vue';
import NavMobileLink from '@shared/components/NavMobileLink.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PartListItem from '@shared/components/PartListItem.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import SectionDivider from '@shared/components/SectionDivider.vue';
import StatCard from '@shared/components/StatCard.vue';
import ToastMessage from '@shared/components/ToastMessage.vue';
import {ref} from 'vue';

import SectionHeading from './SectionHeading.vue';

const demoInput = ref('Brick 2x4');
const errorInput = ref('');
const toastVisible = ref(true);
const errorToastVisible = ref(true);
const modalOpen = ref(false);
const confirmOpen = ref(false);
const activeFilter = ref<string | null>(null);

const demoText = ref('Classic red brick');
const demoNumber = ref<number | null>(42);
const demoSelect = ref('built');
const demoDate = ref('2024-01-15');
const demoTextarea = ref('Stored in the top drawer, second shelf from the left.');

const resetToasts = () => {
    toastVisible.value = true;
    errorToastVisible.value = true;
};

const toggleFilter = (filter: string) => {
    activeFilter.value = activeFilter.value === filter ? null : filter;
};

const noop = () => {};
</script>

<template>
    <section p="y-20" id="components">
        <SectionHeading number="04" title="Component Gallery" />

        <!-- Buttons -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Buttons</p>
            <div grid="~ cols-1 md:cols-2 lg:cols-3" gap="6">
                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">PrimaryButton</p>
                    <div flex="~ wrap" gap="3">
                        <PrimaryButton>Save Changes</PrimaryButton>
                    </div>
                </div>

                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">PrimaryButton :disabled</p>
                    <div flex="~ wrap" gap="3">
                        <PrimaryButton disabled>Save Changes</PrimaryButton>
                    </div>
                </div>

                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">DangerButton</p>
                    <div flex="~ wrap" gap="3">
                        <DangerButton>Delete Set</DangerButton>
                    </div>
                </div>

                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">BackButton</p>
                    <div flex="~ wrap" gap="3">
                        <BackButton>&larr; Back to Overview</BackButton>
                    </div>
                </div>

                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">ListItemButton</p>
                    <ListItemButton>
                        <span font="bold">Brick 2x4</span>
                        <span text="sm gray-600">Red &middot; Drawer B-7</span>
                    </ListItemButton>
                </div>
            </div>
        </div>

        <!-- Form inputs -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Form Inputs</p>
            <div grid="~ cols-1 md:cols-2" gap="6">
                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">Default + Focus</p>
                    <FormField>
                        <FormLabel for="demo-input" :optional="false">Part Name</FormLabel>
                        <input
                            id="demo-input"
                            v-model="demoInput"
                            type="text"
                            p="x-4 y-3"
                            text="black"
                            font="medium"
                            w="full"
                            outline="none"
                            focus-visible:brick-focus
                            class="brick-border brick-shadow brick-transition focus:brick-shadow-hover focus:bg-brick-yellow"
                            bg="white"
                        />
                    </FormField>
                </div>

                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">Error State</p>
                    <FormField>
                        <FormLabel for="error-input" :optional="false">Part Number</FormLabel>
                        <input
                            id="error-input"
                            v-model="errorInput"
                            type="text"
                            placeholder="Required"
                            p="x-4 y-3"
                            text="black"
                            font="medium"
                            w="full"
                            outline="none"
                            focus-visible:brick-focus
                            class="brick-border brick-transition bg-brick-red-light border-brick-red brick-shadow-error focus:brick-shadow-error-hover"
                            aria-invalid="true"
                            aria-describedby="error-input-error"
                        />
                        <FormError id="error-input-error" message="Part number is required." />
                    </FormField>
                </div>

                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">TextInput</p>
                    <TextInput v-model="demoText" label="Description" />
                </div>

                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">NumberInput</p>
                    <NumberInput v-model="demoNumber" label="Quantity" :min="0" :max="999" />
                </div>

                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">SelectInput</p>
                    <SelectInput v-model="demoSelect" label="Status">
                        <option value="sealed">Sealed</option>
                        <option value="built">Built</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_storage">In Storage</option>
                        <option value="incomplete">Incomplete</option>
                    </SelectInput>
                </div>

                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">DateInput</p>
                    <DateInput v-model="demoDate" label="Purchase Date" optional />
                </div>

                <div p="6" class="brick-border" bg="gray-50" md:col-span="2">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">TextareaInput</p>
                    <TextareaInput v-model="demoTextarea" label="Notes" optional />
                </div>
            </div>
        </div>

        <!-- Cards & Layout -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Cards &amp; Layout</p>
            <div grid="~ cols-1 md:cols-2 lg:cols-3" gap="6">
                <CardContainer>
                    <p font="heading bold" text="lg" uppercase tracking="wide" m="b-2">Brick 2x4</p>
                    <p text="sm gray-600">Classic red brick. Drawer B-7.</p>
                    <p text="sm" font="bold" m="t-3">47 in stock</p>
                </CardContainer>

                <CardContainer>
                    <p font="heading bold" text="lg" uppercase tracking="wide" m="b-2">Plate 1x2</p>
                    <p text="sm gray-600">White plate. Drawer C-14.</p>
                    <p text="sm" font="bold" m="t-3">182 in stock</p>
                </CardContainer>

                <CardContainer>
                    <p font="heading bold" text="lg" uppercase tracking="wide" m="b-2">Slope 45 2x1</p>
                    <p text="sm gray-600">Dark gray slope. Drawer A-3.</p>
                    <p text="sm" font="bold" m="t-3">23 in stock</p>
                </CardContainer>
            </div>
        </div>

        <!-- PageHeader -->
        <div m="b-12">
            <p class="brick-label" m="b-6">PageHeader</p>
            <div p="6" class="brick-border" bg="gray-50">
                <PageHeader title="My Inventory">
                    <PrimaryButton>Add Set</PrimaryButton>
                </PageHeader>
            </div>
        </div>

        <!-- StatCard -->
        <div m="b-12">
            <p class="brick-label" m="b-6">StatCard</p>
            <div grid="~ cols-1 sm:cols-2 lg:cols-3" gap="6">
                <StatCard label="Total Sets" value="42">
                    <p text="sm gray-600">Including 3 duplicates</p>
                </StatCard>
                <StatCard label="Storage Locations" value="12" />
                <StatCard label="Unique Parts" value="1,847">
                    <p text="sm gray-600">14,203 total pieces</p>
                </StatCard>
            </div>
        </div>

        <!-- DetailRow -->
        <div m="b-12">
            <p class="brick-label" m="b-6">DetailRow</p>
            <div p="6" class="brick-border" bg="gray-50" flex="~ col" gap="3">
                <DetailRow label="Name">Drawer A-3</DetailRow>
                <DetailRow label="Description">Top shelf, third from left</DetailRow>
                <DetailRow label="Row">1</DetailRow>
                <DetailRow label="Column">3</DetailRow>
            </div>
        </div>

        <!-- PartListItem -->
        <div m="b-12">
            <p class="brick-label" m="b-6">PartListItem</p>
            <div flex="~ col" gap="3" max-w="lg">
                <PartListItem name="Brick 2x4" part-num="3001" :quantity="12" color-name="Red" color-rgb="C91A09" />
                <PartListItem name="Plate 1x2" part-num="3023" :quantity="8" color-name="White" color-rgb="FFFFFF" />
                <PartListItem
                    name="Technic Axle 3"
                    part-num="4519"
                    :quantity="4"
                    color-name="Black"
                    color-rgb="05131D"
                />
                <PartListItem
                    name="Tile 1x1 Round"
                    part-num="98138"
                    :quantity="2"
                    color-name="Trans-Clear"
                    color-rgb="EEEEEE"
                    spare
                />
            </div>
        </div>

        <!-- FilterChip -->
        <div m="b-12">
            <p class="brick-label" m="b-6">FilterChip</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">Click to toggle</p>
                <div flex gap="2" flex-wrap="wrap">
                    <FilterChip :active="activeFilter === 'sealed'" @click="toggleFilter('sealed')">Sealed</FilterChip>
                    <FilterChip :active="activeFilter === 'built'" @click="toggleFilter('built')">Built</FilterChip>
                    <FilterChip :active="activeFilter === 'in-progress'" @click="toggleFilter('in-progress')">
                        In Progress
                    </FilterChip>
                    <FilterChip :active="activeFilter === 'incomplete'" @click="toggleFilter('incomplete')">
                        Incomplete
                    </FilterChip>
                </div>
            </div>
        </div>

        <!-- BadgeLabel -->
        <div m="b-12">
            <p class="brick-label" m="b-6">BadgeLabel</p>
            <div p="6" class="brick-border" bg="gray-50">
                <div flex gap="3" flex-wrap="wrap" items="center">
                    <BadgeLabel>Sealed</BadgeLabel>
                    <BadgeLabel>Built</BadgeLabel>
                    <BadgeLabel variant="highlight">Drawer A-3 (12x)</BadgeLabel>
                    <BadgeLabel variant="highlight">Shelf B-1 (5x)</BadgeLabel>
                </div>
            </div>
        </div>

        <!-- SectionDivider -->
        <div m="b-12">
            <p class="brick-label" m="b-6">SectionDivider</p>
            <div p="6" class="brick-border" bg="gray-50" flex="~ col" gap="4">
                <p>Content above the divider</p>
                <SectionDivider />
                <p>Content below the divider</p>
            </div>
        </div>

        <!-- LoadingState -->
        <div m="b-12">
            <p class="brick-label" m="b-6">LoadingState</p>
            <div grid="~ cols-1 md:cols-2" gap="6">
                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">Default</p>
                    <LoadingState />
                </div>
                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">Custom message</p>
                    <LoadingState message="Fetching bricks..." />
                </div>
            </div>
        </div>

        <!-- ModalDialog -->
        <div m="b-12">
            <p class="brick-label" m="b-6">ModalDialog</p>
            <div p="6" class="brick-border" bg="gray-50">
                <PrimaryButton @click="modalOpen = true">Open Modal</PrimaryButton>
                <ModalDialog :open="modalOpen" @close="modalOpen = false">
                    <template #title>Confirm Action</template>
                    <p m="b-4">Are you sure you want to remove this brick from your inventory?</p>
                    <div flex gap="3">
                        <DangerButton @click="modalOpen = false">Remove</DangerButton>
                        <BackButton @click="modalOpen = false">Cancel</BackButton>
                    </div>
                </ModalDialog>
            </div>
        </div>

        <!-- ConfirmDialog -->
        <div m="b-12">
            <p class="brick-label" m="b-6">ConfirmDialog</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="xs" font="mono" text-color="gray-500" m="b-3">Replaces window.confirm()</p>
                <DangerButton @click="confirmOpen = true">Delete Storage</DangerButton>
                <ConfirmDialog
                    :open="confirmOpen"
                    title="Delete Storage"
                    message="This will permanently remove the storage location and unassign all parts. This cannot be undone."
                    @confirm="confirmOpen = false"
                    @cancel="confirmOpen = false"
                >
                    <template #confirm>Delete</template>
                    <template #cancel>Keep It</template>
                </ConfirmDialog>
            </div>
        </div>

        <!-- Toasts -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Toast Messages</p>
            <div flex="~ col" gap="4" max-w="lg">
                <ToastMessage
                    v-if="toastVisible"
                    message="Set added to your inventory."
                    variant="success"
                    @close="toastVisible = false"
                />
                <ToastMessage
                    v-if="errorToastVisible"
                    message="Could not connect to the brick vault."
                    variant="error"
                    @close="errorToastVisible = false"
                />
                <button
                    v-if="!toastVisible || !errorToastVisible"
                    @click="resetToasts"
                    text="sm"
                    font="bold"
                    underline="~ offset-4"
                    decoration="2 black"
                    cursor="pointer"
                    bg="transparent"
                    border="none"
                    p="0"
                    self="start"
                >
                    Reset toasts
                </button>
            </div>
        </div>

        <!-- Empty state -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Empty State</p>
            <div p="8" class="brick-border" bg="gray-50">
                <EmptyState message="No bricks found. Time to go shopping." />
            </div>
        </div>

        <!-- Navigation -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Navigation</p>
            <div flex="~ col" gap="6">
                <div class="brick-border" bg="gray-50" overflow="hidden">
                    <p text="xs" font="mono" text-color="gray-500" p="4 b-0">NavHeader</p>
                    <NavHeader>
                        <template #links>
                            <NavLink to="/sets" @click="noop">Sets</NavLink>
                            <NavLink to="/storage" @click="noop">Storage</NavLink>
                        </template>
                        <template #mobile-links>
                            <NavMobileLink to="/sets" :active="true" @click="noop">Sets</NavMobileLink>
                            <NavMobileLink to="/storage" :active="false" @click="noop">Storage</NavMobileLink>
                        </template>
                        <template #actions>
                            <PrimaryButton>Log In</PrimaryButton>
                        </template>
                    </NavHeader>
                </div>

                <div grid="~ cols-1 md:cols-2" gap="6">
                    <div p="6" class="brick-border" bg="gray-50">
                        <p text="xs" font="mono" text-color="gray-500" m="b-3">NavLink</p>
                        <div flex gap="3">
                            <NavLink to="/sets" @click="noop">Sets</NavLink>
                            <NavLink to="/parts" @click="noop">Parts</NavLink>
                        </div>
                    </div>

                    <div p="6" class="brick-border" bg="gray-50">
                        <p text="xs" font="mono" text-color="gray-500" m="b-3">NavMobileLink</p>
                        <div flex="~ col">
                            <NavMobileLink to="/sets" :active="true" @click="noop">Sets</NavMobileLink>
                            <NavMobileLink to="/storage" :active="false" @click="noop">Storage</NavMobileLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Scanner Components -->
        <div m="b-12">
            <p class="brick-label" m="b-6">Scanner Components</p>
            <div grid="~ cols-1 md:cols-2" gap="6">
                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">BarcodeScanner</p>
                    <p text="sm gray-600" m="b-3">Requires camera hardware. Shows error state in demo environment.</p>
                    <!--
                        BarcodeScanner and CameraCapture require camera hardware and are not
                        rendered live in the gallery. They auto-start the camera on mount, which
                        would fail in demo/test environments. The components are imported to prove
                        they exist and are available, but demoed via description only.
                    -->
                    <div
                        p="6"
                        bg="gray-900"
                        text="white center"
                        font="bold"
                        class="brick-border brick-shadow"
                        role="img"
                        aria-label="BarcodeScanner placeholder"
                    >
                        BarcodeScanner — Camera Required
                    </div>
                </div>

                <div p="6" class="brick-border" bg="gray-50">
                    <p text="xs" font="mono" text-color="gray-500" m="b-3">CameraCapture</p>
                    <p text="sm gray-600" m="b-3">Requires camera hardware. Shows error state in demo environment.</p>
                    <div
                        p="6"
                        bg="gray-900"
                        text="white center"
                        font="bold"
                        class="brick-border brick-shadow"
                        role="img"
                        aria-label="CameraCapture placeholder"
                    >
                        CameraCapture — Camera Required
                    </div>
                </div>
            </div>
        </div>

        <!-- LegoBrick -->
        <div m="b-12">
            <p class="brick-label" m="b-6">LegoBrick</p>
            <div p="6" class="brick-border" bg="gray-50">
                <div flex="~ wrap" gap="6" items="end">
                    <div flex="~ col" items="center" gap="2">
                        <LegoBrick :columns="4" :rows="2" color="#DC2626" />
                        <p text="xs" font="mono" text-color="gray-500">4x2 Red</p>
                    </div>
                    <div flex="~ col" items="center" gap="2">
                        <LegoBrick :columns="2" :rows="2" color="#0055BF" />
                        <p text="xs" font="mono" text-color="gray-500">2x2 Blue</p>
                    </div>
                    <div flex="~ col" items="center" gap="2">
                        <LegoBrick :columns="1" :rows="1" color="#F5C518" :shadow="false" />
                        <p text="xs" font="mono" text-color="gray-500">1x1 Yellow (no shadow)</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- LegoBrickSvg -->
        <div m="b-12">
            <p class="brick-label" m="b-6">LegoBrickSvg</p>
            <div p="6" class="brick-border" bg="gray-50">
                <div flex="~ wrap" gap="6" items="end">
                    <div flex="~ col" items="center" gap="2">
                        <LegoBrickSvg :columns="4" :rows="2" color="#DC2626" />
                        <p text="xs" font="mono" text-color="gray-500">4x2 Red</p>
                    </div>
                    <div flex="~ col" items="center" gap="2">
                        <LegoBrickSvg :columns="2" :rows="2" color="#0055BF" />
                        <p text="xs" font="mono" text-color="gray-500">2x2 Blue</p>
                    </div>
                    <div flex="~ col" items="center" gap="2">
                        <LegoBrickSvg :columns="1" :rows="1" color="#F5C518" :shadow="false" />
                        <p text="xs" font="mono" text-color="gray-500">1x1 Yellow (no shadow)</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- LegoBrickSideSvg -->
        <div m="b-12">
            <p class="brick-label" m="b-6">LegoBrickSideSvg</p>
            <div p="6" class="brick-border" bg="gray-50">
                <div flex="~ wrap" gap="6" items="end">
                    <div flex="~ col" items="center" gap="2">
                        <div w="40">
                            <LegoBrickSideSvg :columns="4" :rows="2" color="#DC2626" />
                        </div>
                        <p text="xs" font="mono" text-color="gray-500">4x2 Red</p>
                    </div>
                    <div flex="~ col" items="center" gap="2">
                        <div w="24">
                            <LegoBrickSideSvg :columns="2" :rows="2" color="#0055BF" />
                        </div>
                        <p text="xs" font="mono" text-color="gray-500">2x2 Blue</p>
                    </div>
                    <div flex="~ col" items="center" gap="2">
                        <div w="16">
                            <LegoBrickSideSvg :columns="1" :rows="1" color="#F5C518" :shadow="false" />
                        </div>
                        <p text="xs" font="mono" text-color="gray-500">1x1 Yellow (no shadow)</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 3D Brick Techniques -->
        <div m="b-12">
            <p class="brick-label" m="b-6">3D Brick Techniques</p>
            <div p="6" class="brick-border" bg="gray-50">
                <p text="sm gray-700" m="b-6" max-w="3xl" leading="relaxed">
                    Two approaches to rendering a 6x2 brick in 3D without a WebGL dependency. CSS 3D uses real geometry
                    — six faces composed with <code font="mono">transform: rotateX/Y translateZ</code> — which opens the
                    door to future orbit controls and per-face interactivity. SVG isometric uses a locked 30&deg;
                    projection: crisp at any size, pairs naturally with <code font="mono">brick-shadow</code>, and ships
                    as a single scalable asset.
                </p>
                <div grid="~ cols-1 md:cols-2" gap="8" items="start">
                    <div flex="~ col" items="center" gap="3">
                        <p text="xs" font="mono bold" text-color="gray-500" uppercase tracking="wide">
                            CSS 3D Transforms
                        </p>
                        <LegoBrickCuboidCss color="#C41A16" />
                        <p text="xs gray-600 center" max-w="sm">
                            Real geometry. Hover tilts the scene. Reduced-motion compliant via the global override.
                        </p>
                    </div>
                    <div flex="~ col" items="center" gap="3">
                        <p text="xs" font="mono bold" text-color="gray-500" uppercase tracking="wide">
                            SVG Isometric Projection
                        </p>
                        <div w="80">
                            <LegoBrickIsometricSvg color="#0055BF" />
                        </div>
                        <p text="xs gray-600 center" max-w="sm">
                            Locked 30&deg; projection. Crisp at any size, no layout thrash.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
