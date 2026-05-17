import SettingsPage from '@app/domains/settings/pages/SettingsPage.vue';
import BadgeLabel from '@shared/components/BadgeLabel.vue';
import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import DangerButton from '@shared/components/DangerButton.vue';
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

const {mockGetRequest, mockPostRequest, mockDeleteRequest, mockUserId} = vi.hoisted(() => ({
    mockGetRequest: vi.fn<(url: string) => Promise<unknown>>(),
    mockPostRequest: vi.fn<() => Promise<unknown>>(),
    mockDeleteRequest: vi.fn<() => Promise<unknown>>(),
    mockUserId: vi.fn<() => number>(),
}));

vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {getRequest: mockGetRequest, postRequest: mockPostRequest, deleteRequest: mockDeleteRequest},
        familyAuthService: {isLoggedIn: {value: true}, userId: mockUserId},
    }),
);

const membersData = [
    {id: 1, name: 'Jan', email: 'jan@example.com', isHead: true},
    {id: 2, name: 'Maria', email: 'maria@example.com', isHead: false},
];

const inviteCodeData = {id: 10, code: 'ABC123', expiresAt: '2026-04-01T00:00:00Z', createdAt: '2026-03-25T00:00:00Z'};

const mockMembersAndInviteCode = () => {
    mockGetRequest.mockImplementation((url: string) => {
        if (url === '/family/members') {
            return Promise.resolve({data: membersData});
        }
        if (url === '/family/invite-code') {
            return Promise.resolve({data: inviteCodeData});
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
};

const mockMembersAndNoInviteCode = () => {
    mockGetRequest.mockImplementation((url: string) => {
        if (url === '/family/members') {
            return Promise.resolve({data: membersData});
        }
        if (url === '/family/invite-code') {
            const error = new MockAxiosError('Not Found');
            error.response = {status: 404, data: null, statusText: 'Not Found', headers: {}, config: {}};
            return Promise.reject(error);
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
};

describe('SettingsPage — members', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserId.mockReturnValue(1);
        mockMembersAndNoInviteCode();
        Object.defineProperty(navigator, 'clipboard', {
            value: {writeText: vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined)},
            writable: true,
            configurable: true,
        });
    });

    it('should fetch and display family members', async () => {
        // Arrange & Act
        const wrapper = shallowMount(SettingsPage);
        await flushPromises();

        // Assert
        expect(mockGetRequest).toHaveBeenCalledWith('/family/members');
        expect(wrapper.text()).toContain('Jan');
        expect(wrapper.text()).toContain('Maria');
    });

    it('should show head badge for family head', async () => {
        // Arrange & Act
        const wrapper = shallowMount(SettingsPage);
        await flushPromises();

        // Assert
        const badge = wrapper.findComponent(BadgeLabel);
        expect(badge.exists()).toBe(true);
        expect(badge.text()).toBe('settings.familyHead');
        expect(badge.props('variant')).toBe('highlight');
    });

    describe('invite code', () => {
        it('should fetch invite code on mount', async () => {
            // Arrange & Act
            shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            expect(mockGetRequest).toHaveBeenCalledWith('/family/invite-code');
        });

        it('should handle 404 when no active invite code exists', async () => {
            // Arrange
            mockMembersAndNoInviteCode();

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).not.toContain('ABC123');
            expect(wrapper.text()).not.toContain('settings.inviteCodeError');
        });

        it('should show invite code section only for family head', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
            mockMembersAndInviteCode();

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.inviteCodeTitle');
            expect(wrapper.text()).toContain('settings.inviteCodeDescription');
        });

        it('should hide invite code section for non-head members', async () => {
            // Arrange
            mockUserId.mockReturnValue(2);

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).not.toContain('settings.inviteCodeTitle');
        });

        it('should display active invite code', async () => {
            // Arrange
            mockMembersAndInviteCode();

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('ABC123');
            expect(wrapper.text()).toContain('2026-04-01T00:00:00Z');
        });

        it('should copy code to clipboard', async () => {
            // Arrange
            mockMembersAndInviteCode();
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act
            const copyButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.copyCode');
            await copyButton?.trigger('click');
            await flushPromises();

            // Assert
            // eslint-disable-next-line typescript/unbound-method -- writeText is a vi.fn() mock, not a real bound method
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
            expect(wrapper.text()).toContain('settings.codeCopied');
        });

        it('should not copy when no invite code is active', async () => {
            // Arrange
            mockMembersAndNoInviteCode();
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert — no copy button visible when no code exists
            const copyButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.copyCode');
            expect(copyButton).toBeUndefined();
        });

        it('should generate invite code via POST', async () => {
            // Arrange
            mockMembersAndNoInviteCode();
            mockPostRequest.mockResolvedValue({data: inviteCodeData});
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act
            const generateButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.generateInviteCode');
            await generateButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(mockPostRequest).toHaveBeenCalledWith('/family/invite-code', {});
            expect(wrapper.text()).toContain('ABC123');
        });

        it('should show error when generate fails', async () => {
            // Arrange
            mockMembersAndNoInviteCode();
            mockPostRequest.mockRejectedValue(new Error('Network error'));
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act
            const generateButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.generateInviteCode');
            await generateButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.inviteCodeError');
        });

        it('should revoke invite code via DELETE', async () => {
            // Arrange
            mockMembersAndInviteCode();
            mockDeleteRequest.mockResolvedValue({});
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act
            const revokeButton = wrapper
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.revokeCode');
            await revokeButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(mockDeleteRequest).toHaveBeenCalledWith('/family/invite-code');
            expect(wrapper.text()).not.toContain('ABC123');
        });

        it('should show error when revoke fails', async () => {
            // Arrange
            mockMembersAndInviteCode();
            mockDeleteRequest.mockRejectedValue(new Error('Network error'));
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act
            const revokeButton = wrapper
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.revokeCode');
            await revokeButton?.trigger('click');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.inviteCodeError');
        });

        it('should show error when fetching invite code fails with non-404', async () => {
            // Arrange
            mockGetRequest.mockImplementation((url: string) => {
                if (url === '/family/members') {
                    return Promise.resolve({data: membersData});
                }
                if (url === '/family/invite-code') {
                    const error = new MockAxiosError('Internal Server Error');
                    error.response = {
                        status: 500,
                        data: null,
                        statusText: 'Internal Server Error',
                        headers: {},
                        config: {},
                    };
                    return Promise.reject(error);
                }
                return Promise.reject(new Error(`Unexpected GET: ${url}`));
            });

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.inviteCodeError');
        });

        it('should show error when fetching invite code fails with non-axios error', async () => {
            // Arrange
            mockGetRequest.mockImplementation((url: string) => {
                if (url === '/family/members') {
                    return Promise.resolve({data: membersData});
                }
                if (url === '/family/invite-code') {
                    return Promise.reject(new Error('Network failure'));
                }
                return Promise.reject(new Error(`Unexpected GET: ${url}`));
            });

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.inviteCodeError');
        });

        it('should show generate button when no active code exists', async () => {
            // Arrange
            mockMembersAndNoInviteCode();

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            const generateButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.generateInviteCode');
            expect(generateButton?.exists()).toBe(true);
        });

        it('should hide generate button when active code exists', async () => {
            // Arrange
            mockMembersAndInviteCode();

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            const generateButton = wrapper
                .findAllComponents(PrimaryButton)
                .find((btn) => btn.text() === 'settings.generateInviteCode');
            expect(generateButton).toBeUndefined();
        });

        it('should show revoke button when active code exists', async () => {
            // Arrange
            mockMembersAndInviteCode();

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            const revokeButton = wrapper
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.revokeCode');
            expect(revokeButton?.exists()).toBe(true);
        });

        it('should show expires at for active code', async () => {
            // Arrange
            mockMembersAndInviteCode();

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.codeExpires');
            expect(wrapper.text()).toContain('2026-04-01T00:00:00Z');
        });
    });

    describe('member removal', () => {
        it('should show remove button for non-head members when user is head', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            const dangerButtons = wrapper.findAllComponents(DangerButton);
            const removeButton = dangerButtons.find((btn) => btn.text() === 'settings.removeMember');
            expect(removeButton?.exists()).toBe(true);
        });

        it('should not show remove button for the family head member', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
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

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            const dangerButtons = wrapper.findAllComponents(DangerButton);
            const removeButton = dangerButtons.find((btn) => btn.text() === 'settings.removeMember');
            expect(removeButton).toBeUndefined();
        });

        it('should not show remove buttons for non-head users', async () => {
            // Arrange
            mockUserId.mockReturnValue(2);

            // Act
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Assert
            const dangerButtons = wrapper.findAllComponents(DangerButton);
            const removeButton = dangerButtons.find((btn) => btn.text() === 'settings.removeMember');
            expect(removeButton).toBeUndefined();
        });

        it('should open confirm dialog when remove button is clicked', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act
            const removeButton = wrapper
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.removeMember');
            await removeButton?.trigger('click');

            // Assert
            const dialog = wrapper.findComponent(ConfirmDialog);
            expect(dialog.props('open')).toBe(true);
            expect(dialog.props('title')).toBe('settings.removeMemberTitle');
            expect(dialog.props('message')).toBe('settings.removeMemberMessage');
        });

        it('should close confirm dialog on cancel', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            const removeButton = wrapper
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.removeMember');
            await removeButton?.trigger('click');

            // Act
            const dialog = wrapper.findComponent(ConfirmDialog);
            dialog.vm.$emit('cancel');
            await flushPromises();

            // Assert
            expect(wrapper.findComponent(ConfirmDialog).props('open')).toBe(false);
        });

        it('should remove member on confirm and update list', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
            mockDeleteRequest.mockResolvedValue({});
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act
            const removeButton = wrapper
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.removeMember');
            await removeButton?.trigger('click');

            const dialog = wrapper.findComponent(ConfirmDialog);
            dialog.vm.$emit('confirm');
            await flushPromises();

            // Assert
            expect(mockDeleteRequest).toHaveBeenCalledWith('/family/members/2');
            expect(wrapper.text()).not.toContain('Maria');
            expect(wrapper.text()).toContain('settings.memberRemoved');
        });

        it('should show self-removal error on 422', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
            const axiosError = new MockAxiosError('Unprocessable Entity');
            axiosError.response = {
                status: 422,
                data: null,
                statusText: 'Unprocessable Entity',
                headers: {},
                config: {},
            };
            mockDeleteRequest.mockRejectedValue(axiosError);
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act
            const removeButton = wrapper
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.removeMember');
            await removeButton?.trigger('click');
            wrapper.findComponent(ConfirmDialog).vm.$emit('confirm');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.removeMemberSelfError');
        });

        it('should show not-found error and remove member from list on 404', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
            const axiosError = new MockAxiosError('Not Found');
            axiosError.response = {status: 404, data: null, statusText: 'Not Found', headers: {}, config: {}};
            mockDeleteRequest.mockRejectedValue(axiosError);
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act
            const removeButton = wrapper
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.removeMember');
            await removeButton?.trigger('click');
            wrapper.findComponent(ConfirmDialog).vm.$emit('confirm');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.removeMemberNotFound');
            expect(wrapper.text()).not.toContain('Maria');
        });

        it('should show generic error on network failure', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
            mockDeleteRequest.mockRejectedValue(new Error('Network error'));
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act
            const removeButton = wrapper
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.removeMember');
            await removeButton?.trigger('click');
            wrapper.findComponent(ConfirmDialog).vm.$emit('confirm');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.removeMemberError');
        });

        it('should not call delete when memberToRemove is null', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act — emit confirm without clicking remove first
            wrapper.findComponent(ConfirmDialog).vm.$emit('confirm');
            await flushPromises();

            // Assert
            expect(mockDeleteRequest).not.toHaveBeenCalledWith(expect.stringContaining('/family/members/'));
        });

        it('should show 403 error as generic removal error', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
            const axiosError = new MockAxiosError('Forbidden');
            axiosError.response = {status: 403, data: null, statusText: 'Forbidden', headers: {}, config: {}};
            mockDeleteRequest.mockRejectedValue(axiosError);
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // Act
            const removeButton = wrapper
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.removeMember');
            await removeButton?.trigger('click');
            wrapper.findComponent(ConfirmDialog).vm.$emit('confirm');
            await flushPromises();

            // Assert
            expect(wrapper.text()).toContain('settings.removeMemberError');
        });

        it('should clear previous removal messages when opening confirm dialog', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
            mockDeleteRequest.mockResolvedValue({});
            const wrapper = shallowMount(SettingsPage);
            await flushPromises();

            // First removal — success
            const removeButton = wrapper
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.removeMember');
            await removeButton?.trigger('click');
            wrapper.findComponent(ConfirmDialog).vm.$emit('confirm');
            await flushPromises();
            expect(wrapper.text()).toContain('settings.memberRemoved');

            // Arrange — add another member to remove
            mockGetRequest.mockImplementation((url: string) => {
                if (url === '/family/members') {
                    return Promise.resolve({
                        data: [
                            {id: 1, name: 'Jan', email: 'jan@example.com', isHead: true},
                            {id: 3, name: 'Piet', email: 'piet@example.com', isHead: false},
                        ],
                    });
                }
                if (url === '/family/invite-code') {
                    const error = new MockAxiosError('Not Found');
                    error.response = {status: 404, data: null, statusText: 'Not Found', headers: {}, config: {}};
                    return Promise.reject(error);
                }
                return Promise.reject(new Error(`Unexpected GET: ${url}`));
            });

            // Remount to get the new member list
            const wrapper2 = shallowMount(SettingsPage);
            await flushPromises();

            // Act — click remove on new member
            const removeButton2 = wrapper2
                .findAllComponents(DangerButton)
                .find((btn) => btn.text() === 'settings.removeMember');
            await removeButton2?.trigger('click');

            // Assert — success message is cleared when dialog opens
            expect(wrapper2.text()).not.toContain('settings.memberRemoved');
        });
    });
});
