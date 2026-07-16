import type {FamilySet, FamilySetDraft} from '@app/types/familySet';
import type {Adapted, AdapterStoreModule, NewAdapted} from '@script-development/fs-adapter-store';

import {familyHttpService} from '@app/services/http';
import {familyLoadingService} from '@app/services/loading';
import {familyStorageService} from '@app/services/storage';
import {createAdapterStoreModule, resourceAdapter} from '@script-development/fs-adapter-store';

const DOMAIN_NAME = 'family-sets';

function familySetAdapter(storeModule: AdapterStoreModule<FamilySet>): NewAdapted<FamilySet, FamilySetDraft>;
function familySetAdapter(
    storeModule: AdapterStoreModule<FamilySet>,
    resourceGetter: () => FamilySet,
): Adapted<FamilySet>;
function familySetAdapter(
    storeModule: AdapterStoreModule<FamilySet>,
    resourceGetter?: () => FamilySet,
): Adapted<FamilySet> | NewAdapted<FamilySet, FamilySetDraft> {
    if (resourceGetter) {
        return resourceAdapter(resourceGetter, DOMAIN_NAME, storeModule, familyHttpService);
    }

    return resourceAdapter<FamilySet, FamilySetDraft>(
        {setId: 0, setNum: '', quantity: 1, status: 'sealed', purchaseDate: null, notes: null},
        DOMAIN_NAME,
        storeModule,
        familyHttpService,
    );
}

export const familySetStoreModule = createAdapterStoreModule<
    FamilySet,
    Adapted<FamilySet>,
    NewAdapted<FamilySet, FamilySetDraft>
>({
    domainName: DOMAIN_NAME,
    adapter: familySetAdapter,
    httpService: familyHttpService,
    storageService: familyStorageService,
    loadingService: familyLoadingService,
});
