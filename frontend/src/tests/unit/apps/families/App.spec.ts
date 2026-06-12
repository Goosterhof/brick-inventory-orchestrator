import type {VueWrapper} from '@vue/test-utils';
import type {ComponentPublicInstance} from 'vue';

import App from '@app/App.vue';
import NavHeader from '@shared/components/NavHeader.vue';
import NavMobileLink from '@shared/components/NavMobileLink.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

/** Emit an event from a stub component looked up by name. */
const emitFrom = (wrapper: VueWrapper | undefined, event: string): void => {
    (wrapper?.vm as ComponentPublicInstance | undefined)?.$emit(event);
};

const {createMockAxios, createMockFsHelpers, createMockStringTs, createMockFamilyServices} = await vi.hoisted(
    () => import('../../../helpers'),
);

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());

vi.mock('@phosphor-icons/vue', () => ({
    PhSignOut: {template: '<i />'},
    PhList: {template: '<i />'},
    PhX: {template: '<i />'},
    PhMegaphone: {template: '<i />'},
    PhPaperclip: {template: '<i />'},
}));

const {mockLogout, mockGoToRoute, mockIsLoggedIn, mockCurrentRouteRef} = vi.hoisted(() => ({
    mockLogout: vi.fn<() => Promise<void>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
    mockIsLoggedIn: {value: false},
    mockCurrentRouteRef: {value: {name: 'home', path: '/', matched: [] as never[], meta: {}, query: {}, params: {}}},
}));

vi.mock('@app/services', () =>
    createMockFamilyServices({
        FamilyRouterLink: {name: 'FamilyRouterLink', props: ['to'], template: '<a><slot /></a>'},
        FamilyRouterView: {name: 'FamilyRouterView', template: '<div><slot /></div>'},
        familyAuthService: {isLoggedIn: mockIsLoggedIn, logout: mockLogout},
        familyRouterService: {goToRoute: mockGoToRoute, currentRouteRef: mockCurrentRouteRef},
    }),
);

// FeedbackModal is the spec's heaviest transitive dependency — it pulls in the
// form inputs and ModalDialog. Stubbing it at the spec boundary keeps that
// chain off the collect path (ADR-0012); its behavior is covered by
// modals/FeedbackModal.spec.ts.
vi.mock('@app/modals/FeedbackModal.vue', () => ({
    default: {name: 'FeedbackModal', props: ['open'], template: '<div />'},
}));

vi.mock('@shared/components/NavHeader.vue', () => ({
    default: {
        name: 'NavHeader',
        template: '<div><slot name="links" /><slot name="mobile-links" /><slot name="actions" /></div>',
    },
}));

vi.mock('@shared/components/NavMobileLink.vue', () => ({
    default: {
        name: 'NavMobileLink',
        props: ['to', 'active'],
        template: '<a class="mobile-link" :data-active="active"><slot /></a>',
    },
}));

