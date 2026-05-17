import SettingsPage from '@app/domains/settings/pages/SettingsPage.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {
    createMockAxiosWithError,
    MockAxiosError,
    createMockFsHelpers,
    createMockStringTs,
    createMockFamilyServices,
    createMockFormField,
    createMockFormLabel,
    createMockFormError,
} = await vi.hoisted(() => import('../../../../../../helpers'));

vi.mock('@shared/components/forms/FormError.vue', () => createMockFormError());
vi.mock('@shared/components/forms/FormField.vue', () => createMockFormField());
vi.mock('@shared/components/forms/FormLabel.vue', () => createMockFormLabel());

vi.mock('axios', () => createMockAxiosWithError());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());

const {mockGetRequest, mockPostRequest, mockUserId, mockRegisterResponseErrorMiddleware} = vi.hoisted(() => ({
    mockGetRequest: vi.fn<(url: string) => Promise<unknown>>(),
    mockPostRequest: vi.fn<(url: string, body: unknown) => Promise<unknown>>(),
    mockUserId: vi.fn<() => number>(),
    mockRegisterResponseErrorMiddleware: vi.fn<(handler: (error: unknown) => void) => () => void>(),
}));

vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {
            getRequest: mockGetRequest,
            postRequest: mockPostRequest,
            registerResponseErrorMiddleware: mockRegisterResponseErrorMiddleware,
        },
        familyAuthService: {isLoggedIn: {value: true}, userId: mockUserId},
    }),
);

const membersData = [{id: 1, name: 'Jan', email: 'jan@example.com', isHead: true}];
const inviteCodeOld = {id: 10, code: 'OLD-CODE', expiresAt: '2026-04-01T00:00:00Z', createdAt: '2026-03-25T00:00:00Z'};
const inviteCodeNew = {id: 11, code: 'NEW-CODE', expiresAt: '2026-04-08T00:00:00Z', createdAt: '2026-04-01T00:00:00Z'};

