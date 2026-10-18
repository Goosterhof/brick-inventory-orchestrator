import {familyTranslationService} from '@app/services/translation';
import {afterEach, describe, expect, it} from 'vitest';

describe('familyTranslationService', () => {
    afterEach(() => {
        familyTranslationService.locale.value = 'en';
    });

    it('should start in English', () => {
        // Assert
        expect(familyTranslationService.locale.value).toBe('en');
        expect(familyTranslationService.t('common.save').value).toBe('Save');
    });

    it('should switch to Dutch when the locale changes', () => {
        // Arrange
        const label = familyTranslationService.t('feedback.send');

        // Act
        familyTranslationService.locale.value = 'nl';

        // Assert
        expect(label.value).toBe('Feedback versturen');
    });
});
