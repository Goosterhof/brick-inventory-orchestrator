<script setup lang="ts">
import DangerButton from '@shared/components/DangerButton.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {computed, ref} from 'vue';

import SectionHeading from './SectionHeading.vue';

type Scenario = 'success' | 'auth-error' | 'validation-error' | 'network-error';

interface StageSnapshot {
    label: string;
    description: string;
    before: string;
    after: string;
    status: 'pending' | 'active' | 'done' | 'error';
}

const STEP_DELAY_MS = 600;

const activeScenario = ref<Scenario | null>(null);
const currentStageIndex = ref(-1);
const isRunning = ref(false);
const stages = ref<StageSnapshot[]>([]);

const scenarioLabels: Record<Scenario, string> = {
    success: '200 Success',
    'auth-error': '401 Auth Error',
    'validation-error': '422 Validation Error',
    'network-error': 'Network Error',
};

const scenarioLabel = computed(() => {
    const scenario = activeScenario.value;
    return scenario ? scenarioLabels[scenario] : '';
});

const sampleRequestBody = {displayName: 'Police Officer', partCount: 4, themeGroup: 'City'};

const sampleSnakeBody = {display_name: 'Police Officer', part_count: 4, theme_group: 'City'};

const successResponseSnake = {
    id: 42,
    display_name: 'Police Officer',
    part_count: 4,
    theme_group: 'City',
    created_at: '2026-03-28T12:00:00Z',
};

const successResponseCamel = {
    id: 42,
    displayName: 'Police Officer',
    partCount: 4,
    themeGroup: 'City',
    createdAt: '2026-03-28T12:00:00Z',
};

const validationErrorBody = {
    message: 'The given data was invalid.',
    errors: {display_name: ['The display name field is required.'], part_count: ['The part count must be at least 1.']},
};

function buildRequestStages(scenario: Scenario): StageSnapshot[] {
    return [
        {
            label: '1. Auth Token Injection',
            description: 'Request middleware injects the auth token into headers.',
            before: json({headers: {Accept: 'application/json'}, data: sampleRequestBody}),
            after: json({
                headers: {Accept: 'application/json', Authorization: 'Bearer eyJhbGciOi...'},
                data: sampleRequestBody,
            }),
            status: 'pending',
        },
        {
            label: '2. Loading State Start',
            description: 'Loading middleware increments the active request counter.',
            before: json({isLoading: false, activeCount: 0}),
            after: json({isLoading: true, activeCount: 1}),
            status: 'pending',
        },
        {
            label: '3. Request Transform',
            description: 'camelCase keys are converted to snake_case before sending to the API.',
            before: json(sampleRequestBody),
            after: json(sampleSnakeBody),
            status: 'pending',
        },
        {
            label: '4. Network Call',
            description: buildNetworkDescription(scenario),
            before: json({method: 'POST', url: '/api/minifigs', body: sampleSnakeBody}),
            after: buildNetworkAfter(scenario),
            status: 'pending',
        },
    ];
}

function buildResponseStages(scenario: Scenario): StageSnapshot[] {
    const loadingStop: StageSnapshot = {
        label: scenario === 'success' ? '6. Loading State Stop' : '5. Loading State Stop',
        description:
            scenario === 'success'
                ? 'Loading middleware decrements the active request counter.'
                : 'Loading middleware decrements on error responses too.',
        before: json({isLoading: true, activeCount: 1}),
        after: json({isLoading: false, activeCount: 0}),
        status: 'pending',
    };

    if (scenario === 'success') {
        return [
            {
                label: '5. Response Transform',
                description: 'snake_case keys from API are converted to camelCase for the app.',
                before: json(successResponseSnake),
                after: json(successResponseCamel),
                status: 'pending',
            },
            loadingStop,
        ];
    }

    return [loadingStop, buildErrorStage(scenario)];
}

type ErrorScenario = 'auth-error' | 'validation-error' | 'network-error';

