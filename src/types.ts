import type { CollectionConfig, Endpoint, Field, PayloadRequest } from 'payload'

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]
export type CollectionOverride = { fields?: FieldsOverride } & Partial<
  Omit<CollectionConfig, 'fields'>
>

export type Currency = {
  /**
   * The ISO 4217 currency code
   * @example 'aud'
   */
  code: string
  /**
   * The number of decimal places the currency uses
   * @example 2
   */
  decimals: number
  /**
   * A user friendly name for the currency.
   *
   * @example 'Australian Dollar'
   */
  label: string
  /**
   * The symbol of the currency
   * @example '$'
   */
  symbol: string
}

export type CountryType = {
  /**
   * A user friendly name for the country.
   */
  label: string
  /**
   * The ISO 3166-1 alpha-2 country code.
   * @example 'AU'
   */
  value: string
}

export type StudentsConfig = {
  slug?: string
  studentsFields?: FieldsOverride
  studentsCollection?: CollectionOverride
}

export type CurrenciesConfig = {
  /**
   * Defaults to the first supported currency.
   *
   * @example 'AUD'
   */
  defaultCurrency?: string
  /**
   *
   */
  supportedCurrencies: Currency[]
}

export type AddressesConfig = {
  addressFields?: FieldsOverride
  addressesCollection?: CollectionOverride
  supportedCountries?: CountryType[]
}

export type CoursesConfig = {
  coursesCollection?: CollectionOverride
}

export type GroupsConfig = {
  groupsCollection?: CollectionOverride
}

export type LessonsConfig = {
  lessonsCollection?: CollectionOverride
}

export type QuizzesConfig = {
  quizzesCollection?: CollectionOverride
}

export type CategoriesConfig = {
  categoriesCollection?: CollectionOverride
}

export type TagsConfig = {
  tagsCollection?: CollectionOverride
}

export type CertificateConfig = {
  certificatesCollection?: CollectionOverride
}

export type QuestionTypeOption = {
  label: string
  value: string
}

export type QuestionsConfig = {
  questionsCollection?: CollectionOverride
  questionTypes?: QuestionTypeOption[]
}

export type TopicsConfig = {
  topicsCollection?: CollectionOverride
}

export type CollectionSlugMap = {
  addresses: string
  courses: string
  groups: string
  lessons: string
  quizzes: string
  categories: string
  tags: string
  certificates: string
  questions: string
  topics: string
  media: string
  students: string
}

export type LMSPluginConfig = {
  /**
   * Configure supported currencies and default settings.
   *
   * Defaults to supporting USD.
   */
  currencies?: CurrenciesConfig

  students?: StudentsConfig
  /**
   * Slug of the collection to use for addresses. Referenced in places such as courses and lessons.
   *
   * @default 'addresses'
   */
  addresses?: boolean | AddressesConfig
  /**
   * Enable courses collection.
   *
   * @default true
   */
  courses?: boolean | CoursesConfig

  /**
   * Enable groups collection.
   *
   * @default true
   */
  groups?: boolean | GroupsConfig

  /**
   * Enable lessons collection.
   *
   * @default true
   */
  lessons?: boolean | LessonsConfig

  /**
   * Enable topics collection.
   *
   * @default true
   */
  topics?: boolean | TopicsConfig

  /**
   * Enable quizzes collection.
   *
   * @default true
   */
  quizzes?: boolean | QuizzesConfig

  /**
   * Enable categories collection.
   *
   * @default true
   */
  categories?: boolean | CategoriesConfig
  /**
   * Enable tags collection.
   *
   * @default true
   */
  tags?: boolean | TagsConfig
  /**
   * Enable certificates collection.
   *
   * @default true
   */
  certificates?: boolean | CertificateConfig
  /**
   * Enable questions collection.
   *
   * @default true
   */
  questions?: boolean | QuestionsConfig

  /**
 * An array of endpoints to be bootstrapped to Payload's API in order to support the LMS. All API paths are relative to `/api/lms`.
 */
    endpoints?: Endpoint[]

    completeCourse?:( args: {
      data: {
        courseId: string
      }
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
      /**
       * Slug of the collection to use for courses.
       *
       * @default 'courses'
       */
      courseSlug: string
      /**
       * Payload request object.
       */
      req: PayloadRequest
    }) => Promise<Record<string, unknown>> | Record<string, unknown>

    completeLesson?:( args: {
      data: {
        courseId: string
        lessonId: string
      }
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
      req: PayloadRequest
    }) => Promise<Record<string, unknown>> | Record<string, unknown>

    submitQuiz?:( args: {
      data: {
        courseId: string
        quizId: string
        answers: Record<string, unknown>
      }
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
      /**
       * Slug of the collection to use for quizzes.
       *
       * @default 'quizzes'
       */
      quizzesSlug: string
      req: PayloadRequest
    }) => Promise<Record<string, unknown>> | Record<string, unknown>

    generateCertificate?:( args: {
      data: {
        courseId: string
      }
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
      /**
       * Slug of the collection to use for courses.
       *
       * @default 'courses'
       */
      courseSlug: string
      /**
       * Slug of the collection to use for certificates.
       *
       * @default 'certificates'
       */
           certificatesSlug: string
      req: PayloadRequest
    }) => Promise<Record<string, unknown>> | Record<string, unknown>

    enroll?:( args: {
      data: {
        courseId: string
      }
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
      /**
       * Slug of the collection to use for courses.
       *
       * @default 'courses'
       */
      courseSlug: string
 
      /**
       * Payload request object.
       */
      req: PayloadRequest
    }) => Promise<Record<string, unknown>> | Record<string, unknown>

    /**
     * Add a user to a group.
     *
     * @default true
     */
    addUserToGroup?:( args: {
      data: {
        groupId: string
        userId: string
        role: 'leader' | 'student'
      }
      req: PayloadRequest
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
      /**
       * Slug of the collection to use for groups.
       *
       * @default 'groups'
       */
      groupSlug: string
      baseUrl?: string
    }) => Promise<Record<string, unknown>> | Record<string, unknown>
}

export type SanitizedLMSPluginConfig = {
  students?: { studentsFields: FieldsOverride } & Omit<StudentsConfig, 'studentsFields'>
  addresses?: { addressFields: FieldsOverride } & Omit<AddressesConfig, 'addressFields'>
  currencies: Required<CurrenciesConfig>
} & Omit<
  Required<LMSPluginConfig>,
  | 'students'
  | 'addresses'
  | 'currencies'
>
