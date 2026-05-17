import {createHttpService} from '@script-development/fs-http';
import {NotLoggedInError} from '@shared/errors/not-logged-in';
import {deepCamelKeys, deepSnakeKeys} from '@shared/helpers/string';
import {createAuthService} from '@shared/services/auth';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {describe, expect, it} from 'vitest';

interface TestProfile {
    id: number;
    email: string;
    createdAt: string;
}

// Mirrors the production wiring in `apps/families/services/http.ts` (ADR-016):
// the auth service relies on registered request/response middleware to
// convert camelCase ↔ snake_case. The contract under test is the wired
// service, not the raw httpService.
const createWiredHttpService = (baseURL: string) => {
    const httpService = createHttpService(baseURL);
    httpService.registerRequestMiddleware((config) => {
        if (config.data && !(config.data instanceof FormData)) config.data = deepSnakeKeys(config.data);
    });
    httpService.registerResponseMiddleware((response) => {
        if (response.data && typeof response.data === 'object') response.data = deepCamelKeys(response.data);
    });
    return httpService;
};

describe('auth service', () => {
    const baseURL = 'https://api.example.com';

    describe('createAuthService', () => {
        it('should return all expected methods and properties', () => {
            // Arrange
            const httpService = createWiredHttpService(baseURL);

            // Act
            const authService = createAuthService<TestProfile>(httpService);

            // Assert
            expect(authService).toHaveProperty('isLoggedIn');
            expect(authService).toHaveProperty('user');
            expect(authService).toHaveProperty('userId');
            expect(authService).toHaveProperty('login');
            expect(authService).toHaveProperty('logout');
            expect(authService).toHaveProperty('checkIfLoggedIn');
        });

        it('should initialize with user as null', () => {
            // Arrange
            const httpService = createWiredHttpService(baseURL);

            // Act
            const authService = createAuthService<TestProfile>(httpService);

            // Assert
            expect(authService.user.value).toBeNull();
        });

        it('should initialize with isLoggedIn as false', () => {
            // Arrange
            const httpService = createWiredHttpService(baseURL);

            // Act
            const authService = createAuthService<TestProfile>(httpService);

            // Assert
            expect(authService.isLoggedIn.value).toBe(false);
        });
    });

    describe('login', () => {
        it('should set user after successful login', async () => {
            // Arrange
            const mock = new MockAdapter(axios);
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);
            const credentials = {email: 'test@example.com', password: 'password123'};
            const responseData = {id: 1, email: 'test@example.com', created_at: '2024-01-01T00:00:00Z'};
            mock.onPost(`${baseURL}/login`, credentials).reply(200, responseData);

            // Act
            await authService.login(credentials);

            // Assert
            expect(authService.user.value).toStrictEqual({
                id: 1,
                email: 'test@example.com',
                createdAt: '2024-01-01T00:00:00Z',
            });

            mock.restore();
        });

        it('should set isLoggedIn to true after successful login', async () => {
            // Arrange
            const mock = new MockAdapter(axios);
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);
            const credentials = {email: 'test@example.com', password: 'password123'};
            const responseData = {id: 1, email: 'test@example.com', created_at: '2024-01-01T00:00:00Z'};
            mock.onPost(`${baseURL}/login`, credentials).reply(200, responseData);

            // Act
            await authService.login(credentials);

            // Assert
            expect(authService.isLoggedIn.value).toBe(true);

            mock.restore();
        });

        it('should throw error on failed login', async () => {
            // Arrange
            const mock = new MockAdapter(axios);
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);
            const credentials = {email: 'test@example.com', password: 'wrongpassword'};
            mock.onPost(`${baseURL}/login`, credentials).reply(401, {message: 'Invalid credentials'});

            // Act & Assert
            await expect(authService.login(credentials)).rejects.toThrow(Error);

            mock.restore();
        });
    });

    describe('logout', () => {
        it('should set user to null after logout', async () => {
            // Arrange
            const mock = new MockAdapter(axios);
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);
            const credentials = {email: 'test@example.com', password: 'password123'};
            const responseData = {id: 1, email: 'test@example.com', created_at: '2024-01-01T00:00:00Z'};
            mock.onPost(`${baseURL}/login`, credentials).reply(200, responseData);
            mock.onPost(`${baseURL}/logout`, {}).reply(200);
            await authService.login(credentials);

            // Act
            await authService.logout();

            // Assert
            expect(authService.user.value).toBeNull();

            mock.restore();
        });

        it('should set isLoggedIn to false after logout', async () => {
            // Arrange
            const mock = new MockAdapter(axios);
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);
            const credentials = {email: 'test@example.com', password: 'password123'};
            const responseData = {id: 1, email: 'test@example.com', created_at: '2024-01-01T00:00:00Z'};
            mock.onPost(`${baseURL}/login`, credentials).reply(200, responseData);
            mock.onPost(`${baseURL}/logout`, {}).reply(200);
            await authService.login(credentials);

            // Act
            await authService.logout();

            // Assert
            expect(authService.isLoggedIn.value).toBe(false);

            mock.restore();
        });
    });

    describe('userId', () => {
        it('should return user id when logged in', async () => {
            // Arrange
            const mock = new MockAdapter(axios);
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);
            const credentials = {email: 'test@example.com', password: 'password123'};
            const responseData = {id: 42, email: 'test@example.com', created_at: '2024-01-01T00:00:00Z'};
            mock.onPost(`${baseURL}/login`, credentials).reply(200, responseData);
            await authService.login(credentials);

            // Act
            const id = authService.userId();

            // Assert
            expect(id).toBe(42);

            mock.restore();
        });

        it('should throw NotLoggedInError when not logged in', () => {
            // Arrange
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);

            // Act & Assert
            expect(() => authService.userId()).toThrow(NotLoggedInError);
        });

        it('should throw error with correct message when not logged in', () => {
            // Arrange
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);

            // Act & Assert
            expect(() => authService.userId()).toThrow('User is not logged in');
        });
    });

    describe('checkIfLoggedIn', () => {
        it('should set user when /me returns profile', async () => {
            // Arrange
            const mock = new MockAdapter(axios);
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);
            const responseData = {id: 1, email: 'test@example.com', created_at: '2024-01-01T00:00:00Z'};
            mock.onGet(`${baseURL}/me`).reply(200, responseData);

            // Act
            await authService.checkIfLoggedIn();

            // Assert
            expect(authService.user.value).toStrictEqual({
                id: 1,
                email: 'test@example.com',
                createdAt: '2024-01-01T00:00:00Z',
            });

            mock.restore();
        });

        it('should set isLoggedIn to true when /me returns profile', async () => {
            // Arrange
            const mock = new MockAdapter(axios);
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);
            const responseData = {id: 1, email: 'test@example.com', created_at: '2024-01-01T00:00:00Z'};
            mock.onGet(`${baseURL}/me`).reply(200, responseData);

            // Act
            await authService.checkIfLoggedIn();

            // Assert
            expect(authService.isLoggedIn.value).toBe(true);

            mock.restore();
        });

        it('should set user to null when /me returns 401', async () => {
            // Arrange
            const mock = new MockAdapter(axios);
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);
            mock.onGet(`${baseURL}/me`).reply(401);

            // Act
            await authService.checkIfLoggedIn();

            // Assert
            expect(authService.user.value).toBeNull();

            mock.restore();
        });

        it('should set isLoggedIn to false when /me returns 401', async () => {
            // Arrange
            const mock = new MockAdapter(axios);
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);
            mock.onGet(`${baseURL}/me`).reply(401);

            // Act
            await authService.checkIfLoggedIn();

            // Assert
            expect(authService.isLoggedIn.value).toBe(false);

            mock.restore();
        });

        it('should throw error when /me returns non-401 error', async () => {
            // Arrange
            const mock = new MockAdapter(axios);
            const httpService = createWiredHttpService(baseURL);
            const authService = createAuthService<TestProfile>(httpService);
            mock.onGet(`${baseURL}/me`).reply(500);

            // Act & Assert
            await expect(authService.checkIfLoggedIn()).rejects.toThrow(Error);

            mock.restore();
        });
    });
});
