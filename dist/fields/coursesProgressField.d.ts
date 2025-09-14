import type { ArrayField } from 'payload';
/**
 * Props for the roles field configuration
 */
type Props = {
    coursesCollectionSlug?: string;
    lessonsCollectionSlug?: string;
    quizzesCollectionSlug?: string;
    overrides?: Partial<ArrayField>;
};
/**
 * Creates a field for the courses progress
 * @param props - Configuration overrides for the field
 * @returns A configured field for the courses progress
 */
export declare const coursesProgressField: (props: Props) => ArrayField;
export {};
