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
 * conversion. This is the regression safety net for ADR-0029.
 *
 * Error responses: `mockServer.onPostError(endpoint, status, data)` registers
 * a rejecting route. Resolution builds an axios-shaped error (`isAxiosError`
 * flag + `response.{status,data}`), runs the registered error-response
 * middleware against it (e.g. fs-form's 422 field-error binder), then rejects
 * with it — the same order as fs-http's real error interceptor chain. Error
 * data intentionally bypasses the success response middleware, mirroring real
 * axios where interceptor success handlers never see rejected responses (which
 * is why fs-form consumers pass a `keyMapper` for snake_case error keys).
 *
 * Usage in test files:
 *
 *   import {mockHttpService, mockServer} from "../helpers/mock-server";
 *
 *   vi.mock("@script-development/fs-http", async () => {
 *       const {guarded, mockHttpService} = await import("../helpers/mock-server");
 *       return {createHttpService: () => mockHttpService, guarded};
 *   });
 *
 *   beforeEach(() => mockServer.reset());
 *   mockServer.onGet("storage-options", [...]); // register before mount
 *
 * Every handled request is recorded — method, endpoint, and the body AFTER
 * request middleware ran (i.e. the wire shape: snake_case per ADR-0029).
 * Flow tests assert side effects via `mockServer.callsTo("POST", "/login")`.
 */

type RouteHandler = unknown;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RecordedCall = {method: HttpMethod; endpoint: string; body: unknown};

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

const recordedCalls: RecordedCall[] = [];

const makeResponse = <T>(data: T): MockResponse<T> => ({data, status: 200, statusText: 'OK', headers: {}, config: {}});

/** Marker wrapper: a route registered with this handler rejects instead of resolving. */
class MockErrorRoute {
    constructor(
        readonly status: number,
        readonly data: unknown,
    ) {}
}

type AxiosShapedError = Error & {isAxiosError: boolean; response: MockResponse<unknown>};

const makeAxiosError = (status: number, data: unknown): AxiosShapedError => {
    const error = new Error(`Request failed with status code ${status}`) as AxiosShapedError;
    error.isAxiosError = true;
    error.response = {data, status, statusText: '', headers: {}, config: {}};
    return error;
};

/**
 * Runs registered request middleware against a config-like object and returns
 * the resulting body — the wire shape (e.g. snake_case after the ADR-0029
 * conversion middleware wired by `familyHttpService`).
 */
const applyRequestMiddleware = (data: unknown): unknown => {
    const config: MockRequestConfig = {data};
    for (const middleware of requestMiddleware) middleware(config);
    return config.data;
};

const applyResponseMiddleware = <T>(response: MockResponse<T>): MockResponse<T> => {
    for (const middleware of responseMiddleware) middleware(response);
    return response;
};

const resolveRoute = <T>(method: keyof typeof routes, endpoint: string, data?: unknown): Promise<MockResponse<T>> => {
    const handler = routes[method].get(endpoint);
    if (handler === undefined) {
        return Promise.reject(new Error(`[mock-server] No ${method} handler registered for "${endpoint}"`));
    }
    const body = applyRequestMiddleware(data);
    recordedCalls.push({method, endpoint, body});
    if (handler instanceof MockErrorRoute) {
        const error = makeAxiosError(handler.status, handler.data);
        for (const middleware of responseErrorMiddleware) middleware(error);
        return Promise.reject(error);
    }
    return Promise.resolve(applyResponseMiddleware(makeResponse(handler as T)));
};

const unregister = <T>(array: T[], item: T) => {
    return () => {
        const index = array.indexOf(item);
        if (index > -1) array.splice(index, 1);
    };
};

/**
 * Faithful stand-in for fs-http's `guarded()` middleware wrapper: the body is
 * try/caught so a throwing middleware cannot corrupt the transport chain, and
 * the swallowed throw is surfaced loudly by default — the same contract as
 * the real implementation. Kept local (rather than pulled via importOriginal)
 * so the wholesale fs-http mock keeps the real fs-http/axios modules out of
 * the integration import chain (ADR-0012 test isolation).
 */
/**
 * Faithful stand-in for fs-http's re-exported axios `isAxiosError`: real axios
 * checks `payload.isAxiosError === true`, and errors built by `makeAxiosError`
 * carry that flag. fs-form's `handleSubmit` calls this to decide whether a
 * rejection is a swallowable 422 — spec files whose fs-http mock factory omits
 * it would throw `isAxiosError is not a function` on the first error response.
 */
export const isAxiosError = (error: unknown): boolean =>
    typeof error === 'object' && error !== null && (error as {isAxiosError?: unknown}).isAxiosError === true;

export const guarded = <T>(fn: (arg: T) => void, onError?: (error: unknown) => void): ((arg: T) => void) => {
    return (arg: T) => {
        try {
            fn(arg);
        } catch (error) {
            if (onError) {
                onError(error);
                return;
            }
            // eslint-disable-next-line no-console -- mirrors fs-http guarded()'s loud default handler
            console.error('[fs-http] middleware body threw and was swallowed by guarded():', error);
        }
    };
};

/**
 * The mock HTTP service implementing the HttpService interface from
 * @script-development/fs-http. Backed by in-memory route table.
 *
 * Middleware registration retains the registered functions and applies them
 * on each route resolution — request middleware runs against a config-like
 * object before the route lookup; response middleware runs against the
 * response object before it is resolved to the caller; error-response
 * middleware runs against the axios-shaped error of routes registered via
 * `on*Error` before the rejection reaches the caller.
 */
export const mockHttpService = {
    getRequest: <T = unknown>(endpoint: string) => resolveRoute<T>('GET', endpoint),
    postRequest: <T = unknown>(endpoint: string, data: unknown) => resolveRoute<T>('POST', endpoint, data),
    putRequest: <T = unknown>(endpoint: string, data: unknown) => resolveRoute<T>('PUT', endpoint, data),
    patchRequest: <T = unknown>(endpoint: string, data: unknown) => resolveRoute<T>('PATCH', endpoint, data),
    deleteRequest: <T = unknown>(endpoint: string) => resolveRoute<T>('DELETE', endpoint),
    downloadRequest: () => Promise.reject(new Error('[mock-server] downloadRequest not implemented')),
    previewRequest: () => Promise.reject(new Error('[mock-server] previewRequest not implemented')),
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

    /**
     * Register a GET route that rejects with an axios-shaped error carrying
     * `response.{status,data}` (see `onPostError`). Lets flow tests simulate
     * mid-session auth loss (401) or an unreachable endpoint (5xx / boot-time
     * `/me` failure) on read paths, exercising registered error-response
     * middleware such as the auth 401 recovery.
     */
    onGetError: (endpoint: string, status: number, data: unknown): void => {
        routes.GET.set(endpoint, new MockErrorRoute(status, data));
    },

    /** Register a POST route. */
    onPost: (endpoint: string, responseData: unknown): void => {
        routes.POST.set(endpoint, responseData);
    },

    /**
     * Register a POST route that rejects with an axios-shaped error carrying
     * `response.{status,data}`. Registered error-response middleware runs
     * against the error before the rejection reaches the caller — so e.g. a
     * 422 with `{errors: {field: ['message']}}` exercises fs-form's real
     * validation-error binding.
     */
    onPostError: (endpoint: string, status: number, data: unknown): void => {
        routes.POST.set(endpoint, new MockErrorRoute(status, data));
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
     * All handled requests recorded so far, in order — method, endpoint, and
     * the body as it would hit the wire (after request middleware, so
     * snake_case per ADR-0029). Returns a snapshot copy.
     */
    calls: (): readonly RecordedCall[] => [...recordedCalls],

    /**
     * The recorded requests matching a method + endpoint. The primary
     * side-effect assertion hook for flow tests:
     *
     *   expect(mockServer.callsTo('POST', '/login')).toHaveLength(1);
     */
    callsTo: (method: HttpMethod, endpoint: string): readonly RecordedCall[] =>
        recordedCalls.filter((call) => call.method === method && call.endpoint === endpoint),

    /**
     * Clear all registered routes and recorded calls. Call in beforeEach.
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
        recordedCalls.length = 0;
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
