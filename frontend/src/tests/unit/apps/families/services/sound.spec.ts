import type * as SoundModule from '@shared/services/sound';

import {describe, expect, it, vi} from 'vitest';

vi.mock('@shared/services/sound', async (importOriginal) => {
    const actual = await importOriginal<typeof SoundModule>();
    return {...actual, createSoundService: vi.fn<typeof actual.createSoundService>(actual.createSoundService)};
});

const {createSoundService} = await import('@shared/services/sound');
const {familyStorageService} = await import('@app/services/storage');
const {familySoundService} = await import('@app/services/sound');

describe('familySoundService', () => {
    it('should persist its toggle in the family storage service', () => {
        // Assert
        expect(createSoundService).toHaveBeenCalledExactlyOnceWith(familyStorageService);
        expect(familySoundService).toBe(vi.mocked(createSoundService).mock.results[0]?.value);
    });
});
