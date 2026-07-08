import type {Item} from '@shared/types/item';

import {camelKey, deepSnakeKeys, toCamelCaseTyped} from '@shared/helpers/string';
import {describe, expect, it} from 'vitest';

interface TestItem extends Item {
    id: number;
    userName: string;
    createdAt: string;
}

describe('toCamelCaseTyped', () => {
    it('should convert snake_case keys to camelCase', () => {
        // Arrange
        const snakeCase = {id: 1, user_name: 'test', created_at: '2024-01-01'};

        // Act
        const result = toCamelCaseTyped<TestItem>(snakeCase);

        // Assert
        expect(result).toStrictEqual({id: 1, userName: 'test', createdAt: '2024-01-01'});
    });

    it('should handle already camelCase data', () => {
        // Arrange
        const camelCase: TestItem = {id: 1, userName: 'test', createdAt: '2024-01-01'};

        // Act
        const result = toCamelCaseTyped<TestItem>(camelCase);

        // Assert
        expect(result).toStrictEqual({id: 1, userName: 'test', createdAt: '2024-01-01'});
    });

    it('should handle nested snake_case objects', () => {
        // Arrange
        interface NestedItem extends Item {
            id: number;
            userProfile: {firstName: string; lastName: string};
        }
        const snakeCase = {id: 1, user_profile: {first_name: 'John', last_name: 'Doe'}};

        // Act
        const result = toCamelCaseTyped<NestedItem>(snakeCase);

        // Assert
        expect(result).toStrictEqual({id: 1, userProfile: {firstName: 'John', lastName: 'Doe'}});
    });

    it('should handle arrays with snake_case objects', () => {
        // Arrange
        interface ItemWithArray extends Item {
            id: number;
            userTags: Array<{tagName: string}>;
        }
        const snakeCase = {id: 1, user_tags: [{tag_name: 'admin'}, {tag_name: 'user'}]};

        // Act
        const result = toCamelCaseTyped<ItemWithArray>(snakeCase);

        // Assert
        expect(result).toStrictEqual({id: 1, userTags: [{tagName: 'admin'}, {tagName: 'user'}]});
    });

    it('should preserve primitive values', () => {
        // Arrange
        interface ItemWithPrimitives extends Item {
            id: number;
            isActive: boolean;
            score: number;
            description: string | null;
        }
        const snakeCase = {id: 1, is_active: true, score: 42, description: null};

        // Act
        const result = toCamelCaseTyped<ItemWithPrimitives>(snakeCase);

        // Assert
        expect(result).toStrictEqual({id: 1, isActive: true, score: 42, description: null});
    });
});

describe('deepSnakeKeys', () => {
    it('should convert camelCase keys to snake_case', () => {
        // Arrange
        const camelCase = {userName: 'test', createdAt: '2024-01-01'};

        // Act
        const result = deepSnakeKeys(camelCase);

        // Assert
        expect(result).toStrictEqual({user_name: 'test', created_at: '2024-01-01'});
    });

    it('should handle nested camelCase objects', () => {
        // Arrange
        const camelCase = {userProfile: {firstName: 'John', lastName: 'Doe'}};

        // Act
        const result = deepSnakeKeys(camelCase);

        // Assert
        expect(result).toStrictEqual({user_profile: {first_name: 'John', last_name: 'Doe'}});
    });

    it('should handle already snake_case data', () => {
        // Arrange
        const snakeCase = {user_name: 'test', created_at: '2024-01-01'};

        // Act
        const result = deepSnakeKeys(snakeCase);

        // Assert
        expect(result).toStrictEqual({user_name: 'test', created_at: '2024-01-01'});
    });
});

describe('camelKey', () => {
    it('should convert a single snake_case key to camelCase', () => {
        // Act
        const result = camelKey('family_name');

        // Assert
        expect(result).toBe('familyName');
    });

    it('should convert a multi-word snake_case key to camelCase', () => {
        // Act
        const result = camelKey('set_number');

        // Assert
        expect(result).toBe('setNumber');
    });

    it('should treat a dotted key segment as a word boundary and drop the dot', () => {
        // Act — dotted keys arrive from array-field 422 errors (e.g. `screenshots.0`)
        const result = camelKey('screenshots.0');

        // Assert
        expect(result).toBe('screenshots0');
    });

    it('should return an already-camelCase key unchanged', () => {
        // Act
        const result = camelKey('already');

        // Assert
        expect(result).toBe('already');
    });
});
