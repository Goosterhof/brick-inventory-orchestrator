import {familyStorageService} from '@app/services/storage';
import {afterEach, describe, expect, it} from 'vitest';

describe('familyStorageService', () => {
    afterEach(() => {
        localStorage.clear();
    });

    it('should namespace stored keys under the families prefix', () => {
        // Act
        familyStorageService.put('theme', 'dark');

        // Assert
        expect(localStorage.getItem('families:theme')).toBe('dark');
        expect(familyStorageService.get('theme', '')).toBe('dark');
    });
});
