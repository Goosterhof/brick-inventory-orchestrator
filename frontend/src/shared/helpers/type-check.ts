import type {Ref} from 'vue';

import {MissingRefValueError} from '@shared/errors/missing-ref-value';

export const ensureRefValueExists = <T>(refVariable: Ref<T | undefined | null>): T => {
    if (refVariable.value !== undefined && refVariable.value !== null) return refVariable.value;

    throw new MissingRefValueError();
};
