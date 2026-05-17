import type {Mock} from 'vitest';
import type {ComputedRef, Ref} from 'vue';

type SimplifyRef<T> = T extends ComputedRef<infer V> ? {value: V} : T extends Ref<infer V> ? {value: V} : T;

export type MockedService<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => infer R ? Mock<(...args: A) => R> : SimplifyRef<T[K]>;
};
