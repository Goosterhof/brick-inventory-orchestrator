import {deepCamelKeys, deepSnakeKeys, toCamelCaseTyped} from '@script-development/fs-helpers';

export {deepCamelKeys, deepSnakeKeys, toCamelCaseTyped};

/**
 * Convert a single snake_case (or dotted) backend field key to camelCase — the
 * per-key form of `deepCamelKeys`. Used as the `keyMapper` for `@script-development/fs-form`'s
 * `useForm`, which defaults to identity keys; this preserves the Gallery's convention of
 * addressing 422 field errors in camelCase (e.g. `set_number` → `setNumber`).
 */
export const camelKey = (key: string): string => {
    // `deepCamelKeys` returns a single-key object; read that one camelCased key back out.
    // `String(...)` coerces the `noUncheckedIndexedAccess` `string | undefined` element to a
    // plain `string` — without a `?? ''` fallback (a dead branch, since the object always has
    // exactly one key) and without `.join('')` (whose separator is a Stryker-equivalent mutant:
    // a length-1 array never exercises the separator, so no test can kill that mutation).
    const [camelCased] = Object.keys(deepCamelKeys({[key]: null}));

    return String(camelCased);
};
