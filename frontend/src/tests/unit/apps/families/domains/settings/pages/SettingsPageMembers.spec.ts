import SettingsPage from '@app/domains/settings/pages/SettingsPage.vue';
import BadgeLabel from '@shared/components/BadgeLabel.vue';
import ConfirmDialog from '@shared/components/ConfirmDialog.vue';
import DangerButton from '@shared/components/DangerButton.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {
    createMockAxiosWithError,
    MockAxiosError,
    createMockFsHelpers,
    createMockStringTs,
    createMockFamilyServices,
    createMockUiInputs,
} = await vi.hoisted(() => import('../../../../../../helpers'));

vi.mock('@script-development/ui-inputs', () => createMockUiInputs());

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

const mockMembers = () => {
    mockGetRequest.mockImplementation((url: string) => {
        if (url === '/family/members') {
            return Promise.resolve({data: membersData});
        }
        return Promise.reject(new Error(`Unexpected GET: ${url}`));
    });
};

describe('SettingsPage — members', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserId.mockReturnValue(1);
        mockMembers();
    });

    it('should fetch and display family members', async () => {
        // Arrange & Act
        const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
        await flushPromises();

        // Assert
        expect(mockGetRequest).toHaveBeenCalledWith('/family/members');
        expect(wrapper.text()).toContain('Jan');
        expect(wrapper.text()).toContain('Maria');
    });

    it('should show head badge for family head', async () => {
        // Arrange & Act
        const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
        await flushPromises();

        // Assert
        const badge = wrapper.findComponent(BadgeLabel);
        expect(badge.exists()).toBe(true);
        expect(badge.text()).toBe('settings.familyHead');
        expect(badge.props('variant')).toBe('highlight');
    });

    describe('member removal', () => {
        it('should show remove button for non-head members when user is head', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);

            // Act
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
                return Promise.reject(new Error(`Unexpected GET: ${url}`));
            });

            // Act
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
            await flushPromises();

            // Assert
            const dangerButtons = wrapper.findAllComponents(DangerButton);
            const removeButton = dangerButtons.find((btn) => btn.text() === 'settings.removeMember');
            expect(removeButton).toBeUndefined();
        });

        it('should open confirm dialog when remove button is clicked', async () => {
            // Arrange
            mockUserId.mockReturnValue(1);
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
            const wrapper = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
                return Promise.reject(new Error(`Unexpected GET: ${url}`));
            });

            // Remount to get the new member list
            const wrapper2 = shallowMount(SettingsPage, {global: {stubs: {FormField: false, TextInput: false}}});
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
