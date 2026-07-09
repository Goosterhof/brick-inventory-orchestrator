import {createHttpService, guarded} from '@script-development/fs-http';
import {deepCamelKeys, deepSnakeKeys} from '@shared/helpers/string';

// createHttpService runs `new URL(baseURL)` internally, which throws on a
// bare path like `/api`. Promote relative bases (the same-origin prod case)
// to absolute by prepending the current origin at runtime.
const rawBase: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';
const API_BASE_URL: string = rawBase.startsWith('http') ? rawBase : `${window.location.origin}${rawBase}`;

export const familyHttpService = createHttpService(API_BASE_URL);

// fs-http invokes middleware synchronously and uncaught by design (loud
// library, defensive consumer — fs-http Principle #8). `guarded()` keeps a
// throwing transform from corrupting the interceptor chain: the failure is
// reported loudly (console.error by default) and the original, untransformed
// payload passes through instead of rejecting an already-resolved response.
familyHttpService.registerRequestMiddleware(
    guarded((config) => {
        if (config.data && !(config.data instanceof FormData)) config.data = deepSnakeKeys(config.data);
    }),
);

familyHttpService.registerResponseMiddleware(
    guarded((response) => {
        if (response.data && typeof response.data === 'object') response.data = deepCamelKeys(response.data);
    }),
);
