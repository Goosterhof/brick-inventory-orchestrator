import type {StorageOption} from '@app/types/storageOption';
import type {Adapted, AdapterStoreModule, NewAdapted} from '@script-development/fs-adapter-store';

import {familyHttpService} from '@app/services/http';
import {familyLoadingService} from '@app/services/loading';
import {familyStorageService} from '@app/services/storage';
import {createAdapterStoreModule, resourceAdapter} from '@script-development/fs-adapter-store';

const DOMAIN_NAME = 'storage-options';

function storageOptionAdapter(storeModule: AdapterStoreModule<StorageOption>): NewAdapted<StorageOption>;
function storageOptionAdapter(
    storeModule: AdapterStoreModule<StorageOption>,
    resourceGetter: () => StorageOption,
): Adapted<StorageOption>;
function storageOptionAdapter(
    storeModule: AdapterStoreModule<StorageOption>,
    resourceGetter?: () => StorageOption,
): Adapted<StorageOption> | NewAdapted<StorageOption> {
    if (resourceGetter) {
        return resourceAdapter(resourceGetter, DOMAIN_NAME, storeModule, familyHttpService);
    }

    return resourceAdapter<StorageOption>(
        {name: '', description: null, parentId: null, row: null, column: null, childIds: []},
        DOMAIN_NAME,
        storeModule,
        familyHttpService,
    );
}

export const storageOptionStoreModule = createAdapterStoreModule<StorageOption>({
    domainName: DOMAIN_NAME,
    adapter: storageOptionAdapter,
    httpService: familyHttpService,
    storageService: familyStorageService,
    loadingService: familyLoadingService,
});