function buildErrorStage(scenario: ErrorScenario): StageSnapshot {
    const errorStages: Record<ErrorScenario, StageSnapshot> = {
        'auth-error': {
            label: '6. Error Handling (401)',
            description: 'Auth error middleware detects 401, clears user state, redirects to login.',
            before: json({status: 401, data: {message: 'Unauthenticated.'}}),
            after: json({user: null, redirect: '/login'}),
            status: 'pending',
        },
        'validation-error': {
            label: '6. Error Handling (422)',
            description: 'Validation error middleware parses field errors from the 422 response.',
            before: json(validationErrorBody),
            after: json({
                fieldErrors: {
                    displayName: 'The display name field is required.',
                    partCount: 'The part count must be at least 1.',
                },
            }),
            status: 'pending',
        },
        'network-error': {
            label: '6. Error Handling (Network)',
            description: 'Network errors have no response object. The error propagates to the caller.',
            before: json({code: 'ERR_NETWORK', message: 'Network Error', response: null}),
            after: json({thrown: true, message: 'Network Error — check your connection'}),
            status: 'pending',
        },
    };
    return errorStages[scenario];
}

function buildStagesForScenario(scenario: Scenario): StageSnapshot[] {
    return [...buildRequestStages(scenario), ...buildResponseStages(scenario)];
}

function buildNetworkDescription(scenario: Scenario): string {
    const descriptions: Record<Scenario, string> = {
        success: 'The request reaches the server and returns 200 with the created resource.',
        'auth-error': 'The server rejects the request with 401 Unauthenticated.',
        'validation-error': 'The server rejects the request with 422 and field-level validation errors.',
        'network-error': 'The request fails to reach the server — connection refused or timeout.',
    };
    return descriptions[scenario];
}

function buildNetworkAfter(scenario: Scenario): string {
    if (scenario === 'success') {
        return json({status: 200, data: successResponseSnake});
    }
    if (scenario === 'auth-error') {
        return json({status: 401, data: {message: 'Unauthenticated.'}});
    }
    if (scenario === 'validation-error') {
        return json({status: 422, data: validationErrorBody});
    }
    return json({error: 'ERR_NETWORK', message: 'Network Error', response: null});
}

