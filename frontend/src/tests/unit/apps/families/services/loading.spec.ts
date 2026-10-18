import type * as FsLoading from '@script-development/fs-loading';

import {describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-loading', async (importOriginal) => {
    const actual = await importOriginal<typeof FsLoading>();
    return {
        ...actual,
        registerLoadingMiddleware: vi.fn<typeof actual.registerLoadingMiddleware>(actual.registerLoadingMiddleware),
    };
});

const {registerLoadingMiddleware} = await import('@script-development/fs-loading');
const {familyHttpService} = await import('@app/services/http');
const {familyLoadingService} = await import('@app/services/loading');

describe('familyLoadingService', () => {
    it('should track the family http service', () => {
        // Assert
        expect(registerLoadingMiddleware).toHaveBeenCalledExactlyOnceWith(familyHttpService, familyLoadingService);
    });
});
