import type { ArrayField } from 'payload';
/**
 * Props for the certificates field configuration
 */
type Props = {
    certificatesCollectionSlug?: string;
    coursesCollectionSlug?: string;
    overrides?: Partial<ArrayField>;
};
/**
 * Creates an array field for certificates with certificate and completed date
 * @param props - Configuration overrides for the field
 * @returns A configured array field for certificates
 */
export declare const certificatesField: (props: Props) => ArrayField;
export {};
