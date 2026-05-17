import {createThemeService} from '@script-development/fs-theme';

import {familyStorageService} from './storage';

export const familyThemeService = createThemeService(familyStorageService);
