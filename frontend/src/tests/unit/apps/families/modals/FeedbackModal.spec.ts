import type {VueWrapper} from '@vue/test-utils';

import FeedbackModal from '@app/modals/FeedbackModal.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

/** Emit an event from a stub component looked up by name. */
const emitFrom = (wrapper: VueWrapper | undefined, event: string): void => {
    wrapper?.vm.$emit(event);
};

// Child components are referenced via `findComponent({name: 'X'})` rather than
// imported at the module top — every `vi.mock` factory below registers a `name`
// for the stub. Dropping the static imports keeps the collect-phase dependency
// graph shallow (ADR-0012).

const {createMockAxiosWithError, createMockFsHelpers, createMockStringTs, createMockFamilyServices, MockAxiosError} =
    await vi.hoisted(() => import('../../../../helpers'));

vi.mock('@phosphor-icons/vue', () => ({PhPaperclip: {template: '<i />'}, PhX: {template: '<i />'}}));

vi.mock('axios', () => createMockAxiosWithError());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());

vi.mock('@shared/components/ModalDialog.vue', () => ({
    default: {name: 'ModalDialog', props: ['open'], template: '<div><slot name="title" /><slot /></div>'},
}));

vi.mock('@shared/components/forms/inputs/TextInput.vue', () => ({
    default: {
        name: 'TextInput',
        template: '<input @input=\'$emit("update:modelValue", $event.target.value)\' />',
        props: ['modelValue', 'label', 'error'],
    },
}));

vi.mock('@shared/components/forms/inputs/TextareaInput.vue', () => ({
    default: {
        name: 'TextareaInput',
        template: '<textarea @input=\'$emit("update:modelValue", $event.target.value)\' />',
        props: ['modelValue', 'label', 'rows', 'error'],
    },
}));

vi.mock('@shared/components/PrimaryButton.vue', () => ({
    default: {name: 'PrimaryButton', props: ['disabled'], template: '<button :disabled="disabled"><slot /></button>'},
}));

const {mockPostRequest, mockToastShow, capturedErrorMiddleware} = vi.hoisted(() => ({
    mockPostRequest: vi.fn<() => Promise<unknown>>(),
    mockToastShow: vi.fn<(props: {message: string; variant?: 'success' | 'error'}) => string>(() => 'toast-mock'),
    capturedErrorMiddleware: {current: undefined as ((error: unknown) => void) | undefined},
}));

vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {
            postRequest: mockPostRequest,
            registerResponseErrorMiddleware: vi.fn<(middleware: (error: unknown) => void) => () => void>(
                (middleware) => {
                    capturedErrorMiddleware.current = middleware;
                    return vi.fn<() => void>();
                },
            ),
        },
        familyToastService: {show: mockToastShow},
    }),
);

const makeValidationError = (status: number, errors?: Record<string, string[]>) => {
    const error = new MockAxiosError('Request failed');
    error.response = {status, data: {errors}, statusText: '', headers: {}, config: {}};
    return error;
};

const rejectWithValidationError = (validationError: InstanceType<typeof MockAxiosError>) => {
    mockPostRequest.mockImplementationOnce(() => {
        capturedErrorMiddleware.current?.(validationError);
        return Promise.reject(validationError);
    });
};

const makeFile = (name: string) => new File(['screenshot-bytes'], name, {type: 'image/png'});

// shallowMount with the vi.mock'd children unstubbed by name — the module
// mocks above are already light, and unstubbing lets the ModalDialog stub
// render its title/default slots so the form is reachable.
const mountModal = () =>
    shallowMount(FeedbackModal, {
        props: {open: true},
        global: {stubs: {ModalDialog: false, TextInput: false, TextareaInput: false, PrimaryButton: false}},
    });

type ModalWrapper = ReturnType<typeof mountModal>;

const selectFiles = async (wrapper: ModalWrapper, files: File[] | null) => {
    const input = wrapper.find<HTMLInputElement>('input[type="file"]');
    Object.defineProperty(input.element, 'files', {value: files, configurable: true});
    await input.trigger('change');
};

const fillRequiredFields = async (wrapper: ModalWrapper) => {
    await wrapper.findComponent({name: 'TextInput'}).setValue('Broken drawer');
    await wrapper.findComponent({name: 'TextareaInput'}).setValue('The drawer view crashes');
};

const submitForm = async (wrapper: ModalWrapper) => {
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();
};

