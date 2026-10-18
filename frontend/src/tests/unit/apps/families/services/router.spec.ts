import type * as FsRouter from '@script-development/fs-router';

import {describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-router', async (importOriginal) => {
    const actual = await importOriginal<typeof FsRouter>();
    return {...actual, createRouterService: vi.fn<typeof actual.createRouterService>(actual.createRouterService)};
});

const {createRouterService} = await import('@script-development/fs-router');
const {familyRouterService, FamilyRouterView, FamilyRouterLink} = await import('@app/services/router');

describe('familyRouterService', () => {
    it('should register every domain route, home first', () => {
        // Arrange
        const [routes] = vi.mocked(createRouterService).mock.calls[0] ?? [];

        // Assert
        expect(createRouterService).toHaveBeenCalledOnce();
        expect(routes?.map((route) => route.name)).toStrictEqual([
            'home',
            'about',
            'login',
            'sets',
            'sets-add',
            'sets-scan',
            'sets-identify',
            'sets-detail',
            'sets-edit',
            'storage',
            'storage-add',
            'storage-detail',
            'storage-edit',
            'parts',
            'parts-missing',
            'parts-unsorted',
            'brick-dna',
            'settings',
        ]);
    });

    it('should mount under the app base url', () => {
        // Assert
        expect(createRouterService).toHaveBeenCalledWith(expect.any(Array), {base: import.meta.env.BASE_URL});
    });

    it('should export the router view and link of the service it built', () => {
        // Assert
        expect(familyRouterService).toBe(vi.mocked(createRouterService).mock.results[0]?.value);
        expect(FamilyRouterView).toBe(familyRouterService.RouterView);
        expect(FamilyRouterLink).toBe(familyRouterService.RouterLink);
    });
});
