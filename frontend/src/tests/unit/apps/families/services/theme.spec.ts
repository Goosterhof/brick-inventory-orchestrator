import type * as FsTheme from '@script-development/fs-theme';

import {describe, expect, it, vi} from 'vitest';

vi.mock('@script-development/fs-theme', async (importOriginal) => {
    const actual = await importOriginal<typeof FsTheme>();
    return {...actual, createThemeService: vi.fn<typeof actual.createThemeService>(actual.createThemeService)};
});

const {createThemeService} = await import('@script-development/fs-theme');
const {familyStorageService} = await import('@app/services/storage');
const {familyThemeService} = await import('@app/services/theme');

describe('familyThemeService', () => {
    it('should persist the theme in the family storage service', () => {
        // Assert
        expect(createThemeService).toHaveBeenCalledExactlyOnceWith(familyStorageService);
        expect(familyThemeService).toBe(vi.mocked(createThemeService).mock.results[0]?.value);
    });
});
