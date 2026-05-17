import SettingsPage from '@app/domains/settings/pages/SettingsPage.vue';
import TextInput from '@shared/components/forms/inputs/TextInput.vue';
import PageHeader from '@shared/components/PageHeader.vue';
import PrimaryButton from '@shared/components/PrimaryButton.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

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

const {mockGetRequest, mockPutRequest, mockPostRequest, mockUserId} = vi.hoisted(() => ({
    mockGetRequest: vi.fn<(url: string) => Promise<unknown>>(),
    mockPutRequest: vi.fn<() => Promise<unknown>>(),
    mockPostRequest: vi.fn<() => Promise<unknown>>(),
    mockUserId: vi.fn<() => number>(),
}));

vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {getRequest: mockGetRequest, postRequest: mockPostRequest, putRequest: mockPutRequest},
        familyAuthService: {isLoggedIn: {value: true}, userId: mockUserId},
    }),
);

const mockMembersAndNoInviteCode = () => {
    mockGetRequest.mockImplementation((url: string) => {
        if (url === '/family/members') {
            return Promise.resolve({data: [{id: 1, name: 'Jan', email: 'jan@example.com', isHead: true}]});
        }
        if (url === '/family/invite-code') {
            const error = new MockAxiosError('Not Found');
            error.response = {status: 404, data: null, statusText: 'Not Found', headers: {}, config: {}};
            return Promise.reject(error);
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
};

describe('SettingsPage — config', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserId.mockReturnValue(1);
        mockMembersAndNoInviteCode();
    });

    it('should render page header with title', () => {
        // Arrange & Act
        const wrapper = shallowMount(SettingsPage);

        // Assert
        expect(wrapper.findComponent(PageHeader).props('title')).toBe('settings.title');
    });

    it('should render rebrickable token input', () => {
        // Arrange & Act
        const wrapper = shallowMount(SettingsPage);

        // Assert
        const input = wrapper.findComponent(TextInput);
        expect(input.exists()).toBe(true);
        expect(input.props('label')).toBe('settings.rebrickableToken');
    });

    it('should render save token button', () => {
        // Arrange & Act
        const wrapper = shallowMount(SettingsPage);

        // Assert
        const saveButton = wrapper.findAllComponents(PrimaryButton).find((btn) => btn.text() === 'settings.saveToken');
        expect(saveButton?.exists()).toBe(true);
    });

    it('should render import button', () => {
        // Arrange & Act
        const wrapper = shallowMount(SettingsPage);

        // Assert
        const importButton = wrapper
            .findAllComponents(PrimaryButton)
            .find((btn) => btn.text() === 'settings.importButton');
        expect(importButton?.exists()).toBe(true);
    });

    describe('save token', () => {
        const findTokenInput = (wrapper: ReturnType<typeof shallowMount>) =>
            wrapper.findAllComponents(TextInput).find((i) => i.props('label') === 'settings.rebrickableToken');

        it('should save token via PUT request', async () => {
            // Arrange
            mockPutRequest.mockResolvedValue({});
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();
            await findTokenInput(wrapper)?.setValue('my-secret-token');

            // Act
            const allForms = wrapper.findAll('form');
            const [, tokenForm] = allForms;
            await tokenForm?.trigger('submit');
            await flushPromises();

            // Assert
            expect(mockPutRequest).toHaveBeenCalledWith('/family/rebrickable-token', {
                rebrickableUserToken: 'my-secret-token',
            });
        });

        it('should show success message after saving', async () => {
            // Arrange
            mockPutRequest.mockResolvedValue({});
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();
            await findTokenInput(wrapper)?.setValue('my-secret-token');

            // Act
            const allForms = wrapper.findAll('form');
            const [, tokenForm] = allForms;
            await tokenForm?.trigger('submit');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.tokenSaved');
        });

        it('should clear token input after saving', async () => {
            // Arrange
            mockPutRequest.mockResolvedValue({});
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();
            await findTokenInput(wrapper)?.setValue('my-secret-token');

            // Act
            const allForms = wrapper.findAll('form');
            const [, tokenForm] = allForms;
            await tokenForm?.trigger('submit');
            await flushPromises();

            // Assert
            expect(findTokenInput(wrapper)?.props('modelValue')).toBe('');
        });

        it('should show error when not family head (403)', async () => {
            // Arrange
            const axiosError = new MockAxiosError('Forbidden');
            axiosError.response = {status: 403, data: null, statusText: 'Forbidden', headers: {}, config: {}};
            mockPutRequest.mockRejectedValue(axiosError);
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();
            await findTokenInput(wrapper)?.setValue('my-secret-token');

            // Act
            const allForms = wrapper.findAll('form');
            const [, tokenForm] = allForms;
            await tokenForm?.trigger('submit');
            await flushPromises();

            // Assert
            expect(findTokenInput(wrapper)?.props('error')).toBe('settings.notFamilyHead');
        });

        it('should show generic error on failure', async () => {
            // Arrange
            mockPutRequest.mockRejectedValue(new Error('Network error'));
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();
            await findTokenInput(wrapper)?.setValue('my-secret-token');

            // Act
            const allForms = wrapper.findAll('form');
            const [, tokenForm] = allForms;
            await tokenForm?.trigger('submit');
            await flushPromises();

            // Assert
            expect(findTokenInput(wrapper)?.props('error')).toBe('settings.tokenSaveError');
        });
    });

    describe('import sets', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        const pendingJob = {
            id: 1,
            status: 'pending',
            totalSets: 0,
            processedSets: 0,
            failedSets: 0,
            failedSetDetails: null,
            startedAt: null,
            completedAt: null,
            createdAt: '2026-04-08T10:00:00Z',
        };

        const completedJob = {
            ...pendingJob,
            status: 'completed',
            totalSets: 7,
            processedSets: 7,
            failedSets: 0,
            completedAt: '2026-04-08T10:01:00Z',
        };

        const failedJob = {
            ...pendingJob,
            status: 'failed',
            totalSets: 7,
            processedSets: 5,
            failedSets: 2,
            failedSetDetails: [{setNum: '10270-1', error: 'Not found'}],
            completedAt: '2026-04-08T10:01:00Z',
        };

        it('should call import endpoint', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: pendingJob});
            const wrapper = shallowMount(SettingsPage);

            // Act
            const importButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importButton');
            await importButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(mockPostRequest).toHaveBeenCalledWith('/family-sets/import-from-rebrickable', {});
        });

        it('should poll import-status after starting import', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: pendingJob});
            mockGetRequest.mockImplementation((url: string) => {
                if (url === '/family/members') {
                    return Promise.resolve({data: [{id: 1, name: 'Jan', email: 'jan@example.com', isHead: true}]});
                }
                if (url === '/family/invite-code') {
                    const error = new MockAxiosError('Not Found');
                    error.response = {status: 404, data: null, statusText: 'Not Found', headers: {}, config: {}};
                    return Promise.reject(error);
                }
                if (url === '/family-sets/import-status') {
                    return Promise.resolve({data: completedJob});
                }
                return Promise.reject(new Error(`Unexpected GET: ${url}`));
            });
            const wrapper = shallowMount(SettingsPage);

            // Act — start import
            const importButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importButton');
            await importButton?.trigger('click');
            await flushPromises();

            // Advance timer to trigger poll
            vi.advanceTimersByTime(3000);
            await flushPromises();

            // Assert
            expect(mockGetRequest).toHaveBeenCalledWith('/family-sets/import-status');
        });

        it('should display completed import results', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: pendingJob});
            mockGetRequest.mockImplementation((url: string) => {
                if (url === '/family/members') {
                    return Promise.resolve({data: [{id: 1, name: 'Jan', email: 'jan@example.com', isHead: true}]});
                }
                if (url === '/family/invite-code') {
                    const error = new MockAxiosError('Not Found');
                    error.response = {status: 404, data: null, statusText: 'Not Found', headers: {}, config: {}};
                    return Promise.reject(error);
                }
                if (url === '/family-sets/import-status') {
                    return Promise.resolve({data: completedJob});
                }
                return Promise.reject(new Error(`Unexpected GET: ${url}`));
            });
            const wrapper = shallowMount(SettingsPage);

            // Act
            const importButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importButton');
            await importButton?.trigger('click');
            await flushPromises();

            vi.advanceTimersByTime(3000);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.importComplete');
        });

        it('should display failed import with details', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: pendingJob});
            mockGetRequest.mockImplementation((url: string) => {
                if (url === '/family/members') {
                    return Promise.resolve({data: [{id: 1, name: 'Jan', email: 'jan@example.com', isHead: true}]});
                }
                if (url === '/family/invite-code') {
                    const error = new MockAxiosError('Not Found');
                    error.response = {status: 404, data: null, statusText: 'Not Found', headers: {}, config: {}};
                    return Promise.reject(error);
                }
                if (url === '/family-sets/import-status') {
                    return Promise.resolve({data: failedJob});
                }
                return Promise.reject(new Error(`Unexpected GET: ${url}`));
            });
            const wrapper = shallowMount(SettingsPage);

            // Act
            const importButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importButton');
            await importButton?.trigger('click');
            await flushPromises();

            vi.advanceTimersByTime(3000);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.importFailed');
            expect(wrapper.text()).toContain('10270-1');
            expect(wrapper.text()).toContain('Not found');
        });

        it('should show error when not family head (403)', async () => {
            // Arrange
            const axiosError = new MockAxiosError('Forbidden');
            axiosError.response = {status: 403, data: null, statusText: 'Forbidden', headers: {}, config: {}};
            mockPostRequest.mockRejectedValue(axiosError);
            const wrapper = shallowMount(SettingsPage);

            // Act
            const importButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importButton');
            await importButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.notFamilyHead');
        });

        it('should show no token error (422)', async () => {
            // Arrange
            const axiosError = new MockAxiosError('Unprocessable Entity');
            axiosError.response = {
                status: 422,
                data: null,
                statusText: 'Unprocessable Entity',
                headers: {},
                config: {},
            };
            mockPostRequest.mockRejectedValue(axiosError);
            const wrapper = shallowMount(SettingsPage);

            // Act
            const importButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importButton');
            await importButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.noTokenConfigured');
        });

        it('should show generic error on failure', async () => {
            // Arrange
            mockPostRequest.mockRejectedValue(new Error('Network error'));
            const wrapper = shallowMount(SettingsPage);

            // Act
            const importButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importButton');
            await importButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.importError');
        });

        it('should show importing state while polling', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: pendingJob});
            const wrapper = shallowMount(SettingsPage);

            // Act
            const importButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importButton');
            await importButton?.trigger('click');
            await flushPromises();

            // Assert
            const updatedButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importing');
            expect(updatedButton?.exists()).toBe(true);
        });

        it('should show progress during polling', async () => {
            // Arrange
            const runningJob = {...pendingJob, status: 'in_progress', totalSets: 7, processedSets: 3};
            mockPostRequest.mockResolvedValue({data: pendingJob});
            mockGetRequest.mockImplementation((url: string) => {
                if (url === '/family/members') {
                    return Promise.resolve({data: [{id: 1, name: 'Jan', email: 'jan@example.com', isHead: true}]});
                }
                if (url === '/family/invite-code') {
                    const error = new MockAxiosError('Not Found');
                    error.response = {status: 404, data: null, statusText: 'Not Found', headers: {}, config: {}};
                    return Promise.reject(error);
                }
                if (url === '/family-sets/import-status') {
                    return Promise.resolve({data: runningJob});
                }
                return Promise.reject(new Error(`Unexpected GET: ${url}`));
            });
            const wrapper = shallowMount(SettingsPage);

            // Act
            const importButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importButton');
            await importButton?.trigger('click');
            await flushPromises();

            vi.advanceTimersByTime(3000);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.importProgress');
        });

        it('should stop polling and show error when poll request fails', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: pendingJob});
            let pollCallCount = 0;
            mockGetRequest.mockImplementation((url: string) => {
                if (url === '/family/members') {
                    return Promise.resolve({data: [{id: 1, name: 'Jan', email: 'jan@example.com', isHead: true}]});
                }
                if (url === '/family/invite-code') {
                    const error = new MockAxiosError('Not Found');
                    error.response = {status: 404, data: null, statusText: 'Not Found', headers: {}, config: {}};
                    return Promise.reject(error);
                }
                if (url === '/family-sets/import-status') {
                    pollCallCount++;
                    return Promise.reject(new Error('Network error'));
                }
                return Promise.reject(new Error(`Unexpected GET: ${url}`));
            });
            const wrapper = shallowMount(SettingsPage);

            // Act
            const importButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importButton');
            await importButton?.trigger('click');
            await flushPromises();

            vi.advanceTimersByTime(3000);
            await flushPromises();

            // Assert — polling stopped after error
            expect(wrapper.text()).toContain('settings.importError');
            expect(pollCallCount).toBe(1);

            // Advance more — should not poll again
            vi.advanceTimersByTime(3000);
            await flushPromises();
            expect(pollCallCount).toBe(1);
        });

        it('should stop polling on completed status', async () => {
            // Arrange
            mockPostRequest.mockResolvedValue({data: pendingJob});
            let pollCallCount = 0;
            mockGetRequest.mockImplementation((url: string) => {
                if (url === '/family/members') {
                    return Promise.resolve({data: [{id: 1, name: 'Jan', email: 'jan@example.com', isHead: true}]});
                }
                if (url === '/family/invite-code') {
                    const error = new MockAxiosError('Not Found');
                    error.response = {status: 404, data: null, statusText: 'Not Found', headers: {}, config: {}};
                    return Promise.reject(error);
                }
                if (url === '/family-sets/import-status') {
                    pollCallCount++;
                    return Promise.resolve({data: completedJob});
                }
                return Promise.reject(new Error(`Unexpected GET: ${url}`));
            });
            const wrapper = shallowMount(SettingsPage);

            // Act
            const importButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.importButton');
            await importButton?.trigger('click');
            await flushPromises();

            vi.advanceTimersByTime(3000);
            await flushPromises();

            // Advance more — should not poll again
            vi.advanceTimersByTime(3000);
            await flushPromises();

            // Assert
            expect(pollCallCount).toBe(1);
        });
    });
});
