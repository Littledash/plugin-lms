import type { JoinField } from 'payload';
/**
 * Props for the roles field configuration
 */
type Props = {
    coursesCollectionSlug?: string;
    overrides?: Partial<JoinField>;
    studentsCollectionSlug?: string;
};
/**
 * Creates a relationship field for enrolled courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for enrolled courses
 */
export declare const enrolledCoursesField: (props: Props) => JoinField;
export {};