const mountApp = () => shallowMount(App, {global: {stubs: {NavHeader, NavMobileLink}}});

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsLoggedIn.value = false;
        mockCurrentRouteRef.value = {name: 'home', path: '/', matched: [] as never[], meta: {}, query: {}, params: {}};
    });

    it('should render desktop navigation links', () => {
        // Arrange & Act
        const wrapper = mountApp();

        // Assert
        const links = wrapper.findAllComponents({name: 'FamilyRouterLink'});
        expect(links).toHaveLength(9);
        const [
            homeLink,
            aboutLink,
            setsLink,
            storageLink,
            partsLink,
            brickDnaLink,
            settingsLink,
            loginLink,
            registerLink,
        ] = links;
        expect(homeLink?.text()).toBe('navigation.home');
        expect(aboutLink?.text()).toBe('navigation.about');
        expect(setsLink?.text()).toContain('navigation.sets');
        expect(storageLink?.text()).toContain('navigation.storage');
        expect(partsLink?.text()).toContain('navigation.parts');
        expect(brickDnaLink?.text()).toContain('navigation.brickDna');
        expect(settingsLink?.text()).toContain('navigation.settings');
        expect(loginLink?.text()).toContain('auth.logIn');
        expect(registerLink?.text()).toContain('auth.register');
    });

    it('should render mobile navigation links', () => {
        // Arrange & Act
        const wrapper = mountApp();

        // Assert
        const mobileLinks = wrapper.findAllComponents({name: 'NavMobileLink'});
        expect(mobileLinks).toHaveLength(9);
        expect(mobileLinks.find((l) => l.text() === 'navigation.home')?.exists()).toBe(true);
        expect(mobileLinks.find((l) => l.text() === 'navigation.about')?.exists()).toBe(true);
        expect(mobileLinks.find((l) => l.text().includes('navigation.sets'))?.exists()).toBe(true);
        expect(mobileLinks.find((l) => l.text().includes('navigation.storage'))?.exists()).toBe(true);
        expect(mobileLinks.find((l) => l.text().includes('navigation.parts'))?.exists()).toBe(true);
        expect(mobileLinks.find((l) => l.text().includes('navigation.brickDna'))?.exists()).toBe(true);
        expect(mobileLinks.find((l) => l.text().includes('navigation.settings'))?.exists()).toBe(true);
        expect(mobileLinks.find((l) => l.text().includes('auth.logIn'))?.exists()).toBe(true);
        expect(mobileLinks.find((l) => l.text().includes('auth.register'))?.exists()).toBe(true);
    });

    it('should mark active mobile link based on current route', () => {
        // Arrange
        mockCurrentRouteRef.value = {
            name: 'about',
            path: '/about',
            matched: [] as never[],
            meta: {},
            query: {},
            params: {},
        };

        // Act
        const wrapper = mountApp();

        // Assert
        const mobileLinks = wrapper.findAll('.mobile-link');
        expect(mobileLinks[0]?.attributes('data-active')).toBe('false');
        expect(mobileLinks[1]?.attributes('data-active')).toBe('true');
    });

    it('should not show logout button when not logged in', () => {
        // Arrange & Act
        const wrapper = mountApp();

        // Assert
        expect(wrapper.find('button').exists()).toBe(false);
    });

    it('should show logout button when logged in', () => {
        // Arrange
        mockIsLoggedIn.value = true;

        // Act
        const wrapper = mountApp();

        // Assert
        const button = wrapper.find('[data-testid="logout-button"]');
        expect(button.exists()).toBe(true);
        expect(button.text()).toContain('auth.logout');
    });

    it('should not show feedback button when not logged in', () => {
        // Arrange & Act
        const wrapper = mountApp();

        // Assert
        expect(wrapper.find('[data-testid="feedback-button"]').exists()).toBe(false);
    });

    it('should show feedback button when logged in', () => {
        // Arrange
        mockIsLoggedIn.value = true;

        // Act
        const wrapper = mountApp();

        // Assert
        const button = wrapper.find('[data-testid="feedback-button"]');
        expect(button.exists()).toBe(true);
        expect(button.text()).toContain('feedback.buttonLabel');
    });

    it('should not render the feedback modal in the DOM when closed', () => {
        // Arrange & Act — e2e strict-mode regression guard: a closed modal must
        // contribute nothing to the DOM, or its form labels collide with
        // page-level labels (getByLabel('Description') resolved to 2 elements).
        mockIsLoggedIn.value = true;
        const wrapper = mountApp();

        // Assert
        expect(wrapper.findComponent({name: 'FeedbackModal'}).exists()).toBe(false);
    });

    it('should open the feedback modal when the feedback button is clicked', async () => {
        // Arrange
        mockIsLoggedIn.value = true;
        const wrapper = mountApp();

        // Act
        await wrapper.find('[data-testid="feedback-button"]').trigger('click');

        // Assert
        const modal = wrapper.findComponent({name: 'FeedbackModal'});
        expect(modal.exists()).toBe(true);
        expect(modal.props('open')).toBe(true);
    });

    it('should remove the feedback modal from the DOM on its close event', async () => {
        // Arrange
        mockIsLoggedIn.value = true;
        const wrapper = mountApp();
        await wrapper.find('[data-testid="feedback-button"]').trigger('click');

        // Act
        emitFrom(wrapper.findComponent({name: 'FeedbackModal'}), 'close');
        await wrapper.vm.$nextTick();

        // Assert
        expect(wrapper.findComponent({name: 'FeedbackModal'}).exists()).toBe(false);
    });

    it('should show sets link when logged in', () => {
        // Arrange
        mockIsLoggedIn.value = true;

        // Act
        const wrapper = mountApp();

        // Assert
        const setsLink = wrapper
            .findAllComponents({name: 'FamilyRouterLink'})
            .find((link) => link.text().includes('navigation.sets'));
        expect(setsLink?.exists()).toBe(true);
        expect(setsLink?.props('to')).toStrictEqual({name: 'sets'});
    });

    it('should call logout and navigate to login on click', async () => {
        // Arrange
        mockIsLoggedIn.value = true;
        mockLogout.mockResolvedValue(undefined);
        const wrapper = mountApp();

        // Act
        await wrapper.find('[data-testid="logout-button"]').trigger('click');
        await flushPromises();

        // Assert
        expect(mockLogout).toHaveBeenCalled();
        expect(mockGoToRoute).toHaveBeenCalledWith('login');
    });

    it('should use NavHeader component', () => {
        // Arrange & Act
        const wrapper = mountApp();

        // Assert
        expect(wrapper.findComponent({name: 'NavHeader'}).exists()).toBe(true);
    });
});
