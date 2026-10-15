import type {ComponentPublicInstance} from 'vue';

import IdentifyBrickPage from '@app/domains/sets/pages/IdentifyBrickPage.vue';
import {flushPromises, shallowMount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {createMockAxios, createMockFsHelpers, createMockStringTs, createMockFamilyServices} = await vi.hoisted(
    () => import('../../../../../../helpers'),
);

const {mockPostRequest, mockGoToRoute} = vi.hoisted(() => ({
    mockPostRequest: vi.fn<() => Promise<unknown>>(),
    mockGoToRoute: vi.fn<() => Promise<void>>(),
}));

vi.mock('@shared/components/BackButton.vue', () => ({
    default: {name: 'BackButton', emits: ['click'], template: '<button><slot /></button>'},
}));
vi.mock('@shared/components/PageHeader.vue', () => ({
    default: {name: 'PageHeader', props: ['title'], template: '<header><slot /></header>'},
}));
vi.mock('@shared/components/PrimaryButton.vue', () => ({
    default: {name: 'PrimaryButton', template: '<button><slot /></button>'},
}));
vi.mock('@shared/components/scanner/CameraCapture.vue', () => ({
    default: {name: 'CameraCapture', emits: ['capture'], template: '<div />'},
}));

vi.mock('axios', () => createMockAxios());
vi.mock('string-ts', () => createMockStringTs());
vi.mock('@script-development/fs-helpers', () => createMockFsHelpers());
vi.mock('@app/services', () =>
    createMockFamilyServices({
        familyHttpService: {postRequest: mockPostRequest},
        familyAuthService: {isLoggedIn: {value: true}},
        familyRouterService: {goToRoute: mockGoToRoute},
    }),
);

describe('IdentifyBrickPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render page header', () => {
        // Arrange & Act
        const wrapper = shallowMount(IdentifyBrickPage);

        // Assert
        expect(wrapper.findComponent({name: 'PageHeader'}).props('title')).toBe('sets.identifyBrick');
    });

    it('should render CameraCapture component', () => {
        // Arrange & Act
        const wrapper = shallowMount(IdentifyBrickPage);

        // Assert
        expect(wrapper.findComponent({name: 'CameraCapture'}).exists()).toBe(true);
    });

    it('should render back button', () => {
        // Arrange & Act
        const wrapper = shallowMount(IdentifyBrickPage);

        // Assert
        expect(wrapper.findComponent({name: 'BackButton'}).exists()).toBe(true);
    });

    it('should navigate back when back button is clicked', async () => {
        // Arrange
        const wrapper = shallowMount(IdentifyBrickPage);

        // Act
        (wrapper.findComponent({name: 'BackButton'}).vm as ComponentPublicInstance).$emit('click');
        await flushPromises();

        // Assert
        expect(mockGoToRoute).toHaveBeenCalledWith('sets');
    });

    it('should send image to identify endpoint on capture', async () => {
        // Arrange
        mockPostRequest.mockResolvedValue({
            data: {id: 42, partNum: '3001', name: 'Brick 2 x 4', category: null, imageUrl: null},
        });
        const wrapper = shallowMount(IdentifyBrickPage);
        const blob = new Blob(['image'], {type: 'image/jpeg'});

        // Act
        (wrapper.findComponent({name: 'CameraCapture'}).vm as ComponentPublicInstance).$emit('capture', blob);
        await flushPromises();

        // Assert
        expect(mockPostRequest).toHaveBeenCalledWith('/identify-brick', expect.any(FormData));
    });

    it('should display identified part', async () => {
        // Arrange
        mockPostRequest.mockResolvedValue({
            data: {
                id: 42,
                partNum: '3001',
                name: 'Brick 2 x 4',
                category: null,
                imageUrl: 'https://example.com/3001.jpg',
            },
        });
        const wrapper = shallowMount(IdentifyBrickPage);
        const blob = new Blob(['image'], {type: 'image/jpeg'});

        // Act
        (wrapper.findComponent({name: 'CameraCapture'}).vm as ComponentPublicInstance).$emit('capture', blob);
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('Brick 2 x 4');
        expect(wrapper.text()).toContain('3001');
    });

    it('should hide camera after capture', async () => {
        // Arrange
        mockPostRequest.mockResolvedValue({
            data: {id: 42, partNum: '3001', name: 'Brick 2 x 4', category: null, imageUrl: null},
        });
        const wrapper = shallowMount(IdentifyBrickPage);
        const blob = new Blob(['image'], {type: 'image/jpeg'});

        // Act
        (wrapper.findComponent({name: 'CameraCapture'}).vm as ComponentPublicInstance).$emit('capture', blob);
        await flushPromises();

        // Assert
        expect(wrapper.findComponent({name: 'CameraCapture'}).exists()).toBe(false);
    });

    it('should show error on identification failure', async () => {
        // Arrange
        mockPostRequest.mockRejectedValue(new Error('Server error'));
        const wrapper = shallowMount(IdentifyBrickPage);
        const blob = new Blob(['image'], {type: 'image/jpeg'});

        // Act
        (wrapper.findComponent({name: 'CameraCapture'}).vm as ComponentPublicInstance).$emit('capture', blob);
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('sets.identifyError');
    });

    it('should show identifying state while in progress', async () => {
        // Arrange
        let resolveRequest: ((value: unknown) => void) | undefined;
        mockPostRequest.mockReturnValue(
            new Promise((resolve) => {
                resolveRequest = resolve;
            }),
        );
        const wrapper = shallowMount(IdentifyBrickPage);
        const blob = new Blob(['image'], {type: 'image/jpeg'});

        // Act
        (wrapper.findComponent({name: 'CameraCapture'}).vm as ComponentPublicInstance).$emit('capture', blob);
        await flushPromises();

        // Assert
        expect(wrapper.text()).toContain('sets.identifying');
        resolveRequest?.({data: {id: 42, partNum: '3001', name: 'Brick 2 x 4', category: null, imageUrl: null}});
    });

    it('should reset state when try again is clicked after success', async () => {
        // Arrange
        mockPostRequest.mockResolvedValue({
            data: {id: 42, partNum: '3001', name: 'Brick 2 x 4', category: null, imageUrl: null},
        });
        const wrapper = shallowMount(IdentifyBrickPage);
        const blob = new Blob(['image'], {type: 'image/jpeg'});
        (wrapper.findComponent({name: 'CameraCapture'}).vm as ComponentPublicInstance).$emit('capture', blob);
        await flushPromises();

        // Act
        const tryAgainButton = wrapper
            .findAllComponents({name: 'PrimaryButton'})
            .find((btn) => btn.text() === 'sets.identifyAgain');
        await tryAgainButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(wrapper.findComponent({name: 'CameraCapture'}).exists()).toBe(true);
        expect(wrapper.text()).not.toContain('Brick 2 x 4');
    });

    it('should reset state when try again is clicked after error', async () => {
        // Arrange
        mockPostRequest.mockRejectedValue(new Error('Server error'));
        const wrapper = shallowMount(IdentifyBrickPage);
        const blob = new Blob(['image'], {type: 'image/jpeg'});
        (wrapper.findComponent({name: 'CameraCapture'}).vm as ComponentPublicInstance).$emit('capture', blob);
        await flushPromises();

        // Act
        const tryAgainButton = wrapper
            .findAllComponents({name: 'PrimaryButton'})
            .find((btn) => btn.text() === 'sets.identifyAgain');
        await tryAgainButton?.trigger('click');
        await flushPromises();

        // Assert
        expect(wrapper.findComponent({name: 'CameraCapture'}).exists()).toBe(true);
        expect(wrapper.text()).not.toContain('sets.identifyError');
    });
});
