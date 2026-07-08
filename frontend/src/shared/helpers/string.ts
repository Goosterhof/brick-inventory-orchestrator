import {deepCamelKeys, deepSnakeKeys, toCamelCaseTyped} from '@script-development/fs-helpers';

export {deepCamelKeys, deepSnakeKeys, toCamelCaseTyped};

/**
 * Convert a single snake_case (or dotted) backend field key to camelCase — the
 * per-key form of `deepCamelKeys`. Used as the `keyMapper` for `@script-development/fs-form`'s
 * `useForm`, which defaults to identity keys; this preserves the Gallery's convention of
 * addressing 422 field errors in camelCase (e.g. `set_number` → `setNumber`).
 */
export const camelKey = (key: string): string =>
    // `deepCamelKeys` transforms the single key in place; joining the (always single-element)
    // key list reads it back as a plain string without a nullable index access — keeping the
    // helper branch-free for the Gallery's 100%-coverage gate.
    Object.keys(deepCamelKeys({[key]: null})).join('');
