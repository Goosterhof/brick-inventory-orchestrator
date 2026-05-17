import SettingsPage from '@app/domains/settings/pages/SettingsPage.vue';
import {shallowMount} from '@vue/test-utils';
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

const {mockGetRequest, mockUserId, mockIsDark, mockToggleTheme} = await vi.hoisted(async () => {
    const {ref} = await import('vue');
    return {
        mockGetRequest: vi.fn<(url: string) => Promise<unknown>>(),
        mockUserId: vi.fn<() => number>(),
        mockIsDark: ref(false),
        mockToggleTheme: vi.fn<() => void>(),
    };
});

vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {getRequest: mockGetRequest},
        familyAuthService: {isLoggedIn: {value: true}, userId: mockUserId},
        familyThemeService: {isDark: mockIsDark, toggleTheme: mockToggleTheme},
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

describe('SettingsPage — theme', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUserId.mockReturnValue(1);
        mockMembersAndNoInviteCode();
        mockIsDark.value = false;
    });

    it('should render theme section title', () => {
        // Arrange & Act
        const wrapper = shallowMount(SettingsPage);

        // Assert
        expect(wrapper.text()).toContain('settings.themeTitle');
    });

    it('should render theme section description', () => {
        // Arrange & Act
        const wrapper = shallowMount(SettingsPage);

        // Assert
        expect(wrapper.text()).toContain('settings.themeDescription');
    });

    it('should show light mode label when theme is light', () => {
        // Arrange
        mockIsDark.value = false;

        // Act
        const wrapper = shallowMount(SettingsPage);

        // Assert
        expect(wrapper.text()).toContain('settings.themeLight');
    });

    it('should show dark mode label when theme is dark', () => {
        // Arrange
        mockIsDark.value = true;

        // Act
        const wrapper = shallowMount(SettingsPage);

        // Assert
        expect(wrapper.text()).toContain('settings.themeDark');
    });

    it('should call toggleTheme when toggle button is clicked', async () => {
        // Arrange
        const wrapper = shallowMount(SettingsPage);

        // Act
        const buttons = wrapper.findAll('button');
        const themeButton = buttons.find(
            (btn) => btn.text() === 'settings.themeLight' || btn.text() === 'settings.themeDark',
        );
        await themeButton?.trigger('click');

        // Assert
        expect(mockToggleTheme).toHaveBeenCalledOnce();
    });

    it('should reactively update label when isDark changes', async () => {
        // Arrange
        mockIsDark.value = false;
        const wrapper = shallowMount(SettingsPage);
        expect(wrapper.text()).toContain('settings.themeLight');

        // Act
        mockIsDark.value = true;
        await wrapper.vm.$nextTick();

        // Assert
        expect(wrapper.text()).toContain('settings.themeDark');
    });
});
