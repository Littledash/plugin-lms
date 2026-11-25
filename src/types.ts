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

export type CanSelfEnrollArgs = {
  /** The course at depth 0 */
  course: { [key: string]: unknown; id: number | string }
  req: PayloadRequest
  /** The logged-in user asking to enroll */
  user: NonNullable<PayloadRequest['user']>
}

/**
 * Decides whether the logged-in user may enroll themselves in a course through
 * `POST /api/lms/enroll`. Called only after the course passed the built-in check (published, access
 * mode `open` or `free`), so it can refuse but never allow more. Admins are not checked.
 */
export type CanSelfEnroll = (args: CanSelfEnrollArgs) => boolean | Promise<boolean>

export type CoursesConfig = {
  /**
   * Refuses self-enrollment beyond the access mode, for example in a course a paid product sells
   * even if its access mode was left `open`. A refusal returns 403 "This course requires a purchase."
   * Server-side `enrollUser` (purchases, coupons, renewals) is not affected.
   */
  canSelfEnroll?: CanSelfEnroll
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

export type DocumentsConfig = {
  documentsCollection?: CollectionOverride
}

export type CourseFilesConfig = {
  courseFilesCollection?: CollectionOverride
}

/**
 * A PDF font: the name of one of the 14 standard PDF fonts (no file needed, Latin text only), or the
 * bytes of a TrueType or OpenType file, which also prints the characters the file covers.
 */
export type CertificateFont =
  | 'Courier'
  | 'Courier-Bold'
  | 'Courier-BoldOblique'
  | 'Courier-Oblique'
  | 'Helvetica'
  | 'Helvetica-Bold'
  | 'Helvetica-BoldOblique'
  | 'Helvetica-Oblique'
  | 'Times-Bold'
  | 'Times-BoldItalic'
  | 'Times-Italic'
  | 'Times-Roman'
  | ArrayBuffer
  | Uint8Array

/**
 * Changes to the built-in certificate layout. Every property is optional and defaults to the layout
 * described in docs/how-to/certificates.md. Positions and sizes are in PDF points (1/72 inch) with
 * the origin at the bottom left of the page; A4 landscape is 842 × 595.
 */
export type CertificateLayout = {
  /**
   * The centred block: the intro line, student name, description, course title and presenter. Its
   * lines below the student name shrink together, down to half size, until the last one is at or
   * above `bottom`.
   */
  body?: {
    /** Lowest baseline, clear of logos or signatures on the template. @default 165 */
    bottom?: number
    /** Horizontal centre, as a fraction of the page width. @default 0.5 */
    center?: number
    /** Width lines wrap to, as a fraction of the page width. @default 0.7 */
    maxWidth?: number
    /** Font sizes before shrinking. Gaps between lines scale with them. */
    sizes?: {
      /** @default 24 */
      courseTitle?: number
      /** @default 20 */
      description?: number
      /** @default 20 */
      intro?: number
      /** @default 16 */
      presentedBy?: number
      /** @default 18 */
      presenter?: number
      /** @default 22 */
      studentName?: number
    }
    /** Distance from the top of the page to the intro line's baseline. @default 190 */
    top?: number
  }
  /** Text colours as `#rrggbb`. */
  colors?: {
    /** @default '#4054a5' */
    courseTitle?: string
    /** @default '#cc3366' */
    studentName?: string
    /** Every other line. @default '#000000' */
    text?: string
  }
  /** The completion date, right-aligned at `right` points from the right edge. `false` leaves it out. */
  date?:
    | {
        /** Formats the award's completion date. Overrides `locale`. */
        format?: (date: Date) => string
        /** Locale for `toLocaleDateString`, printed as day, long month and year. @default 'en-US' */
        locale?: string
        /** @default 150 */
        right?: number
        /** @default 12 */
        size?: number
        /** Baseline. @default 100 */
        y?: number
      }
    | false
  fonts?: {
    /** Student name, course title and description headings. @default 'Helvetica-Bold' */
    bold?: CertificateFont
    /** @default 'Helvetica' */
    regular?: CertificateFont
  }
  /** Page size as `[width, height]`. @default [842, 595] */
  pageSize?: [number, number]
  /** Fixed wording. An empty string leaves that line out. */
  text?: {
    /** Printed when the certificate has no description. @default 'Certificate of Completion' */
    defaultDescription?: string
    /** Above the student name. @default 'this certifies that' */
    intro?: string
    /** Above the presenter. @default 'presented by' */
    presentedBy?: string
  }
}

export type CertificateLayoutArgs = {
  /** The certificate at depth 1 */
  certificate: { [key: string]: unknown; id: number | string }
  /** The course at depth 0 */
  course: { [key: string]: unknown; id: number | string }
  req: PayloadRequest
  /** The student at depth 0 */
  student: { [key: string]: unknown; id: number | string }
}

export type CertificateRenderArgs = {
  /** The award's completion date. */
  completedDate: Date
  /** `completedDate` formatted by the layout's `date` settings. */
  completionDate: string
  courseTitle: string
  /** The certificate's description: Lexical rich text, a string, or undefined. */
  description: unknown
  /** The resolved layout. */
  layout: CertificateLayout
  /** The certificate's presenter name, else the first author's name. */
  presenterName?: string
  /** Renders the built-in certificate, with `layout` merged over the resolved layout. */
  renderDefault: (layout?: CertificateLayout) => Promise<Uint8Array>
  /** The first and last name. */
  studentName: string
  /** The template image's URL, or an empty string. */
  templateImage: string
} & CertificateLayoutArgs

export type CertificateConfig = {
  certificatesCollection?: CollectionOverride
  /**
   * Changes the built-in layout. A function is called for each certificate, so the layout can
   * depend on fields you add to the certificates collection.
   */
  layout?:
    | ((args: CertificateLayoutArgs) => CertificateLayout | Promise<CertificateLayout>)
    | CertificateLayout
  /**
   * Replaces the built-in PDF. Return the PDF bytes, for example from pdf-lib or a headless
   * browser. Call `renderDefault` to start from the built-in certificate instead.
   */
  render?: (args: CertificateRenderArgs) => Promise<Uint8Array> | Uint8Array
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
  courseFiles: string
  courses: string
  documents: string
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
   * Protected uploads for lesson materials (`course-files`). A lesson's downloadable files are
   * stored here and unlock with the lesson: enrollment, release, order and access expiry apply.
   * When turned off, lessons fall back to the media collection, which is usually public.
   *
   * @default true
   */
  courseFiles?: boolean | CourseFilesConfig

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
   * Private uploads collection (`documents`). Generated certificates are stored here, readable only
   * by the student and staff. Sites can use it for any upload that must not be public.
   *
   * @default true
   */
  documents?: boolean | DocumentsConfig
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

    /**
   * How many calls to `/api/lms/*` one logged-in user may make in a window. `max: 0` disables it.
   *
   * @default { max: 60, windowSeconds: 60 }
   */
  rateLimit?: {
    max?: number
    windowSeconds?: number
  }

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