describe('FeedbackModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        capturedErrorMiddleware.current = undefined;
        mockPostRequest.mockResolvedValue({data: {id: 42}});
    });

    it('should render the modal dialog with the open prop and title', () => {
        // Arrange & Act
        const wrapper = mountModal();

        // Assert
        expect(wrapper.findComponent({name: 'ModalDialog'}).props('open')).toBe(true);
        expect(wrapper.text()).toContain('feedback.title');
    });

    it('should emit close when the modal dialog closes', () => {
        // Arrange
        const wrapper = mountModal();

        // Act
        emitFrom(wrapper.findComponent({name: 'ModalDialog'}), 'close');

        // Assert
        expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('should submit title and description as FormData with exact field names', async () => {
        // Arrange
        const wrapper = mountModal();
        await fillRequiredFields(wrapper);

        // Act
        await submitForm(wrapper);

        // Assert — FormData bypasses the snake_case request middleware (ADR-0029),
        // so the field names must match the backend FormRequest exactly.
        expect(mockPostRequest).toHaveBeenCalledTimes(1);
        const [url, payload] = mockPostRequest.mock.calls[0] as unknown as [string, FormData];
        expect(url).toBe('/feedback');
        expect(payload).toBeInstanceOf(FormData);
        expect(payload.get('title')).toBe('Broken drawer');
        expect(payload.get('description')).toBe('The drawer view crashes');
        expect(payload.getAll('screenshots[]')).toHaveLength(0);
    });

    it('should append selected screenshots as screenshots[] parts', async () => {
        // Arrange
        const wrapper = mountModal();
        await fillRequiredFields(wrapper);
        await selectFiles(wrapper, [makeFile('one.png'), makeFile('two.png')]);

        // Act
        await submitForm(wrapper);

        // Assert
        const [, payload] = mockPostRequest.mock.calls[0] as unknown as [string, FormData];
        expect(payload.getAll('screenshots[]')).toHaveLength(2);
    });

    it('should list selected screenshot names', async () => {
        // Arrange
        const wrapper = mountModal();

        // Act
        await selectFiles(wrapper, [makeFile('one.png'), makeFile('two.png')]);

        // Assert
        const list = wrapper.find('[data-testid="feedback-screenshot-list"]');
        expect(list.exists()).toBe(true);
        expect(list.text()).toContain('one.png');
        expect(list.text()).toContain('two.png');
    });

    it('should cap the selection at five screenshots', async () => {
        // Arrange
        const wrapper = mountModal();
        const files = ['one', 'two', 'three', 'four', 'five', 'six'].map((name) => makeFile(`${name}.png`));

        // Act
        await selectFiles(wrapper, files);

        // Assert
        expect(wrapper.findAll('[data-testid="feedback-screenshot-list"] li')).toHaveLength(5);
        expect(wrapper.text()).not.toContain('six.png');
    });

    it('should clear the selection when the file input reports no files', async () => {
        // Arrange
        const wrapper = mountModal();
        await selectFiles(wrapper, [makeFile('one.png')]);

        // Act
        await selectFiles(wrapper, null);

        // Assert
        expect(wrapper.find('[data-testid="feedback-screenshot-list"]').exists()).toBe(false);
    });

    it('should remove a single screenshot and keep the rest', async () => {
        // Arrange
        const wrapper = mountModal();
        await selectFiles(wrapper, [makeFile('one.png'), makeFile('two.png')]);

        // Act
        await wrapper.find('[data-testid="feedback-screenshot-list"] li button').trigger('click');

        // Assert
        const list = wrapper.find('[data-testid="feedback-screenshot-list"]');
        expect(list.text()).not.toContain('one.png');
        expect(list.text()).toContain('two.png');
    });

    it('should hide the list when the last screenshot is removed', async () => {
        // Arrange
        const wrapper = mountModal();
        await selectFiles(wrapper, [makeFile('one.png')]);

        // Act
        await wrapper.find('[data-testid="feedback-screenshot-list"] li button').trigger('click');

        // Assert
        expect(wrapper.find('[data-testid="feedback-screenshot-list"]').exists()).toBe(false);
    });

    it('should show a success toast, reset the form and close on a successful submit', async () => {
        // Arrange
        const wrapper = mountModal();
        await fillRequiredFields(wrapper);
        await selectFiles(wrapper, [makeFile('one.png')]);

        // Act
        await submitForm(wrapper);

        // Assert
        expect(mockToastShow).toHaveBeenCalledWith({message: 'feedback.success', variant: 'success'});
        expect(wrapper.emitted('close')).toHaveLength(1);
        expect(wrapper.findComponent({name: 'TextInput'}).props('modelValue')).toBe('');
        expect(wrapper.findComponent({name: 'TextareaInput'}).props('modelValue')).toBe('');
        expect(wrapper.find('[data-testid="feedback-screenshot-list"]').exists()).toBe(false);
    });

    it('should show a failure toast and stay open when the relay fails', async () => {
        // Arrange
        const wrapper = mountModal();
        await fillRequiredFields(wrapper);
        mockPostRequest.mockRejectedValueOnce(makeValidationError(502));

        // Act
        await submitForm(wrapper);

        // Assert
        expect(mockToastShow).toHaveBeenCalledWith({message: 'feedback.error', variant: 'error'});
        expect(wrapper.emitted('close')).toBeUndefined();
        expect(wrapper.findComponent({name: 'TextInput'}).props('modelValue')).toBe('Broken drawer');
    });

    it('should show a failure toast when an axios error carries no response', async () => {
        // Arrange
        const wrapper = mountModal();
        await fillRequiredFields(wrapper);
        mockPostRequest.mockRejectedValueOnce(new MockAxiosError('network down'));

        // Act
        await submitForm(wrapper);

        // Assert
        expect(mockToastShow).toHaveBeenCalledWith({message: 'feedback.error', variant: 'error'});
    });

    it('should show a failure toast for non-axios errors', async () => {
        // Arrange
        const wrapper = mountModal();
        await fillRequiredFields(wrapper);
        mockPostRequest.mockRejectedValueOnce(new Error('boom'));

        // Act
        await submitForm(wrapper);

        // Assert
        expect(mockToastShow).toHaveBeenCalledWith({message: 'feedback.error', variant: 'error'});
    });

    it('should surface 422 field errors on the title and description inputs without a toast', async () => {
        // Arrange
        const wrapper = mountModal();
        await fillRequiredFields(wrapper);
        rejectWithValidationError(
            makeValidationError(422, {
                title: ['The title field is required.'],
                description: ['The description field is required.'],
            }),
        );

        // Act
        await submitForm(wrapper);

        // Assert
        expect(mockToastShow).not.toHaveBeenCalled();
        expect(wrapper.emitted('close')).toBeUndefined();
        expect(wrapper.findComponent({name: 'TextInput'}).props('error')).toBe('The title field is required.');
        expect(wrapper.findComponent({name: 'TextareaInput'}).props('error')).toBe(
            'The description field is required.',
        );
    });

    it('should surface a per-file 422 error on the screenshots input', async () => {
        // Arrange
        const wrapper = mountModal();
        await fillRequiredFields(wrapper);
        rejectWithValidationError(
            makeValidationError(422, {'screenshots.0': ['The screenshot may not be greater than 3072 kilobytes.']}),
        );

        // Act
        await submitForm(wrapper);

        // Assert
        expect(wrapper.text()).toContain('The screenshot may not be greater than 3072 kilobytes.');
    });

    it('should join all screenshots errors into the single error display', async () => {
        // Arrange — the files share one control, so array-level and per-file
        // errors must all surface at once, not one resubmit at a time.
        const wrapper = mountModal();
        await fillRequiredFields(wrapper);
        rejectWithValidationError(
            makeValidationError(422, {
                screenshots: ['The screenshots field must not have more than 5 items.'],
                'screenshots.0': ['The screenshot may not be greater than 3072 kilobytes.'],
                'screenshots.1': ['The screenshot must be an image.'],
            }),
        );

        // Act
        await submitForm(wrapper);

        // Assert
        const alert = wrapper.find('[role="alert"]');
        expect(alert.text()).toContain('The screenshots field must not have more than 5 items.');
        expect(alert.text()).toContain('The screenshot may not be greater than 3072 kilobytes.');
        expect(alert.text()).toContain('The screenshot must be an image.');
    });

    it('should not surface a screenshots error when the validation payload carries an empty message list', async () => {
        // Arrange
        const wrapper = mountModal();
        await fillRequiredFields(wrapper);
        rejectWithValidationError(makeValidationError(422, {screenshots: []}));

        // Act
        await submitForm(wrapper);

        // Assert
        expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    });

    it('should disable the submit button while submitting', async () => {
        // Arrange
        const wrapper = mountModal();
        await fillRequiredFields(wrapper);
        let resolveRequest: (value: unknown) => void = () => undefined;
        mockPostRequest.mockImplementationOnce(
            () =>
                new Promise((resolve) => {
                    resolveRequest = resolve;
                }),
        );

        // Act
        await wrapper.find('form').trigger('submit.prevent');
        await wrapper.vm.$nextTick();

        // Assert
        expect(wrapper.findComponent({name: 'PrimaryButton'}).props('disabled')).toBe(true);

        // Cleanup — settle the pending submit
        resolveRequest({data: {id: 1}});
        await flushPromises();
        expect(wrapper.findComponent({name: 'PrimaryButton'}).props('disabled')).toBe(false);
    });
});
