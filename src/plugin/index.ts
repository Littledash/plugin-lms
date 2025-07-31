import type { Config } from 'payload'

import type { LMSPluginConfig, SanitizedLMSPluginConfig } from '../types.js'
import { addressesCollection } from '../addresses/addressesCollection.js'
import { coursesCollection } from '../courses/coursesCollection.js'
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
      console.log('studentsFields', studentsFields)

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
      const certificates = certificatesCollection({
        mediaCollectionSlug: collectionSlugMap.media,
        studentsCollectionSlug: collectionSlugMap.students,
      })
      incomingConfig.collections.push(certificates)
    }

    if (sanitizedPluginConfig.courses) {
      const courses = coursesCollection({
        categoriesCollectionSlug: collectionSlugMap.categories,
        certificatesCollectionSlug: collectionSlugMap.certificates,
        currenciesConfig,
        lessonsCollectionSlug: collectionSlugMap.lessons,
        mediaCollectionSlug: collectionSlugMap.media,
        studentsCollectionSlug: collectionSlugMap.students,
        tagsCollectionSlug: collectionSlugMap.tags,
      })
      incomingConfig.collections.push(courses)
    }

    if (sanitizedPluginConfig.lessons) {
      const lessons = lessonsCollection({
        coursesCollectionSlug: collectionSlugMap.courses,
        mediaCollectionSlug: collectionSlugMap.media,
        quizzesCollectionSlug: collectionSlugMap.quizzes,
        categoriesCollectionSlug: collectionSlugMap.categories,
        studentsCollectionSlug: collectionSlugMap.students,
      })
      incomingConfig.collections.push(lessons)
    }

    if (sanitizedPluginConfig.topics) {
      const topics = topicsCollection({
        coursesCollectionSlug: collectionSlugMap.courses,
        mediaCollectionSlug: collectionSlugMap.media,
        quizzesCollectionSlug: collectionSlugMap.quizzes,
        lessonsCollectionSlug: collectionSlugMap.lessons,
      })
      incomingConfig.collections.push(topics)
    }

    if (sanitizedPluginConfig.quizzes) {
      const quizzes = quizzesCollection({
        mediaCollectionSlug: collectionSlugMap.media,
        studentsCollectionSlug: collectionSlugMap.students,
      })
      incomingConfig.collections.push(quizzes)
    }

    if (sanitizedPluginConfig.categories) {
      const categories = categoriesCollection()
      incomingConfig.collections.push(categories)
    }

    if (sanitizedPluginConfig.tags) {
      const tags = tagsCollection()
      incomingConfig.collections.push(tags)
    }

    if (sanitizedPluginConfig.questions) {
      const questions = questionsCollection({
        studentsCollectionSlug: collectionSlugMap.students,
      })
      incomingConfig.collections.push(questions)
    }

    return {
      ...incomingConfig,
    }
  }
