import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { CollectionConfig,  Field, User } from 'payload'

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

  export type LMSPluginConfig = {
    /**
     * Configure supported currencies and default settings.
     *
     * Defaults to supporting USD.
     */
    currencies?: CurrenciesConfig
    /**
     * Slug of the collection to use for customers. Referenced in places such as courses and lessons.
     *
     * @default 'users'
     */
    studentsCollectionSlug?: string
    /**
     * Slug of the collection to use for certificates. Referenced in places such as courses and lessons.
     *
     * @default 'certificates'
     */
    certificatesCollectionSlug?: string
    
    /**
     * Slug of the collection to use for courses. Referenced in places such as courses and lessons.
     *
     * @default 'courses'
     */
    coursesCollectionSlug?: string
    /**
     * Slug of the collection to use for categories. Referenced in places such as courses and lessons.
     *
     * @default 'categories'
     */
    categoriesCollectionSlug?: string
    /**
     * Slug of the collection to use for lessons. Referenced in places such as courses and lessons.
     *
     * @default 'lessons'
     */
    lessonsCollectionSlug?: string
    /**
     * Slug of the collection to use for media. Referenced in places such as courses and lessons.
     *
     * @default 'media'
     */
    mediaCollectionSlug?: string
    /**
     * Slug of the collection to use for tags. Referenced in places such as courses and lessons.
     *
     * @default 'tags'
     */
    tagsCollectionSlug?: string
    /**
     * Slug of the collection to use for quizzes. Referenced in places such as courses and lessons.
     *
     * @default 'quizzes'
     */
    quizzesCollectionSlug?: string


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

/**
 * Type definitions for collections
 */
export type Lesson = {
  id: string
  title: string
  content: string
  excerpt?: string
  featuredImage?: string
  course?: string | Course
  lessonMaterials?: string
  progressionControl: 'required' | 'optional'
  lessonOrder?: number
  quizzes?: string[]
}

export type Course = {
  id: string
  title: string
  description: SerializedEditorState
  excerpt?: string
  featuredImage?: string
  students?: (string | User)[] | null;
  accessMode: 'open' | 'free' | 'buy now' | 'recurring' | 'closed'
  enrollmentUrl?: string
  accessExpirationDays?: number
  prerequisiteCourses?: (string | Course)[] | null;
  requiredPoints?: number
  coursePoints?: number
  navigationMode: 'linear' | 'free'
  courseMaterials?: SerializedEditorState
  certificate?: (string | Certificate) | null;
  lessons?: (string | Lesson)[] | null;
  categories?: (string | Category)[] | null;
  tags?: (string | Tag)[] | null;
}

export type Category = {
  id: string
  title: string
  slug: string
}

export type Tag = {
  id: string
  title: string
  slug: string
}

export type Certificate = {
  id: string
  title: string
  description: SerializedEditorState
  template: string
  course: (string | null) | Course;
  students: (string | User)[] | null;
  issueDate: string
  expiryDate?: string
  certificateNumber: string
  status: 'active' | 'expired' | 'revoked'
}

export type Quiz = {
  id: string
  title: string
  description?: string
  questions: (string | Question)[] | null;
  passingScore?: number
  timeLimit?: number
  attemptsAllowed?: number
  shuffleQuestions?: boolean
  showCorrectAnswers?: boolean
  status: 'draft' | 'published'
}

export type Question = {
  id: string
  title: string
  points: number
  questionType: 'multipleChoice' | 'trueFalse' | 'sorting' | 'fillInBlank' | 'assessment' | 'essay' | 'freeChoice' | 'singleChoice'
  options?: {
    text: string
    isCorrect: boolean
  }[]
  correctAnswer?: boolean
  answer?: string
  matchingPairs?: {
    left: string
    right: string
  }[]
  orderingItems?: string[]
  explanation?: string
  status: 'draft' | 'published'
}
