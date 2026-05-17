import {NotLoggedInError} from '@shared/errors/not-logged-in';
import {describe, expect, it} from 'vitest';

describe('NotLoggedInError', () => {
    it("should create error with 'User is not logged in' message", () => {
        // Act
        const error = new NotLoggedInError();

        // Assert
        expect(error.message).toBe('User is not logged in');
    });

    it("should have name 'NotLoggedInError'", () => {
        // Act
        const error = new NotLoggedInError();

        // Assert
        expect(error.name).toBe('NotLoggedInError');
    });

    it('should be an instance of Error', () => {
        // Act
        const error = new NotLoggedInError();

        // Assert
        expect(error).toBeInstanceOf(Error);
    });
});
