import type { ArrayField, Field } from 'payload';
type AddressType = (options?: {
    overrides?: Partial<ArrayField>;
}) => Field;
export declare const address: AddressType;
export {};
