import type {Profile} from '@app/types/profile';

import {createAuthService} from '@shared/services/auth';

import {familyHttpService} from './http';

export const familyAuthService = createAuthService<Profile>(familyHttpService);
