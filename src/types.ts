import type { CollectionConfig, Field } from 'payload'

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

export type QuestionsConfig = {
  questionsCollection?: CollectionOverride
}

export type TopicsConfig = {
  topicsCollection?: CollectionOverride
}

export type CollectionSlugMap = {
  addresses: string
  courses: string
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
}

export type SanitizedLMSPluginConfig = {
  students?: { studentsFields: FieldsOverride } & Omit<StudentsConfig, 'studentsFields'>
  addresses?: { addressFields: FieldsOverride } & Omit<AddressesConfig, 'addressFields'>
} & Omit<
  Required<LMSPluginConfig>,
  | 'students'    
  | 'addresses'
>
