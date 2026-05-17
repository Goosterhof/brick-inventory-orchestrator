/**
 * Lightweight in-memory HTTP service for integration tests.
 *
 * Replaces the @script-development/fs-http transport layer with an in-memory
 * route table. Stores, adapters, translation, and registered request/response
 * middleware all run real — only the network transport is replaced.
 *
 * Concretely: when a domain page registers a snake_case fixture via
 * `mockServer.onGet(...)`, the registered response middleware (e.g. the
 * camelCase converter wired by `familyHttpService`) runs against the response
 * before it reaches the page, exactly as it would in production. Similarly,
 * request payloads pass through registered request middleware so a future test
 * that asserts on the snake_case shape sent to the wire will see faithful
 * conversion. This is the regression safety net for ADR-016.
 *
 * Note: error-response middleware (`registerResponseErrorMiddleware`) is
 * recorded but not invoked here — `resolveRoute` only models the success path
 * for now. If a test ever needs to simulate a 4xx/5xx, this helper grows then.
 *
 * Usage in test files:
 *
 *   import {mockHttpService, mockServer} from "../helpers/mock-server";
 *
 *   vi.mock("@script-development/fs-http", async () => {
 *       const {mockHttpService} = await import("../helpers/mock-server");
 *       return {createHttpService: () => mockHttpService};
 *   });
 *
 *   beforeEach(() => mockServer.reset());
 *   mockServer.onGet("storage-options", [...]); // register before mount
 */

type RouteHandler = unknown;

type MockResponse<T> = {data: T; status: number; statusText: string; headers: object; config: object};
type MockRequestConfig = {data: unknown};

type RequestMiddleware = (config: MockRequestConfig) => void;
type ResponseMiddleware = (response: MockResponse<unknown>) => void;
type ResponseErrorMiddleware = (error: unknown) => void;

const routes = {
    GET: new Map<string, RouteHandler>(),
    POST: new Map<string, RouteHandler>(),
    PUT: new Map<string, RouteHandler>(),
    PATCH: new Map<string, RouteHandler>(),
    DELETE: new Map<string, RouteHandler>(),
};

const requestMiddleware: RequestMiddleware[] = [];
const responseMiddleware: ResponseMiddleware[] = [];
const responseErrorMiddleware: ResponseErrorMiddleware[] = [];

const makeResponse = <T>(data: T): MockResponse<T> => ({data, status: 200, statusText: 'OK', headers: {}, config: {}});

const applyRequestMiddleware = (data: unknown): void => {
    if (requestMiddleware.length === 0) return;
    const config: MockRequestConfig = {data};
    for (const middleware of requestMiddleware) middleware(config);
};

const applyResponseMiddleware = <T>(response: MockResponse<T>): MockResponse<T> => {
    for (const middleware of responseMiddleware) middleware(response as MockResponse<unknown>);
    return response;
};

const resolveRoute = <T>(method: keyof typeof routes, endpoint: string, data?: unknown): Promise<MockResponse<T>> => {
    const handler = routes[method].get(endpoint);
    if (handler === undefined) {
        return Promise.reject(new Error(`[mock-server] No ${method} handler registered for "${endpoint}"`));
    }
    applyRequestMiddleware(data);
    return Promise.resolve(applyResponseMiddleware(makeResponse(handler as T)));
};

const unregister = <T>(array: T[], item: T) => {
    return () => {
        const index = array.indexOf(item);
        if (index > -1) array.splice(index, 1);
    };
};

/**
 * The mock HTTP service implementing the HttpService interface from
 * @script-development/fs-http. Backed by in-memory route table.
 *
 * Middleware registration retains the registered functions and applies them
 * on each route resolution — request middleware runs against a config-like
 * object before the route lookup; response middleware runs against the
 * response object before it is resolved to the caller. Error-response
 * middleware is retained for future use but is not invoked because the
 * mock currently only models the success path.
 */
export const mockHttpService = {
    getRequest: <T = unknown>(endpoint: string) => resolveRoute<T>('GET', endpoint),
    postRequest: <T = unknown>(endpoint: string, data: unknown) => resolveRoute<T>('POST', endpoint, data),
    putRequest: <T = unknown>(endpoint: string, data: unknown) => resolveRoute<T>('PUT', endpoint, data),
    patchRequest: <T = unknown>(endpoint: string, data: unknown) => resolveRoute<T>('PATCH', endpoint, data),
    deleteRequest: <T = unknown>(endpoint: string) => resolveRoute<T>('DELETE', endpoint),
    downloadRequest: () => Promise.reject(new Error('[mock-server] downloadRequest not implemented')),
    previewRequest: () => Promise.reject(new Error('[mock-server] previewRequest not implemented')),
    streamRequest: () => Promise.reject(new Error('[mock-server] streamRequest not implemented')),
    registerRequestMiddleware: (fn: RequestMiddleware) => {
        requestMiddleware.push(fn);
        return unregister(requestMiddleware, fn);
    },
    registerResponseMiddleware: (fn: ResponseMiddleware) => {
        responseMiddleware.push(fn);
        return unregister(responseMiddleware, fn);
    },
    registerResponseErrorMiddleware: (fn: ResponseErrorMiddleware) => {
        responseErrorMiddleware.push(fn);
        return unregister(responseErrorMiddleware, fn);
    },
};

/**
 * Route registration and lifecycle API for tests.
 */
export const mockServer = {
    /** Register a GET route. Call before mounting the component. */
    onGet: (endpoint: string, responseData: unknown): void => {
        routes.GET.set(endpoint, responseData);
    },

    /** Register a POST route. */
    onPost: (endpoint: string, responseData: unknown): void => {
        routes.POST.set(endpoint, responseData);
    },

    /** Register a PUT route. */
    onPut: (endpoint: string, responseData: unknown): void => {
        routes.PUT.set(endpoint, responseData);
    },

    /** Register a PATCH route. */
    onPatch: (endpoint: string, responseData: unknown): void => {
        routes.PATCH.set(endpoint, responseData);
    },

    /** Register a DELETE route. */
    onDelete: (endpoint: string, responseData?: unknown): void => {
        routes.DELETE.set(endpoint, responseData);
    },

    /**
     * Clear all registered routes. Call in beforeEach.
     *
     * Registered middleware is intentionally NOT cleared here — in production,
     * `familyHttpService` registers its snake↔camel middleware once at module
     * load and the registration lives for the lifetime of the app. Mirroring
     * that, the mock keeps middleware across tests so the second test in a
     * file doesn't silently lose the conversion the first test had.
     *
     * Use `clearMiddleware()` separately if a test needs a clean slate.
     */
    reset: (): void => {
        for (const map of Object.values(routes)) {
            map.clear();
        }
    },

    /**
     * Clear all registered middleware. Rarely needed — the production wiring
     * registers middleware at module-load time and never tears it down. Use
     * this only when a test specifically wants to assert behavior with no
     * middleware registered.
     */
    clearMiddleware: (): void => {
        requestMiddleware.length = 0;
        responseMiddleware.length = 0;
        responseErrorMiddleware.length = 0;
    },
};
