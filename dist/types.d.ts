import type { CollectionConfig, Field } from 'payload';
export type FieldsOverride = (args: {
    defaultFields: Field[];
}) => Field[];
export type CollectionOverride = {
    fields?: FieldsOverride;
} & Partial<Omit<CollectionConfig, 'fields'>>;
export type Currency = {
    /**
     * The ISO 4217 currency code
     * @example 'aud'
     */
    code: string;
    /**
     * The number of decimal places the currency uses
     * @example 2
     */
    decimals: number;
    /**
     * A user friendly name for the currency.
     *
     * @example 'Australian Dollar'
     */
    label: string;
    /**
     * The symbol of the currency
     * @example '$'
     */
    symbol: string;
};
export type CurrenciesConfig = {
    /**
     * Defaults to the first supported currency.
     *
     * @example 'AUD'
     */
    defaultCurrency?: string;
    /**
     *
     */
    supportedCurrencies: Currency[];
};
export type CoursesConfig = {
    coursesCollection?: CollectionOverride;
};
export type LessonsConfig = {
    lessonsCollection?: CollectionOverride;
};
export type QuizzesConfig = {
    quizzesCollection?: CollectionOverride;
};
export type CategoriesConfig = {
    categoriesCollection?: CollectionOverride;
};
export type TagsConfig = {
    tagsCollection?: CollectionOverride;
};
export type CertificateConfig = {
    certificatesCollection?: CollectionOverride;
};
export type QuestionsConfig = {
    questionsCollection?: CollectionOverride;
};
export type TopicsConfig = {
    topicsCollection?: CollectionOverride;
};
export type LMSPluginConfig = {
    /**
     * Configure supported currencies and default settings.
     *
     * Defaults to supporting USD.
     */
    currencies?: CurrenciesConfig;
    /**
     * Slug of the collection to use for customers. Referenced in places such as courses and lessons.
     *
     * @default 'users'
     */
    studentsCollectionSlug?: string;
    /**
     * Slug of the collection to use for certificates. Referenced in places such as courses and lessons.
     *
     * @default 'certificates'
     */
    certificatesCollectionSlug?: string;
    /**
     * Slug of the collection to use for courses. Referenced in places such as courses and lessons.
     *
     * @default 'courses'
     */
    coursesCollectionSlug?: string;
    /**
     * Slug of the collection to use for categories. Referenced in places such as courses and lessons.
     *
     * @default 'categories'
     */
    categoriesCollectionSlug?: string;
    /**
     * Slug of the collection to use for lessons. Referenced in places such as courses and lessons.
     *
     * @default 'lessons'
     */
    lessonsCollectionSlug?: string;
    /**
     * Slug of the collection to use for topics. Referenced in places such as lessons.
     *
     * @default 'topics'
     */
    topicsCollectionSlug?: string;
    /**
     * Slug of the collection to use for media. Referenced in places such as courses and lessons.
     *
     * @default 'media'
     */
    mediaCollectionSlug?: string;
    /**
     * Slug of the collection to use for tags. Referenced in places such as courses and lessons.
     *
     * @default 'tags'
     */
    tagsCollectionSlug?: string;
    /**
     * Slug of the collection to use for quizzes. Referenced in places such as courses and lessons.
     *
     * @default 'quizzes'
     */
    quizzesCollectionSlug?: string;
    /**
     * Enable courses collection.
     *
     * @default true
     */
    courses?: boolean | CoursesConfig;
    /**
     * Enable lessons collection.
     *
     * @default true
     */
    lessons?: boolean | LessonsConfig;
    /**
     * Enable topics collection.
     *
     * @default true
     */
    topics?: boolean | TopicsConfig;
    /**
     * Enable quizzes collection.
     *
     * @default true
     */
    quizzes?: boolean | QuizzesConfig;
    /**
     * Enable categories collection.
     *
     * @default true
     */
    categories?: boolean | CategoriesConfig;
    /**
     * Enable tags collection.
     *
     * @default true
     */
    tags?: boolean | TagsConfig;
    /**
     * Enable certificates collection.
     *
     * @default true
     */
    certificates?: boolean | CertificateConfig;
    /**
     * Enable questions collection.
     *
     * @default true
     */
    questions?: boolean | QuestionsConfig;
    /**
     * Add custom fields to collections
     */
    customFields?: {
        [key: string]: Field[];
    };
};
