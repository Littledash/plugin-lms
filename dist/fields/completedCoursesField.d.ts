import type { JoinField } from 'payload';
/**
 * Props for the roles field configuration
 */
type Props = {
    coursesCollectionSlug?: string;
    studentsCollectionSlug?: string;
    overrides?: Partial<JoinField>;
};
/**
 * Creates a relationship field for completed courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for completed courses
 */
export declare const completedCoursesField: (props: Props) => JoinField;
export {};
