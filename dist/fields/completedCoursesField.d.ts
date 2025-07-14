import type { RelationshipField } from 'payload';
/**
 * Props for the roles field configuration
 */
type Props = {
    overrides?: Partial<RelationshipField>;
};
/**
 * Creates a relationship field for completed courses
 * @param props - Configuration overrides for the field
 * @returns A configured relationship field for completed courses
 */
export declare const completedCoursesField: (props: Props) => RelationshipField;
export {};
