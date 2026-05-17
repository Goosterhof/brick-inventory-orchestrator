import {shallowMount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {nextTick} from 'vue';

import MiddlewarePipelineVisualizer from '@/apps/showcase/components/MiddlewarePipelineVisualizer.vue';

// Mock shared components to cut import chain cost (ADR-010).
const {mkButtonStub} = vi.hoisted(() => ({
    mkButtonStub: (name: string) => ({
        name,
        props: {disabled: Boolean},
        emits: ['click'],
        template: `<button @click="$emit('click')" :disabled="disabled" :data-testid="$attrs['data-testid']"><slot /></button>`,
    }),
}));

vi.mock('@shared/components/PrimaryButton.vue', () => ({default: mkButtonStub('PrimaryButton')}));
vi.mock('@shared/components/DangerButton.vue', () => ({default: mkButtonStub('DangerButton')}));
vi.mock('@/apps/showcase/components/SectionHeading.vue', () => ({
    default: {
        name: 'SectionHeading',
        props: {number: String, title: String},
        template: '<div>{{ number }} {{ title }}</div>',
    },
}));

async function advanceAllStages(stageCount: number): Promise<void> {
    for (let i = 0; i < stageCount; i++) {
        await vi.advanceTimersByTimeAsync(600);
        await nextTick();
    }
}

describe('MiddlewarePipelineVisualizer', () => {
    const stubs = {SectionHeading: false as const, PrimaryButton: false as const, DangerButton: false as const};

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('initial state', () => {
        it('should render section heading, id, and introductory description', () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            expect(wrapper.text()).toContain('13');
            expect(wrapper.text()).toContain('Middleware Pipeline Visualizer');
            expect(wrapper.find('section#middleware-pipeline-visualizer').exists()).toBe(true);
            expect(wrapper.text()).toContain('Step through how an HTTP request flows through the middleware pipeline');
        });

        it('should render scenario buttons and labels', () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            expect(wrapper.find('[data-testid="scenario-success"]').text()).toBe('200 Success');
            expect(wrapper.find('[data-testid="scenario-auth-error"]').text()).toBe('401 Auth Error');
            expect(wrapper.find('[data-testid="scenario-validation-error"]').text()).toBe('422 Validation Error');
            expect(wrapper.find('[data-testid="scenario-network-error"]').text()).toBe('Network Error');

            const labels = wrapper.findAll('.brick-label');
            const labelTexts = labels.map((l) => l.text());
            expect(labelTexts).toContain('Choose a Scenario');
        });

        it('should hide active scenario label and pipeline stages initially', () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            const label = wrapper.find('[data-testid="active-scenario-label"]');
            expect(label.attributes('style')).toContain('display: none');
            expect(wrapper.find('[data-testid="pipeline-stages"]').exists()).toBe(false);
        });

        it('should render how-it-works section with middleware type descriptions and code references', () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            const labels = wrapper.findAll('.brick-label');
            const labelTexts = labels.map((l) => l.text());
            expect(labelTexts).toContain('How It Works');
            expect(wrapper.text()).toContain('Request Middleware');
            expect(wrapper.text()).toContain('Response Middleware');
            expect(wrapper.text()).toContain('Error Middleware');
            expect(wrapper.text()).toContain('registerRequestMiddleware');
            expect(wrapper.text()).toContain('registerResponseMiddleware');
            expect(wrapper.text()).toContain('registerResponseErrorMiddleware');
        });

        it('should use PrimaryButton for success scenario and reset', () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            const primaryButtons = wrapper.findAllComponents({name: 'PrimaryButton'});
            const primaryTexts = primaryButtons.map((b) => b.text());
            expect(primaryTexts).toContain('200 Success');
            expect(primaryTexts).toContain('Reset');
        });

        it('should use DangerButton for error scenarios', () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            const dangerButtons = wrapper.findAllComponents({name: 'DangerButton'});
            const dangerTexts = dangerButtons.map((b) => b.text());
            expect(dangerTexts).toContain('401 Auth Error');
            expect(dangerTexts).toContain('422 Validation Error');
            expect(dangerTexts).toContain('Network Error');
        });

        it('should hide the reset button when no scenario is active', () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            const resetBtn = wrapper.find('[data-testid="reset-pipeline"]');
            expect(resetBtn.exists()).toBe(true);
            expect(resetBtn.attributes('style')).toContain('display: none');
        });

        it('should render description text about middleware patterns', () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            expect(wrapper.text()).toContain('registration order');
            expect(wrapper.text()).toContain('stuck spinners');
        });
    });

    describe('success scenario', () => {
        it('should show active scenario label, 6 stages with correct labels, and first stage active', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-success"]').trigger('click');
            await nextTick();

            const label = wrapper.find('[data-testid="active-scenario-label"]');
            expect(label.exists()).toBe(true);
            expect(label.text()).toContain('200 Success');
            expect(label.text()).toContain('Running...');

            expect(wrapper.find('[data-testid="pipeline-stages"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="stage-0"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="stage-5"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="stage-6"]').exists()).toBe(false);

            expect(wrapper.find('[data-testid="stage-0"]').attributes('data-status')).toBe('active');
            expect(wrapper.find('[data-testid="stage-1"]').attributes('data-status')).toBe('pending');

            expect(wrapper.find('[data-testid="stage-0"]').text()).toContain('1. Auth Token Injection');
            expect(wrapper.find('[data-testid="stage-1"]').text()).toContain('2. Loading State Start');
            expect(wrapper.find('[data-testid="stage-2"]').text()).toContain('3. Request Transform');
            expect(wrapper.find('[data-testid="stage-3"]').text()).toContain('4. Network Call');
            expect(wrapper.find('[data-testid="stage-4"]').text()).toContain('5. Response Transform');
            expect(wrapper.find('[data-testid="stage-5"]').text()).toContain('6. Loading State Stop');
        });

        it('should show auth token injection, BEFORE/AFTER labels, and status badges', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-success"]').trigger('click');
            await nextTick();

            const beforeEl = wrapper.find('[data-testid="stage-0-before"]');
            const afterEl = wrapper.find('[data-testid="stage-0-after"]');
            expect(beforeEl.text()).toContain('Accept');
            expect(afterEl.text()).toContain('Bearer eyJhbGciOi...');

            const stageData = wrapper.find('[data-testid="stage-0-data"]');
            expect(stageData.text()).toContain('BEFORE');
            expect(stageData.text()).toContain('AFTER');

            expect(wrapper.find('[data-testid="stage-0-badge"]').text()).toBe('ACTIVE');
            expect(wrapper.find('[data-testid="stage-1-badge"]').text()).toBe('PENDING');
            expect(wrapper.find('[data-testid="stage-5-badge"]').text()).toBe('PENDING');
        });

        it('should show request body in network call and descriptions for pending vs active', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-success"]').trigger('click');
            await nextTick();

            const beforeEl = wrapper.find('[data-testid="stage-3-before"]');
            expect(beforeEl.text()).toContain('POST');
            expect(beforeEl.text()).toContain('/api/minifigs');
            expect(beforeEl.text()).toContain('display_name');

            expect(wrapper.find('[data-testid="stage-3"]').text()).toContain('returns 200 with the created resource');

            expect(wrapper.find('[data-testid="stage-0"]').text()).toContain(
                'Request middleware injects the auth token',
            );
            expect(wrapper.find('[data-testid="stage-1"]').text()).toContain('Loading middleware increments');
        });

        it('should advance stages through the pipeline with timer and show loading state', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-success"]').trigger('click');
            await nextTick();

            expect(wrapper.find('[data-testid="stage-0"]').attributes('data-status')).toBe('active');

            await vi.advanceTimersByTimeAsync(600);
            await nextTick();

            expect(wrapper.find('[data-testid="stage-0"]').attributes('data-status')).toBe('done');
            expect(wrapper.find('[data-testid="stage-0-badge"]').text()).toBe('DONE');
            expect(wrapper.find('[data-testid="stage-1"]').attributes('data-status')).toBe('active');

            const beforeEl = wrapper.find('[data-testid="stage-1-before"]');
            const afterEl = wrapper.find('[data-testid="stage-1-after"]');
            expect(beforeEl.text()).toContain('"isLoading": false');
            expect(afterEl.text()).toContain('"isLoading": true');

            // First stage has connector arrow
            const stage0 = wrapper.find('[data-testid="stage-0"]');
            const ariaHiddenDivs = stage0.findAll('[aria-hidden]');
            expect(ariaHiddenDivs.length).toBeGreaterThan(0);
        });

        it('should show camelCase to snake_case request transform', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-success"]').trigger('click');
            await nextTick();
            await vi.advanceTimersByTimeAsync(600);
            await nextTick();
            await vi.advanceTimersByTimeAsync(600);
            await nextTick();
            await vi.advanceTimersByTimeAsync(600);
            await nextTick();

            const beforeEl = wrapper.find('[data-testid="stage-2-before"]');
            const afterEl = wrapper.find('[data-testid="stage-2-after"]');

            expect(beforeEl.text()).toContain('displayName');
            expect(afterEl.text()).toContain('display_name');
        });

        it('should complete all stages showing transforms, loading stop, and Complete label', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-success"]').trigger('click');
            await nextTick();
            await advanceAllStages(6);

            const label = wrapper.find('[data-testid="active-scenario-label"]');
            expect(label.text()).toContain('Complete');
            expect(label.text()).not.toContain('Running...');

            for (let i = 0; i < 6; i++) {
                expect(wrapper.find(`[data-testid="stage-${i}"]`).attributes('data-status')).toBe('done');
            }

            // Response transform (snake_case -> camelCase)
            const rtBefore = wrapper.find('[data-testid="stage-4-before"]');
            const rtAfter = wrapper.find('[data-testid="stage-4-after"]');
            expect(rtBefore.text()).toContain('created_at');
            expect(rtAfter.text()).toContain('createdAt');

            // Network call response
            const netAfter = wrapper.find('[data-testid="stage-3-after"]');
            expect(netAfter.text()).toContain('"status": 200');

            // Loading state stop
            const lsBefore = wrapper.find('[data-testid="stage-5-before"]');
            const lsAfter = wrapper.find('[data-testid="stage-5-after"]');
            expect(lsBefore.text()).toContain('"isLoading": true');
            expect(lsAfter.text()).toContain('"isLoading": false');

            // Last stage has no connector arrow
            const stage5 = wrapper.find('[data-testid="stage-5"]');
            const ariaHiddenDivs = stage5.findAll('[aria-hidden]');
            expect(ariaHiddenDivs.length).toBe(0);
        });
    });

    describe('auth error scenario', () => {
        it('should show active scenario label, 6 stages, and network description', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-auth-error"]').trigger('click');
            await nextTick();

            const label = wrapper.find('[data-testid="active-scenario-label"]');
            expect(label.text()).toContain('401 Auth Error');

            expect(wrapper.find('[data-testid="stage-5"]').exists()).toBe(true);
            expect(wrapper.find('[data-testid="stage-6"]').exists()).toBe(false);

            expect(wrapper.find('[data-testid="stage-3"]').text()).toContain('401 Unauthenticated');
        });

        it('should show 401 in network response and error handling with redirect to login', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-auth-error"]').trigger('click');
            await nextTick();
            await advanceAllStages(6);

            const netAfter = wrapper.find('[data-testid="stage-3-after"]');
            expect(netAfter.text()).toContain('"status": 401');

            const stage5 = wrapper.find('[data-testid="stage-5"]');
            expect(stage5.text()).toContain('Error Handling (401)');
            expect(stage5.attributes('data-status')).toBe('error');

            const afterEl = wrapper.find('[data-testid="stage-5-after"]');
            expect(afterEl.text()).toContain('/login');
            expect(afterEl.text()).toContain('"user": null');

            expect(wrapper.find('[data-testid="stage-5-badge"]').text()).toBe('ERROR');
        });
    });

    describe('validation error scenario', () => {
        it('should show active scenario label and network description', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-validation-error"]').trigger('click');
            await nextTick();

            const label = wrapper.find('[data-testid="active-scenario-label"]');
            expect(label.text()).toContain('422 Validation Error');

            expect(wrapper.find('[data-testid="stage-3"]').text()).toContain('422 and field-level validation errors');
        });

        it('should show 422 response and error handling with field errors', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-validation-error"]').trigger('click');
            await nextTick();
            await advanceAllStages(6);

            const netAfter = wrapper.find('[data-testid="stage-3-after"]');
            expect(netAfter.text()).toContain('"status": 422');

            const stage5 = wrapper.find('[data-testid="stage-5"]');
            expect(stage5.text()).toContain('Error Handling (422)');
            expect(stage5.attributes('data-status')).toBe('error');

            const afterEl = wrapper.find('[data-testid="stage-5-after"]');
            expect(afterEl.text()).toContain('displayName');
            expect(afterEl.text()).toContain('partCount');

            const beforeEl = wrapper.find('[data-testid="stage-5-before"]');
            expect(beforeEl.text()).toContain('The given data was invalid.');
            expect(beforeEl.text()).toContain('display_name');
        });
    });

    describe('network error scenario', () => {
        it('should show active scenario label and network description', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-network-error"]').trigger('click');
            await nextTick();

            const label = wrapper.find('[data-testid="active-scenario-label"]');
            expect(label.text()).toContain('Network Error');

            expect(wrapper.find('[data-testid="stage-3"]').text()).toContain('connection refused or timeout');
        });

        it('should show network error in response and error handling stage', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-network-error"]').trigger('click');
            await nextTick();
            await advanceAllStages(6);

            const netAfter = wrapper.find('[data-testid="stage-3-after"]');
            expect(netAfter.text()).toContain('ERR_NETWORK');

            const stage5 = wrapper.find('[data-testid="stage-5"]');
            expect(stage5.text()).toContain('Error Handling (Network)');
            expect(stage5.attributes('data-status')).toBe('error');

            const afterEl = wrapper.find('[data-testid="stage-5-after"]');
            expect(afterEl.text()).toContain('Network Error');
            expect(afterEl.text()).toContain('check your connection');
        });
    });

    describe('interactive controls', () => {
        it('should disable scenario and reset buttons while pipeline is running', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-success"]').trigger('click');
            await nextTick();

            const successBtn = wrapper
                .findAllComponents({name: 'PrimaryButton'})
                .find((b) => b.text() === '200 Success');
            expect(successBtn?.props('disabled')).toBe(true);

            const authBtn = wrapper
                .findAllComponents({name: 'DangerButton'})
                .find((b) => b.text() === '401 Auth Error');
            expect(authBtn?.props('disabled')).toBe(true);

            const resetBtn = wrapper.findAllComponents({name: 'PrimaryButton'}).find((b) => b.text() === 'Reset');
            expect(resetBtn?.props('disabled')).toBe(true);
        });

        it('should enable buttons after pipeline completes', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-success"]').trigger('click');
            await nextTick();
            await advanceAllStages(6);

            const successBtn = wrapper
                .findAllComponents({name: 'PrimaryButton'})
                .find((b) => b.text() === '200 Success');
            expect(successBtn?.props('disabled')).toBe(false);

            // Reset button is visible
            const resetBtn = wrapper.find('[data-testid="reset-pipeline"]');
            expect(resetBtn.exists()).toBe(true);
            const style = resetBtn.attributes('style') ?? '';
            expect(style).not.toContain('display: none');
        });

        it('should reset the pipeline to initial state', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-success"]').trigger('click');
            await nextTick();
            await advanceAllStages(6);

            await wrapper.find('[data-testid="reset-pipeline"]').trigger('click');
            await nextTick();

            expect(wrapper.find('[data-testid="active-scenario-label"]').attributes('style')).toContain(
                'display: none',
            );
            expect(wrapper.find('[data-testid="pipeline-stages"]').exists()).toBe(false);
        });

        it('should allow running a different scenario after completion', async () => {
            const wrapper = shallowMount(MiddlewarePipelineVisualizer, {global: {stubs}});

            await wrapper.find('[data-testid="scenario-success"]').trigger('click');
            await nextTick();
            await advanceAllStages(6);

            await wrapper.find('[data-testid="scenario-auth-error"]').trigger('click');
            await nextTick();

            const label = wrapper.find('[data-testid="active-scenario-label"]');
            expect(label.text()).toContain('401 Auth Error');
        });
    });
});
