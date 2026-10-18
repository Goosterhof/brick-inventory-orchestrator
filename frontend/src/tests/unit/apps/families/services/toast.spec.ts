import type * as FsToast from '@script-development/fs-toast';

import {describe, expect, it, vi} from 'vitest';

vi.mock('@shared/components/ToastMessage.vue', () => ({default: {name: 'ToastMessage'}}));

vi.mock('@script-development/fs-toast', async (importOriginal) => {
    const actual = await importOriginal<typeof FsToast>();
    return {...actual, createToastService: vi.fn<typeof actual.createToastService>(actual.createToastService)};
});

const {createToastService} = await import('@script-development/fs-toast');
const {familyToastService} = await import('@app/services/toast');

describe('familyToastService', () => {
    it('should render each toast with the shared ToastMessage component', () => {
        // Assert
        expect(createToastService).toHaveBeenCalledExactlyOnceWith({name: 'ToastMessage'});
        expect(familyToastService).toBe(vi.mocked(createToastService).mock.results[0]?.value);
    });
});
