import type * as StringHelpers from '@shared/helpers/string';

import {deepCamelKeys, deepSnakeKeys} from '@shared/helpers/string';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {afterEach, beforeEach, describe, expect, it, type MockInstance, vi} from 'vitest';

vi.mock('@shared/helpers/string', async (importOriginal) => {
    const actual = await importOriginal<typeof StringHelpers>();
    return {
        ...actual,
        deepCamelKeys: vi.fn<typeof actual.deepCamelKeys>(actual.deepCamelKeys),
        deepSnakeKeys: vi.fn<typeof actual.deepSnakeKeys>(actual.deepSnakeKeys),
    };
});

// fs-http captures the axios adapter when `createHttpService` runs, so the
// mock adapter must be installed before the module under test is imported.
// The dynamic import exercises the REAL production wiring in
// `apps/families/services/http.ts` — not a re-created mirror of it.
const mock = new MockAdapter(axios);
const {familyHttpService} = await import('@app/services/http');

describe('familyHttpService transform middleware', () => {
    let consoleErrorSpy: MockInstance<typeof console.error>;

    beforeEach(() => {
        mock.reset();
        vi.mocked(deepCamelKeys).mockReset();
        vi.mocked(deepSnakeKeys).mockReset();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('should convert snake_case response keys to camelCase on a 200', async () => {
        // Arrange
        mock.onGet('/sets').reply(200, {set_number: '75192', piece_count: 7541});

        // Act
        const response = await familyHttpService.getRequest('/sets');

        // Assert
        expect(response.data).toStrictEqual({setNumber: '75192', pieceCount: 7541});
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should convert camelCase request keys to snake_case on the outgoing body', async () => {
        // Arrange
        mock.onPost('/sets').reply(200, {});

        // Act
        await familyHttpService.postRequest('/sets', {setNumber: '75192'});

        // Assert
        expect(mock.history.post[0]?.data).toBe(JSON.stringify({set_number: '75192'}));
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should not reject a resolved 200 when the response transform throws', async () => {
        // Arrange — a malformed/exotic payload makes the camelCase transform throw.
        // Unguarded, this rejection would mask the already-resolved 200.
        vi.mocked(deepCamelKeys).mockImplementationOnce(() => {
            throw new Error('malformed payload');
        });
        mock.onGet('/sets').reply(200, {set_number: '75192'});

        // Act
        const response = await familyHttpService.getRequest('/sets');

        // Assert — the response resolves with the original, untransformed payload
        // and the swallowed throw is surfaced loudly via guarded()'s onError.
        expect(response.status).toBe(200);
        expect(response.data).toStrictEqual({set_number: '75192'});
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            '[fs-http] middleware body threw and was swallowed by guarded():',
            expect.any(Error),
        );
    });

    it('should still send the request with the original body when the request transform throws', async () => {
        // Arrange
        vi.mocked(deepSnakeKeys).mockImplementationOnce(() => {
            throw new Error('unconvertible body');
        });
        mock.onPost('/sets').reply(200, {});

        // Act
        const response = await familyHttpService.postRequest('/sets', {setNumber: '75192'});

        // Assert — the request is not aborted; the original camelCase body goes out.
        expect(response.status).toBe(200);
        expect(mock.history.post[0]?.data).toBe(JSON.stringify({setNumber: '75192'}));
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            '[fs-http] middleware body threw and was swallowed by guarded():',
            expect.any(Error),
        );
    });
});
