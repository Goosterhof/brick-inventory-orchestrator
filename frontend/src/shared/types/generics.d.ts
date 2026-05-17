import type {Item} from '@shared/types/item';

/**
 * Omits id, createdAt, and updatedAt from item
 * Being used when items are being created, because they don't have these fields yet
 */
export type New<T extends Item> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Union type representing either a new resource (without id) or an existing resource (with id).
 * Used for forms that can handle both creation and updates.
 */
export type Updatable<T extends Item> = New<T> | T;

/**
 * Removes undefined from tuples
 */
export type FilterUndefined<T extends unknown[]> = T extends []
    ? []
    : T extends [infer H, ...infer R]
      ? H extends undefined
          ? FilterUndefined<R>
          : [H, ...FilterUndefined<R>]
      : T;
