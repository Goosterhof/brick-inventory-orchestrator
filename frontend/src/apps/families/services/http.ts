import {createHttpService} from '@script-development/fs-http';
import {deepCamelKeys, deepSnakeKeys} from '@shared/helpers/string';

const API_BASE_URL: string =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'https://api.brick-inventory.com/api';

export const familyHttpService = createHttpService(API_BASE_URL);

familyHttpService.registerRequestMiddleware((config) => {
    if (config.data && !(config.data instanceof FormData)) config.data = deepSnakeKeys(config.data);
});

familyHttpService.registerResponseMiddleware((response) => {
    if (response.data && typeof response.data === 'object') response.data = deepCamelKeys(response.data);
});
