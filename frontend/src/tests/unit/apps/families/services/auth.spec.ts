import type * as AuthModule from '@shared/services/auth';

import {describe, expect, it, vi} from 'vitest';

vi.mock('@shared/services/auth', async (importOriginal) => {
    const actual = await importOriginal<typeof AuthModule>();
    return {...actual, createAuthService: vi.fn<typeof actual.createAuthService>(actual.createAuthService)};
});

const {createAuthService} = await import('@shared/services/auth');
const {familyHttpService} = await import('@app/services/http');
const {familyAuthService} = await import('@app/services/auth');

describe('familyAuthService', () => {
    it('should be the auth service built on the family http service', () => {
        // Assert
        expect(createAuthService).toHaveBeenCalledExactlyOnceWith(familyHttpService);
        expect(familyAuthService).toBe(vi.mocked(createAuthService).mock.results[0]?.value);
    });
});
