import {MissingRefValueError} from '@shared/errors/missing-ref-value';
import {ensureRefValueExists} from '@shared/helpers/type-check';
import {describe, expect, it} from 'vitest';
import {ref} from 'vue';

describe('ensureRefValueExists', () => {
    it('should return the value when the ref has a defined value', () => {
        // Arrange
        const testRef = ref<string | undefined>('hello');

        // Act
        const result = ensureRefValueExists(testRef);

        // Assert
        expect(result).toBe('hello');
    });

    it('should throw MissingRefValueError when the ref value is null', () => {
        // Arrange
        const testRef = ref<string | null>(null);

        // Act & Assert
        expect(() => ensureRefValueExists(testRef)).toThrow(MissingRefValueError);
    });

    it('should throw MissingRefValueError when the ref value is undefined', () => {
        // Arrange
        const testRef = ref<string | undefined>(undefined);

        // Act & Assert
        expect(() => ensureRefValueExists(testRef)).toThrow(MissingRefValueError);
    });

    it('should narrow the type from nullable to non-nullable', () => {
        // Arrange
        const testRef = ref<number | null>(42);

        // Act
        const result: number = ensureRefValueExists(testRef);

        // Assert
        expect(result).toBe(42);
    });

    it('should return falsy values that are not null or undefined', () => {
        // Arrange & Act & Assert
        expect(ensureRefValueExists(ref<number | undefined>(0))).toBe(0);
        expect(ensureRefValueExists(ref<string | undefined>(''))).toBe('');
        expect(ensureRefValueExists(ref<boolean | undefined>(false))).toBe(false);
    });
});
