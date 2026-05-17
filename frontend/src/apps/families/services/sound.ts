import {createSoundService} from '@shared/services/sound';

import {familyStorageService} from './storage';

export const familySoundService = createSoundService(familyStorageService);
