import type {UseValidationErrors} from '@shared/composables/useValidationErrors';

import {isAxiosError} from 'axios';
import {ref} from 'vue';

/** @public */
export const useFormSubmit = <T extends string>(validationErrors: UseValidationErrors<T>) => {
    const submitting = ref(false);

    const handleSubmit = async (action: () => Promise<void>) => {
        if (submitting.value) return;

        submitting.value = true;
        validationErrors.clearErrors();

        try {
            await action();
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 422) {
                return;
            }
            throw error;
        } finally {
            submitting.value = false;
        }
    };

    return {handleSubmit, submitting};
};
