import type { Config } from 'payload'

import type { LMSPluginConfig, SanitizedLMSPluginConfig } from '../types.js'
import { addressesCollection } from '../addresses/addressesCollection.js'
import { coursesCollection } from '../courses/coursesCollection.js'
import { groupsCollection } from '../groups/groupsCollection.js'
import { lessonsCollection } from '../lessons/lessonsCollection.js'
import { quizzesCollection } from '../quizzes/quizzesCollection.js'
import { categoriesCollection } from '../categoires/categoriesCollection.js'
import { tagsCollection } from '../tags/tagsCollection.js'
import { certificatesCollection } from '../certificates/certificatesCollection.js'
import { questionsCollection } from '../questions/questionsCollection.js'
import { topicsCollection } from '../topics/topicsCollection.js'
import { defaultAddressFields } from '../fields/defaultAddressFields.js'
import { sanitizePluginConfig } from '../utilities/sanitizePluginConfig.js'
import { getCollectionSlugMap } from '../utilities/getCollectionSlugMap.js'
import { studentsCollection } from '../students/studentsCollection.js'
import { defaultStudentFields } from '../fields/defaultStudentFields.js'
import { completeLessonHandler } from '../endpoints/complete-lesson.js'
import { enrollHandler } from '../endpoints/enroll.js'
import { submitQuizHandler } from '../endpoints/submit-quiz.js'
import { completeCourseHandler } from '../endpoints/complete-course.js'
import { generateCertificateHandler } from '../endpoints/generate-certificate.js'
import { addUserToGroupHandler } from '../endpoints/add-user-to-group.js'
import { fetchProgressHandler } from '../endpoints/fetch-progress.js'

