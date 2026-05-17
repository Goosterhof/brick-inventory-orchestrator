import type {HttpService} from '@script-development/fs-http';
import type {AxiosError} from 'axios';
import type {Ref} from 'vue';

import {deepCamelKeys} from '@shared/helpers/string';
import {onUnmounted, ref} from 'vue';

/** @public */
export type ValidationErrors<T extends string = string> = Partial<Record<T, string>>;

type BackendValidationResponse = {message?: string; errors?: Record<string, string[]>};

const isValidationError = (error: AxiosError): error is AxiosError<BackendValidationResponse> =>
    error.response?.status === 422;

const parseValidationErrors = <T extends string>(data: BackendValidationResponse): ValidationErrors<T> => {
    if (!data.errors) return {};

    const camelCasedErrors = deepCamelKeys(data.errors);

    return Object.fromEntries(
        Object.entries(camelCasedErrors).map(([key, messages]) => [key, messages[0]]),
    ) as ValidationErrors<T>;
};

/** @public */
export interface UseValidationErrors<T extends string> {
    errors: Ref<ValidationErrors<T>>;
    clearErrors: () => void;
}

export const useValidationErrors = <T extends string = string>(httpService: HttpService): UseValidationErrors<T> => {
    const errors = ref<ValidationErrors<T>>({}) as Ref<ValidationErrors<T>>;

    const clearErrors = () => {
        errors.value = {};
    };

    const unregister = httpService.registerResponseErrorMiddleware((error) => {
        if (isValidationError(error) && error.response?.data) {
            errors.value = parseValidationErrors<T>(error.response.data);
        }
    });

    onUnmounted(unregister);

    return {errors, clearErrors};
};