function json(data: unknown): string {
    return JSON.stringify(data, null, 2);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function runScenario(scenario: Scenario): Promise<void> {
    activeScenario.value = scenario;
    stages.value = buildStagesForScenario(scenario);
    currentStageIndex.value = -1;
    isRunning.value = true;

    for (const [i, stage] of stages.value.entries()) {
        currentStageIndex.value = i;
        stage.status = 'active';
        await sleep(STEP_DELAY_MS);

        const isErrorStage = stage.label.includes('Error Handling');
        stage.status = isErrorStage ? 'error' : 'done';
    }

    isRunning.value = false;
}

function resetPipeline(): void {
    activeScenario.value = null;
    currentStageIndex.value = -1;
    isRunning.value = false;
    stages.value = [];
}

const stageColor = (status: StageSnapshot['status']): string => {
    const colors: Record<StageSnapshot['status'], string> = {
        pending: 'gray-200',
        active: 'brick-yellow',
        done: '[#237841]',
        error: '[#C41A16]',
    };
    return colors[status];
};

const stageTextColor = (status: StageSnapshot['status']): string => {
    if (status === 'done' || status === 'error') return 'white';
    return 'black';
};
</script>

<template>
    <section p="y-20" id="middleware-pipeline-visualizer">
        <SectionHeading number="13" title="Middleware Pipeline Visualizer" />

        <p text="lg" leading="relaxed" max-w="prose" m="b-10">
            Step through how an HTTP request flows through the middleware pipeline. Each stage shows the state before
            and after the middleware runs. Try different scenarios to see how errors are handled at each layer.
        </p>

        <!-- Scenario Controls -->
        <div m="b-8">
            <p class="brick-label" m="b-4">Choose a Scenario</p>
            <div flex="~ wrap" gap="3">
                <PrimaryButton data-testid="scenario-success" :disabled="isRunning" @click="runScenario('success')">
                    200 Success
                </PrimaryButton>
                <DangerButton
                    data-testid="scenario-auth-error"
                    :disabled="isRunning"
                    @click="runScenario('auth-error')"
                >
                    401 Auth Error
                </DangerButton>
                <DangerButton
                    data-testid="scenario-validation-error"
                    :disabled="isRunning"
                    @click="runScenario('validation-error')"
                >
                    422 Validation Error
                </DangerButton>
                <DangerButton
                    data-testid="scenario-network-error"
                    :disabled="isRunning"
                    @click="runScenario('network-error')"
                >
                    Network Error
                </DangerButton>
                <PrimaryButton
                    v-show="activeScenario !== null"
                    data-testid="reset-pipeline"
                    :disabled="isRunning"
                    @click="resetPipeline"
                >
                    Reset
                </PrimaryButton>
            </div>
        </div>

        <!-- Active Scenario Label -->
        <div
            v-show="activeScenario"
            m="b-8"
            p="3"
            bg="gray-900"
            text="white sm"
            font="bold mono"
            class="brick-border"
            data-testid="active-scenario-label"
        >
            Scenario: {{ scenarioLabel }}
            <span v-if="isRunning" m="l-2" text="brick-yellow">Running...</span>
            <span v-else m="l-2" text="[#237841]">Complete</span>
        </div>

        <!-- Pipeline Stages -->
        <div v-if="stages.length > 0" flex="~ col" gap="4" m="b-12" data-testid="pipeline-stages">
            <div
                v-for="(stage, index) in stages"
                :key="index"
                class="brick-border brick-transition"
                :bg="stageColor(stage.status)"
                :text="stageTextColor(stage.status)"
                :data-testid="`stage-${index}`"
                :data-status="stage.status"
                overflow="hidden"
            >
                <!-- Stage Header -->
                <div p="4" flex="~" items="center" justify="between">
                    <div>
                        <p font="bold" text="sm">{{ stage.label }}</p>
                        <p text="xs" :opacity="stage.status === 'pending' ? '50' : '80'" m="t-1">
                            {{ stage.description }}
                        </p>
                    </div>
                    <span
                        text="xs"
                        font="mono bold"
                        p="x-2 y-1"
                        class="brick-border"
                        :bg="stage.status === 'active' ? 'white' : 'transparent'"
                        :text-color="stage.status === 'active' ? 'black' : 'inherit'"
                        :data-testid="`stage-${index}-badge`"
                    >
                        {{ stage.status.toUpperCase() }}
                    </span>
                </div>

                <!-- Stage Data (shown when active or done or error) -->
                <div
                    v-show="stage.status !== 'pending'"
                    p="4"
                    border="t-3 black"
                    bg="gray-900"
                    text="gray-100"
                    :data-testid="`stage-${index}-data`"
                >
                    <div grid="~ cols-1 md:cols-2" gap="4">
                        <div>
                            <p text="xs" font="mono bold" m="b-2" text-color="gray-400">BEFORE</p>
                            <pre
                                text="xs"
                                font="mono"
                                leading="relaxed"
                                overflow="x-auto"
                                white-space="pre-wrap"
                                :data-testid="`stage-${index}-before`"
                                >{{ stage.before }}</pre
                            >
                        </div>
                        <div>
                            <p text="xs" font="mono bold" m="b-2" text-color="gray-400">AFTER</p>
                            <pre
                                text="xs"
                                font="mono"
                                leading="relaxed"
                                overflow="x-auto"
                                white-space="pre-wrap"
                                :data-testid="`stage-${index}-after`"
                                >{{ stage.after }}</pre
                            >
                        </div>
                    </div>
                </div>

                <!-- Connector Arrow (between stages) -->
                <div
                    v-if="index < stages.length - 1 && stage.status !== 'pending'"
                    text="center"
                    p="y-0"
                    aria-hidden="true"
                />
            </div>
        </div>

        <!-- How It Works -->
        <div m="b-12">
            <p class="brick-label" m="b-4">How It Works</p>
            <div p="6" class="brick-border" bg="gray-50">
                <div grid="~ cols-1 md:cols-3" gap="6">
                    <div>
                        <p font="bold" text="sm" m="b-2">Request Middleware</p>
                        <p text="sm" leading="relaxed" text-color="gray-700">
                            Runs before the request leaves the browser. Auth token injection and loading state start
                            happen here. The
                            <code font="mono" text="xs" bg="gray-100" p="x-1">registerRequestMiddleware</code>
                            method adds functions to an array that executes in registration order.
                        </p>
                    </div>
                    <div>
                        <p font="bold" text="sm" m="b-2">Response Middleware</p>
                        <p text="sm" leading="relaxed" text-color="gray-700">
                            Runs after a successful response (2xx). The response transform converts snake_case back to
                            camelCase, and loading state is decremented. Uses
                            <code font="mono" text="xs" bg="gray-100" p="x-1">registerResponseMiddleware</code>.
                        </p>
                    </div>
                    <div>
                        <p font="bold" text="sm" m="b-2">Error Middleware</p>
                        <p text="sm" leading="relaxed" text-color="gray-700">
                            Runs on non-2xx responses. Loading state is still decremented (preventing stuck spinners),
                            then error-specific handlers run: 401 clears auth, 422 parses validation errors. Uses
                            <code font="mono" text="xs" bg="gray-100" p="x-1">registerResponseErrorMiddleware</code>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
