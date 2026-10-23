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
  studentsCollection?: CollectionOverride
  studentsFields?: FieldsOverride
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
  addressesCollection?: CollectionOverride
  addressFields?: FieldsOverride
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
  /**
   * Minimum seconds between two attempts at the same quiz by one user. Slows down scripted
   * guessing of answers.
   *
   * @default 5
   */
  attemptCooldownSeconds?: number
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
  categories: string
  certificates: string
  coupons: string
  courses: string
  groups: string
  lessons: string
  media: string
  questions: string
  quizzes: string
  students: string
  tags: string
  topics: string
}

export type LMSPluginConfig = {
  /**
   * Slug of the collection to use for addresses. Referenced in places such as courses and lessons.
   *
   * @default 'addresses'
   */
  addresses?: AddressesConfig | boolean

  /**
     * Add a user to a group.
     *
     * @default true
     */
    addUserToGroup?:( args: {
      baseUrl?: string
      /**
       * Slug of the collection to use for coupons.
       *
       * @default 'coupons'
       */
      couponsSlug: string
      data: {
        groupId: string
        role: 'leader' | 'student'
        userId: string
      }
      /**
       * Slug of the collection to use for groups.
       *
       * @default 'groups'
       */
      groupSlug: string
      req: PayloadRequest
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
    }) => Promise<Record<string, unknown>> | Record<string, unknown>
  /**
   * Enable categories collection.
   *
   * @default true
   */
  categories?: boolean | CategoriesConfig
  /**
   * Enable certificates collection.
   *
   * @default true
   */
  certificates?: boolean | CertificateConfig

  completeCourse?:( args: {
      /**
       * Slug of the collection to use for courses.
       *
       * @default 'courses'
       */
      courseSlug: string
      data: {
        courseId: string
      }
      /**
       * Payload request object.
       */
      req: PayloadRequest
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
    }) => Promise<Record<string, unknown>> | Record<string, unknown>

  completeLesson?:( args: {
      data: {
        courseId: string
        lessonId: string
      }
      req: PayloadRequest
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
    }) => Promise<Record<string, unknown>> | Record<string, unknown>

  /**
   * Enable courses collection.
   *
   * @default true
   */
  courses?: boolean | CoursesConfig

  /**
   * Configure supported currencies and default settings.
   *
   * Defaults to supporting USD.
   */
  currencies?: CurrenciesConfig

  /**
 * An array of endpoints to be bootstrapped to Payload's API in order to support the LMS. All API paths are relative to `/api/lms`.
 */
    endpoints?: Endpoint[]
  enroll?:( args: {
      /**
       * Slug of the collection to use for courses.
       *
       * @default 'courses'
       */
      courseSlug: string
      data: {
        courseId: string
      }
      /**
       * Payload request object.
       */
      req: PayloadRequest
 
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
    }) => Promise<Record<string, unknown>> | Record<string, unknown>
  generateCertificate?:( args: {
      /**
       * Slug of the collection to use for certificates.
       *
       * @default 'certificates'
       */
           certificatesSlug: string
      /**
       * Slug of the collection to use for courses.
       *
       * @default 'courses'
       */
      courseSlug: string
      data: {
        courseId: string
      }
      req: PayloadRequest
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
    }) => Promise<Record<string, unknown>> | Record<string, unknown>
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
   * Enable questions collection.
   *
   * @default true
   */
  questions?: boolean | QuestionsConfig

    /**
   * Enable quizzes collection.
   *
   * @default true
   */
  quizzes?: boolean | QuizzesConfig

    students?: StudentsConfig

    submitQuiz?:( args: {
      data: {
        answers: Record<string, unknown>
        courseId: string
        quizId: string
      }
      /**
       * Slug of the collection to use for quizzes.
       *
       * @default 'quizzes'
       */
      quizzesSlug: string
      req: PayloadRequest
      /**
       * Slug of the collection to use for users.
       *
       * @default 'users'
       */
      userSlug: string
    }) => Promise<Record<string, unknown>> | Record<string, unknown>

    /**
   * Enable tags collection.
   *
   * @default true
   */
  tags?: boolean | TagsConfig

    /**
   * Enable topics collection.
   *
   * @default true
   */
  topics?: boolean | TopicsConfig
}

export type SanitizedLMSPluginConfig = {
  addresses?: { addressFields: FieldsOverride } & Omit<AddressesConfig, 'addressFields'>
  currencies: Required<CurrenciesConfig>
  students?: { studentsFields: FieldsOverride } & Omit<StudentsConfig, 'studentsFields'>
} & Omit<
  Required<LMSPluginConfig>,
  | 'addresses'
  | 'currencies'
  | 'students'
>
