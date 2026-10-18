import type * as FsDialog from '@script-development/fs-dialog';

import {EntryNotFoundError} from '@script-development/fs-adapter-store';
import {describe, expect, it, vi} from 'vitest';

const {registeredHandlers} = vi.hoisted(() => ({registeredHandlers: [] as FsDialog.DialogErrorHandler[]}));

// Capture the error middleware the module registers on its real dialog service.
vi.mock('@script-development/fs-dialog', async (importOriginal) => {
    const actual = await importOriginal<typeof FsDialog>();
    return {
        createDialogService: () => {
            const service = actual.createDialogService();
            const register = service.registerErrorMiddleware;
            service.registerErrorMiddleware = (handler) => {
                registeredHandlers.push(handler);
                return register(handler);
            };
            return service;
        },
    };
});

const {familyDialogService} = await import('@app/services/dialog');

const runMiddleware = (error: Error) => {
    const closeAll = vi.fn<() => void>();
    const propagate = registeredHandlers.every((handler) => handler(error, {closeAll}));
    return {closeAll, propagate};
};

describe('familyDialogService', () => {
    it('should expose a dialog container to mount', () => {
        // Assert
        expect(familyDialogService.DialogContainerComponent).toBeDefined();
        expect(registeredHandlers).toHaveLength(1);
    });

    it('should close every dialog and stop propagation when an entry is not found', () => {
        // Act
        const {closeAll, propagate} = runMiddleware(new EntryNotFoundError('family-sets', 42));

        // Assert
        expect(closeAll).toHaveBeenCalledOnce();
        expect(propagate).toBe(false);
    });

    it('should leave dialogs open and let any other error propagate', () => {
        // Act
        const {closeAll, propagate} = runMiddleware(new Error('boom'));

        // Assert
        expect(closeAll).not.toHaveBeenCalled();
        expect(propagate).toBe(true);
    });
});
