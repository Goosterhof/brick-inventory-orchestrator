import {MissingRefValueError} from '@shared/errors/missing-ref-value';
import {describe, expect, it} from 'vitest';

describe('MissingRefValueError', () => {
    it('should create error with descriptive message', () => {
        // Act
        const error = new MissingRefValueError();

        // Assert
        expect(error.message).toBe('Expected ref to have a value but it was undefined or null.');
    });

    it("should have name 'MissingRefValueError'", () => {
        // Act
        const error = new MissingRefValueError();

        // Assert
        expect(error.name).toBe('MissingRefValueError');
    });

    it('should be an instance of Error', () => {
        // Act
        const error = new MissingRefValueError();

        // Assert
        expect(error).toBeInstanceOf(Error);
    });
});