export const lmsPlugin =
  (pluginConfig?: LMSPluginConfig) =>
  (incomingConfig: Config): Config => {
    if (!pluginConfig) {
      return incomingConfig
    }

    const sanitizedPluginConfig = sanitizePluginConfig({ pluginConfig })

    /**
     * Used to keep track of the slugs of collections in case they are overridden by the user.
     */
    const collectionSlugMap = getCollectionSlugMap({ sanitizedPluginConfig })

    // Ensure collections exists
    if (!incomingConfig.collections) {
      incomingConfig.collections = []
    }

    const currenciesConfig: Required<SanitizedLMSPluginConfig['currencies']> =
      sanitizedPluginConfig.currencies

    let studentsFields

    if (sanitizedPluginConfig.students) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.students === 'object'
          ? sanitizedPluginConfig.students.studentsCollection
          : undefined

      studentsFields = sanitizedPluginConfig.students.studentsFields

      if (studentsFields) {
        const students = studentsCollection({
          studentsCollectionSlug: collectionSlugMap.students,
          studentsFields: studentsFields({ defaultFields: defaultStudentFields() }),
          overrides: collectionOverrides,
        })

        incomingConfig.collections.push(students)
      }
    }

    let addressFields

    if (sanitizedPluginConfig.addresses) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.addresses === 'object'
          ? sanitizedPluginConfig.addresses.addressesCollection
          : undefined

      addressFields = sanitizedPluginConfig.addresses.addressFields

      const supportedCountries = sanitizedPluginConfig.addresses.supportedCountries

      const addresses = addressesCollection({
        addressFields: addressFields({ defaultFields: defaultAddressFields() }),
        studentsCollectionSlug: collectionSlugMap.students,
        overrides: collectionOverrides,
        supportedCountries,
      })

      incomingConfig.collections.push(addresses)
    }

    if (sanitizedPluginConfig.certificates) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.certificates === 'object'
          ? sanitizedPluginConfig.certificates.certificatesCollection
          : undefined

      const certificates = certificatesCollection({
        mediaCollectionSlug: collectionSlugMap.media,
        studentsCollectionSlug: collectionSlugMap.students,
        overrides: collectionOverrides,
      })
      incomingConfig.collections.push(certificates)
    }

    if (sanitizedPluginConfig.courses) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.courses === 'object'
          ? sanitizedPluginConfig.courses.coursesCollection
          : undefined

      const courses = coursesCollection({
        categoriesCollectionSlug: collectionSlugMap.categories,
        certificatesCollectionSlug: collectionSlugMap.certificates,
        currenciesConfig,
        lessonsCollectionSlug: collectionSlugMap.lessons,
        mediaCollectionSlug: collectionSlugMap.media,
        studentsCollectionSlug: collectionSlugMap.students,
        tagsCollectionSlug: collectionSlugMap.tags,
        overrides: collectionOverrides,
      })
      incomingConfig.collections.push(courses)
    }

    if (sanitizedPluginConfig.groups) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.groups === 'object'
          ? sanitizedPluginConfig.groups.groupsCollection
          : undefined

      const groups = groupsCollection({
        coursesCollectionSlug: collectionSlugMap.courses,
        usersCollectionSlug: collectionSlugMap.students,
        certificatesCollectionSlug: collectionSlugMap.certificates,
        overrides: collectionOverrides,
      })
      incomingConfig.collections.push(groups)
    }

    if (sanitizedPluginConfig.lessons) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.lessons === 'object'
          ? sanitizedPluginConfig.lessons.lessonsCollection
          : undefined

      const lessons = lessonsCollection({
        coursesCollectionSlug: collectionSlugMap.courses,
        mediaCollectionSlug: collectionSlugMap.media,
        quizzesCollectionSlug: collectionSlugMap.quizzes,
        categoriesCollectionSlug: collectionSlugMap.categories,
        studentsCollectionSlug: collectionSlugMap.students,
        overrides: collectionOverrides,
      })
      incomingConfig.collections.push(lessons)
    }

    if (sanitizedPluginConfig.topics) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.topics === 'object'
          ? sanitizedPluginConfig.topics.topicsCollection
          : undefined

      const topics = topicsCollection({
        coursesCollectionSlug: collectionSlugMap.courses,
        mediaCollectionSlug: collectionSlugMap.media,
        quizzesCollectionSlug: collectionSlugMap.quizzes,
        lessonsCollectionSlug: collectionSlugMap.lessons,
        overrides: collectionOverrides,
      })
      incomingConfig.collections.push(topics)
    }

    if (sanitizedPluginConfig.quizzes) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.quizzes === 'object'
          ? sanitizedPluginConfig.quizzes.quizzesCollection
          : undefined

      const quizzes = quizzesCollection({
        mediaCollectionSlug: collectionSlugMap.media,
        studentsCollectionSlug: collectionSlugMap.students,
        overrides: collectionOverrides,
      })
      incomingConfig.collections.push(quizzes)
    }

    if (sanitizedPluginConfig.categories) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.categories === 'object'
          ? sanitizedPluginConfig.categories.categoriesCollection
          : undefined

      const categories = categoriesCollection({
        overrides: collectionOverrides,
      })
      incomingConfig.collections.push(categories)
    }

    if (sanitizedPluginConfig.tags) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.tags === 'object'
          ? sanitizedPluginConfig.tags.tagsCollection
          : undefined

      const tags = tagsCollection({
        overrides: collectionOverrides,
      })
      incomingConfig.collections.push(tags)
    }

    if (sanitizedPluginConfig.questions) {
      const collectionOverrides =
        typeof sanitizedPluginConfig.questions === 'object'
          ? sanitizedPluginConfig.questions.questionsCollection
          : undefined

      const questions = questionsCollection({
        studentsCollectionSlug: collectionSlugMap.students,
        overrides: collectionOverrides,
      })
      incomingConfig.collections.push(questions)
    }

    if (sanitizedPluginConfig.endpoints) {
      incomingConfig.endpoints = [
        ...(incomingConfig.endpoints || []),
        ...sanitizedPluginConfig.endpoints,
      ]
    }

    // Add default endpoints
    const defaultEndpoints = [
      {
        path: '/lms/enroll',
        method: 'post' as const,
        handler: enrollHandler({
          userSlug: collectionSlugMap.students,
          courseSlug: collectionSlugMap.courses,
        }),
      },
      {
        path: '/lms/complete-lesson',
        method: 'post' as const, 
        handler: completeLessonHandler({
          userSlug: collectionSlugMap.students,
        }),
      },
      {
        path: '/lms/submit-quiz',
        method: 'post' as const,
        handler: submitQuizHandler({
          userSlug: collectionSlugMap.students,
          quizzesSlug: collectionSlugMap.quizzes,
        }),
      },
      {
        path: '/lms/complete-course',
        method: 'post' as const,
        handler: completeCourseHandler({
          userSlug: collectionSlugMap.students,
          courseSlug: collectionSlugMap.courses,
        }),
      },
      {
        path: '/lms/generate-certificate',
        method: 'post' as const,
        handler: generateCertificateHandler({
          userSlug: collectionSlugMap.students,
          courseSlug: collectionSlugMap.courses,
          certificatesSlug: collectionSlugMap.certificates,
        }),
      },
      {
        path: '/lms/add-user-to-group',
        method: 'post' as const,
        handler: addUserToGroupHandler({
          userSlug: collectionSlugMap.students,
          groupSlug: collectionSlugMap.groups,
        }),
      },
      {
        path: '/lms/fetch-progress',
        method: 'get' as const,
        handler: fetchProgressHandler({
          userSlug: collectionSlugMap.students,
        }),
      },
    ]

    incomingConfig.endpoints = [
      ...(incomingConfig.endpoints || []),
      ...defaultEndpoints,
    ]

    

    return {
      ...incomingConfig,
    }
  }
