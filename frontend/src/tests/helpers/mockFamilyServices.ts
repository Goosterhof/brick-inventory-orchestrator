import type {HttpService} from '@script-development/fs-http';
import type {ThemeService} from '@script-development/fs-theme';
import type {AuthService} from '@shared/services/auth/types';
import type {Mock} from 'vitest';

import {vi} from 'vitest';
import {ref} from 'vue';

import type {MockedService} from './mockTypes';

export interface FamilyServicesMock {
    familyHttpService: MockedService<HttpService>;
    familyAuthService: MockedService<AuthService<{id: number}>>;
    familyRouterService: Record<string, unknown>;
    familyTranslationService: {t: (key: string) => {value: string}; locale: {value: string}};
    familyLoadingService: Record<string, unknown>;
    familySoundService: Record<string, unknown>;
    familyStorageService: Record<string, unknown>;
    familyThemeService: ThemeService;
    familyToastService: {show: Mock; hide: Mock; ToastContainerComponent: Record<string, unknown>};
    FamilyRouterView: Record<string, unknown>;
    FamilyRouterLink: Record<string, unknown>;
}

type LoosePartial<T> = {
    [K in keyof T]?: T[K] extends Mock ? Mock : T[K];
};

type FamilyServicesOverrides = {
    [K in keyof FamilyServicesMock]?: LoosePartial<FamilyServicesMock[K]>;
};

export const createMockFamilyServices = (overrides?: FamilyServicesOverrides): FamilyServicesMock => {
    const defaults: FamilyServicesMock = {
        familyHttpService: {
            getRequest: vi.fn<HttpService['getRequest']>(),
            postRequest: vi.fn<HttpService['postRequest']>(),
            putRequest: vi.fn<HttpService['putRequest']>(),
            patchRequest: vi.fn<HttpService['patchRequest']>(),
            deleteRequest: vi.fn<HttpService['deleteRequest']>(),
            downloadRequest: vi.fn<HttpService['downloadRequest']>(),
            previewRequest: vi.fn<HttpService['previewRequest']>(),
            streamRequest: vi.fn<HttpService['streamRequest']>(),
            registerRequestMiddleware: vi.fn<HttpService['registerRequestMiddleware']>(() => vi.fn<() => void>()),
            registerResponseMiddleware: vi.fn<HttpService['registerResponseMiddleware']>(() => vi.fn<() => void>()),
            registerResponseErrorMiddleware: vi.fn<HttpService['registerResponseErrorMiddleware']>(() =>
                vi.fn<() => void>(),
            ),
        },
        familyAuthService: {
            isLoggedIn: {value: false},
            user: {value: null},
            userId: vi.fn<() => number>(),
            register: vi.fn<() => Promise<void>>(),
            login: vi.fn<() => Promise<void>>(),
            logout: vi.fn<() => Promise<void>>(),
            checkIfLoggedIn: vi.fn<() => Promise<void>>(),
        },
        familyRouterService: {
            goToRoute: vi.fn<() => Promise<void>>(),
            goToCreatePage: vi.fn<() => Promise<void>>(),
            goToOverviewPage: vi.fn<() => Promise<void>>(),
            goToEditPage: vi.fn<() => Promise<void>>(),
            goToShowPage: vi.fn<() => Promise<void>>(),
            goBack: vi.fn<() => void>(),
        },
        familyTranslationService: {t: (key: string) => ({value: key}), locale: {value: 'en'}},
        familyLoadingService: {},
        familySoundService: {},
        familyStorageService: {},
        familyThemeService: {isDark: ref(false), toggleTheme: vi.fn<() => void>()},
        familyToastService: {
            show: vi.fn<(props: {message: string; variant?: 'success' | 'error'}) => string>(() => 'toast-mock'),
            hide: vi.fn<(id: string) => void>(),
            ToastContainerComponent: {name: 'ToastContainer', template: '<div />'},
        },
        FamilyRouterView: {template: '<div><slot /></div>'},
        FamilyRouterLink: {template: '<a><slot /></a>'},
    };

    if (!overrides) return defaults;

    return {
        familyHttpService: {...defaults.familyHttpService, ...overrides.familyHttpService},
        familyAuthService: {...defaults.familyAuthService, ...overrides.familyAuthService},
        familyRouterService: {...defaults.familyRouterService, ...overrides.familyRouterService},
        familyTranslationService: {...defaults.familyTranslationService, ...overrides.familyTranslationService},
        familyLoadingService: {...defaults.familyLoadingService, ...overrides.familyLoadingService},
        familySoundService: {...defaults.familySoundService, ...overrides.familySoundService},
        familyStorageService: {...defaults.familyStorageService, ...overrides.familyStorageService},
        familyThemeService: {...defaults.familyThemeService, ...overrides.familyThemeService},
        familyToastService: {...defaults.familyToastService, ...overrides.familyToastService},
        FamilyRouterView: {...defaults.FamilyRouterView, ...overrides.FamilyRouterView},
        FamilyRouterLink: {...defaults.FamilyRouterLink, ...overrides.FamilyRouterLink},
    };
};

export interface FamilyStoresMock {
    familySetStoreModule: Record<string, unknown>;
    storageOptionStoreModule: Record<string, unknown>;
}

type FamilyStoresOverrides = {
    [K in keyof FamilyStoresMock]?: Partial<FamilyStoresMock[K]>;
};

export const createMockFamilyStores = (overrides?: FamilyStoresOverrides): FamilyStoresMock => {
    const defaults: FamilyStoresMock = {familySetStoreModule: {}, storageOptionStoreModule: {}};

    if (!overrides) return defaults;

    return {
        familySetStoreModule: {...defaults.familySetStoreModule, ...overrides.familySetStoreModule},
        storageOptionStoreModule: {...defaults.storageOptionStoreModule, ...overrides.storageOptionStoreModule},
    };
};
