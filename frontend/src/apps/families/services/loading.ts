import {createLoadingService, registerLoadingMiddleware} from '@script-development/fs-loading';

import {familyHttpService} from './http';

export const familyLoadingService = createLoadingService();

registerLoadingMiddleware(familyHttpService, familyLoadingService);
