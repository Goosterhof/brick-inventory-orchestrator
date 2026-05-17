import {EntryNotFoundError} from '@script-development/fs-adapter-store';
import {createDialogService} from '@script-development/fs-dialog';

export const familyDialogService = createDialogService();

familyDialogService.registerErrorMiddleware((error, {closeAll}) => {
    if (error instanceof EntryNotFoundError) {
        closeAll();
        return false;
    }

    return true;
});
