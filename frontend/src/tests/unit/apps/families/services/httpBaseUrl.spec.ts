import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {afterEach, describe, expect, it, vi} from 'vitest';

const mock = new MockAdapter(axios);

const loadHttpService = async () => {
    vi.resetModules();
    const {familyHttpService} = await import('@app/services/http');
    return familyHttpService;
};

describe('familyHttpService base url', () => {
    afterEach(() => {
        mock.reset();
        vi.unstubAllEnvs();
    });

    it('should prefix a relative base with the current origin', async () => {
        // Arrange
        vi.stubEnv('VITE_API_BASE_URL', '/backend');
        mock.onGet('/sets').reply(200, {});
        const familyHttpService = await loadHttpService();

        // Act
        await familyHttpService.getRequest('/sets');

        // Assert
        expect(mock.history.get[0]?.baseURL).toBe(`${window.location.origin}/backend`);
    });

    it('should use an absolute base as given', async () => {
        // Arrange
        vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/api');
        mock.onGet('/sets').reply(200, {});
        const familyHttpService = await loadHttpService();

        // Act
        await familyHttpService.getRequest('/sets');

        // Assert
        expect(mock.history.get[0]?.baseURL).toBe('https://api.example.test/api');
    });

    it('should fall back to /api when no base is configured', async () => {
        // Arrange
        vi.stubEnv('VITE_API_BASE_URL', undefined);
        mock.onGet('/sets').reply(200, {});
        const familyHttpService = await loadHttpService();

        // Act
        await familyHttpService.getRequest('/sets');

        // Assert
        expect(mock.history.get[0]?.baseURL).toBe(`${window.location.origin}/api`);
    });
});
