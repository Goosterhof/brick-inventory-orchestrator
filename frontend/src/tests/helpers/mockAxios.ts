import {vi} from 'vitest';

export class MockAxiosError extends Error {
    response?: {status: number; data: unknown; statusText: string; headers: unknown; config: unknown};
}

export const createMockAxios = (): {
    isAxiosError: (e: unknown) => boolean;
    AxiosError: typeof Error;
    default: {create: ReturnType<typeof vi.fn>};
} => ({isAxiosError: (_e: unknown): boolean => false, AxiosError: Error, default: {create: vi.fn<() => void>()}});

export const createMockAxiosWithError = (): {
    isAxiosError: (e: unknown) => boolean;
    AxiosError: typeof MockAxiosError;
    default: {create: ReturnType<typeof vi.fn>};
} => ({
    isAxiosError: (e: unknown): boolean => e instanceof MockAxiosError,
    AxiosError: MockAxiosError,
    default: {create: vi.fn<() => void>()},
});