const mockMembersAndInviteCode = (code = inviteCodeOld) => {
    mockGetRequest.mockImplementation((url: string) => {
        if (url === '/family/members') return Promise.resolve({data: membersData});
        if (url === '/family/invite-code') return Promise.resolve({data: code});
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
};

const findEmailInput = (wrapper: ReturnType<typeof shallowMount>) =>
    wrapper.findAllComponents(TextInput).find((i) => i.props('label') === 'settings.recipientEmail');

const findNameInput = (wrapper: ReturnType<typeof shallowMount>) =>
    wrapper.findAllComponents(TextInput).find((i) => i.props('label') === 'settings.recipientName');

const findSendButton = (wrapper: ReturnType<typeof shallowMount>) =>
    wrapper.findAllComponents(PrimaryButton).find((b) => b.text() === 'settings.sendInviteByEmail');

describe('SettingsPage — invite by email', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserId.mockReturnValue(1);
        mockMembersAndInviteCode();
        mockRegisterResponseErrorMiddleware.mockImplementation(() => vi.fn<() => void>());
    });

    it('should render send-by-email form for the family head', async () => {
        // Arrange & Act
        const wrapper = shallowMount(SettingsPage);
        await flushPromises();

        // Assert
        expect(findEmailInput(wrapper)?.exists()).toBe(true);
        expect(findEmailInput(wrapper)?.props('type')).toBe('email');
        expect(findNameInput(wrapper)?.exists()).toBe(true);
        expect(findNameInput(wrapper)?.props('optional')).toBe(true);
        expect(findSendButton(wrapper)?.exists()).toBe(true);
    });

    it('should not render the form for non-head members', async () => {
        // Arrange
        mockUserId.mockReturnValue(2);

        // Act
        const wrapper = shallowMount(SettingsPage);
        await flushPromises();

        // Assert
        expect(findEmailInput(wrapper)).toBeUndefined();
        expect(findSendButton(wrapper)).toBeUndefined();
    });

    it('should render the form even when no active invite code exists', async () => {
        // Arrange
        mockGetRequest.mockImplementation((url: string) => {
            if (url === '/family/members') return Promise.resolve({data: membersData});
            if (url === '/family/invite-code') {
                const error = new MockAxiosError('Not Found');
                error.response = {status: 404, data: null, statusText: 'Not Found', headers: {}, config: {}};
                return Promise.reject(error);
            }
            return Promise.reject(new Error(`Unexpected GET: ${url}`));
        });

        // Act
        const wrapper = shallowMount(SettingsPage);
        await flushPromises();

        // Assert
        expect(findEmailInput(wrapper)?.exists()).toBe(true);
        expect(findSendButton(wrapper)?.exists()).toBe(true);
    });

    it('should POST to /family/invite-code/email with email and name on submit', async () => {
        // Arrange
        mockPostRequest.mockResolvedValue({data: inviteCodeNew});
        const wrapper = shallowMount(SettingsPage);
        await flushPromises();

        await findEmailInput(wrapper)?.setValue('friend@example.com');
        await findNameInput(wrapper)?.setValue('Friendly Friend');

        // Act
        const [emailForm] = wrapper.findAll('form');
        await emailForm?.trigger('submit');
        await flushPromises();

        // Assert
        expect(mockPostRequest).toHaveBeenCalledWith('/family/invite-code/email', {
            recipientEmail: 'friend@example.com',
            recipientName: 'Friendly Friend',
        });
    });

    it('should POST without recipientName when the name field is empty', async () => {
        // Arrange
        mockPostRequest.mockResolvedValue({data: inviteCodeNew});
        const wrapper = shallowMount(SettingsPage);
        await flushPromises();

        await findEmailInput(wrapper)?.setValue('friend@example.com');

        // Act
        const [emailForm] = wrapper.findAll('form');
        await emailForm?.trigger('submit');
        await flushPromises();

        // Assert
        expect(mockPostRequest).toHaveBeenCalledWith('/family/invite-code/email', {
            recipientEmail: 'friend@example.com',
        });
    });

    it('should rotate the displayed code and show success line on happy path', async () => {
        // Arrange
        mockPostRequest.mockResolvedValue({data: inviteCodeNew});
        const wrapper = shallowMount(SettingsPage);
        await flushPromises();
        // Sanity — old code is on the page first
        expect(wrapper.text()).toContain('OLD-CODE');

        await findEmailInput(wrapper)?.setValue('friend@example.com');

        // Act
        const [emailForm] = wrapper.findAll('form');
        await emailForm?.trigger('submit');
        await flushPromises();

        // Assert — code rotated, success line shown, inputs cleared
        expect(wrapper.text()).toContain('NEW-CODE');
        expect(wrapper.text()).not.toContain('OLD-CODE');
        expect(wrapper.text()).toContain('settings.inviteEmailSent');
        expect(findEmailInput(wrapper)?.props('modelValue')).toBe('');
        expect(findNameInput(wrapper)?.props('modelValue')).toBe('');
    });

    it('should show the rate-limited message on 429', async () => {
        // Arrange
        const axiosError = new MockAxiosError('Too Many Requests');
        axiosError.response = {status: 429, data: null, statusText: 'Too Many Requests', headers: {}, config: {}};
        mockPostRequest.mockRejectedValue(axiosError);
        const wrapper = shallowMount(SettingsPage);
        await flushPromises();
        await findEmailInput(wrapper)?.setValue('friend@example.com');

        // Act
        const [emailForm] = wrapper.findAll('form');
        await emailForm?.trigger('submit');
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('settings.inviteEmailRateLimited');
        expect(wrapper.text()).not.toContain('settings.inviteEmailSent');
    });

    it('should show the generic error line on 500 / network failure', async () => {
        // Arrange
        mockPostRequest.mockRejectedValue(new Error('Network error'));
        const wrapper = shallowMount(SettingsPage);
        await flushPromises();
        await findEmailInput(wrapper)?.setValue('friend@example.com');

        // Act
        const [emailForm] = wrapper.findAll('form');
        await emailForm?.trigger('submit');
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('settings.inviteEmailError');
        expect(wrapper.text()).not.toContain('settings.inviteEmailRateLimited');
        expect(wrapper.text()).not.toContain('settings.inviteEmailSent');
    });

    it('should not surface inline error or success on 422 (handled by validation middleware)', async () => {
        // Arrange — 422 throws so handleSubmit can swallow it; the validation middleware
        // (mocked here as a no-op) is the production path that populates field errors.
        const axiosError = new MockAxiosError('Unprocessable Entity');
        axiosError.response = {status: 422, data: null, statusText: 'Unprocessable Entity', headers: {}, config: {}};
        mockPostRequest.mockRejectedValue(axiosError);
        const wrapper = shallowMount(SettingsPage);
        await flushPromises();
        await findEmailInput(wrapper)?.setValue('not-an-email');

        // Act
        const [emailForm] = wrapper.findAll('form');
        await emailForm?.trigger('submit');
        await flushPromises();

        // Assert — inline lines stay quiet; field errors come from the registered middleware
        expect(wrapper.text()).not.toContain('settings.inviteEmailError');
        expect(wrapper.text()).not.toContain('settings.inviteEmailRateLimited');
        expect(wrapper.text()).not.toContain('settings.inviteEmailSent');
    });

    it('should register a response-error middleware so 422 field errors flow through useValidationErrors', () => {
        // Arrange & Act
        shallowMount(SettingsPage);

        // Assert — the composable subscribes; the rest of useValidationErrors is covered by its own tests.
        expect(mockRegisterResponseErrorMiddleware).toHaveBeenCalled();
    });
});
