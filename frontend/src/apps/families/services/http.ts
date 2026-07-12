import {createHttpService} from '@script-development/fs-http';
import {deepCamelKeys, deepSnakeKeys} from '@shared/helpers/string';

// createHttpService runs `new URL(baseURL)` internally, which throws on a
// bare path like `/api`. Promote relative bases (the same-origin prod case)
// to absolute by prepending the current origin at runtime.
const rawBase: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';
const API_BASE_URL: string = rawBase.startsWith('http') ? rawBase : `${window.location.origin}${rawBase}`;

export const familyHttpService = createHttpService(API_BASE_URL);

familyHttpService.registerRequestMiddleware((config) => {
    if (config.data && !(config.data instanceof FormData)) config.data = deepSnakeKeys(config.data);
});

familyHttpService.registerResponseMiddleware((response) => {
    if (response.data && typeof response.data === 'object') response.data = deepCamelKeys(response.data);
});
