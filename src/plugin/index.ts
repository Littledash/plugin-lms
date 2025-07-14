import type { ArrayField, Config, Field, RelationshipField, SelectField } from 'payload'

import type { LMSPluginConfig } from '../types.js'
import { AUD } from '../currencies/index.js'
import { coursesCollection } from '../courses/coursesCollection.js'
import { lessonsCollection } from '../lessons/lessonsCollection.js'
import { quizzesCollection } from '../quizzes/quizzesCollection.js'
import { categoriesCollection } from '../categoires/categoriesCollection.js'
import { tagsCollection } from '../tags/tagsCollection.js'
import { certificatesCollection } from '../certificates/certificatesCollection.js'
import { rolesField, rolesOptions } from '../fields/rolesField.js'
import { questionsCollection } from '../questions/questionsCollection.js'
import { enrolledCoursesField } from '../fields/enrolledCoursesField.js'
import { completedCoursesField } from '../fields/completedCoursesField.js'
import { coursesProgressField } from '../fields/coursesProgressField.js'
import { topicsCollection } from '../topics/topicsCollection.js'
import deepMerge from '../utilities/deepMerge.js'

/**
 * 
 *@TODO add groups collection and fields
  - fields 
  name
  description
  members (relationship)
  createdBy (relationship)
  updatedBy (relationship)
  createdAt
  updatedAt

  @TODO - than add groups to courses collection as a relationship
 */


export const lmsPlugin =
  (pluginConfig?: LMSPluginConfig) =>
  (incomingConfig: Config): Config => {
    if (!pluginConfig) {
      return incomingConfig
    }

    const studentsCollectionSlug = pluginConfig.studentsCollectionSlug || 'users'
    const categoriesCollectionSlug = pluginConfig.categoriesCollectionSlug || 'categories'
    const certificatesCollectionSlug = pluginConfig.certificatesCollectionSlug || 'certificates'
    const coursesCollectionSlug = pluginConfig.coursesCollectionSlug || 'courses'
    const lessonsCollectionSlug = pluginConfig.lessonsCollectionSlug || 'lessons'
    const mediaCollectionSlug = pluginConfig.mediaCollectionSlug || 'media'
    const tagsCollectionSlug = pluginConfig.tagsCollectionSlug || 'tags'
    const quizzesCollectionSlug = pluginConfig.quizzesCollectionSlug || 'quizzes'
    const topicsCollectionSlug = pluginConfig.topicsCollectionSlug || 'topics'

    // Ensure collections exists
    if (!incomingConfig.collections) {
      incomingConfig.collections = []
    }
    const existingStudentsCollection = incomingConfig.collections.find(
      (collection) => collection.slug === studentsCollectionSlug,
    )
    // Ensure students collection exists
    if (existingStudentsCollection) {
      // Handle fields that may be nested within tabs
      const findFieldInTabs = (fields: Field[]) => {
        for (const field of fields) {
          if (field.type === 'tabs') {
            for (const tab of field.tabs) {
              const found = tab.fields?.find(f => 'name' in f && f.name === 'roles' && f.type === 'select');
              if (found) return found;
            }
          }
        }
        return null;
      };

      // Check for roles field in tabs
      const existingRolesField = existingStudentsCollection?.fields?.find(
        field => 'name' in field && field.name === 'roles' && field.type === 'select'
      ) || findFieldInTabs(existingStudentsCollection?.fields || [])

      if (existingRolesField && existingRolesField.type === 'select') {
        // Merge options if roles field exists
        const existingOptions = (existingRolesField.options || []) as Array<{
          label: string
          value: string
        }>

        existingRolesField.options = [
          ...existingOptions,
          ...rolesOptions.filter(
            (newOpt) => !existingOptions.find((existingOpt) => existingOpt.value === newOpt.value),
          ),
        ]
      } else {
        // Add roles field if it doesn't exist
        existingStudentsCollection.fields.push(rolesField({}))
      }

      // Add enrolledCourses field if it doesn't exist
      const existingEnrolledCoursesField = existingStudentsCollection?.fields?.find(
        (field): field is RelationshipField =>
          'name' in field && field.name === 'enrolledCourses' && field.type === 'relationship',
      )

      if (!existingEnrolledCoursesField) {
        existingStudentsCollection.fields.push(enrolledCoursesField({}))
      }

      // Add completedCourses field if it doesn't exist
      const existingCompletedCoursesField = existingStudentsCollection?.fields?.find(
        (field): field is RelationshipField =>
          'name' in field && field.name === 'completedCourses' && field.type === 'relationship',
      )

      if (!existingCompletedCoursesField) {
        existingStudentsCollection.fields.push(completedCoursesField({}))
      }

      // Add coursesProgress field if it doesn't exist
      const existingCoursesProgressField = existingStudentsCollection?.fields?.find(
        (field): field is ArrayField =>
          'name' in field && field.name === 'coursesProgress' && field.type === 'array',
      )

      if (!existingCoursesProgressField) {
        existingStudentsCollection.fields.push(coursesProgressField({}))
      }
    }

    // Ensure currencies are configured
    const currenciesConfig: NonNullable<LMSPluginConfig['currencies']> =
      pluginConfig.currencies ?? {
        defaultCurrency: 'AUD',
        supportedCurrencies: [AUD],
      }

    if (!currenciesConfig.defaultCurrency) {
      currenciesConfig.defaultCurrency = currenciesConfig.supportedCurrencies[0]?.code
    }

    if (pluginConfig.certificates) {
      const certificates = certificatesCollection({
        mediaCollectionSlug,
      })
      incomingConfig.collections.push(certificates)
    }

    if (pluginConfig.courses) {
      const courses = coursesCollection({
        categoriesCollectionSlug,
        certificatesCollectionSlug,
        currenciesConfig,
        lessonsCollectionSlug,
        mediaCollectionSlug,
        studentsCollectionSlug,
        tagsCollectionSlug,
      })
      incomingConfig.collections.push(courses)
    }

    if (pluginConfig.lessons) {
      const lessons = lessonsCollection({
        coursesCollectionSlug,
        mediaCollectionSlug,
        quizzesCollectionSlug,
      })
      incomingConfig.collections.push(lessons)
    }

    if (pluginConfig.topics) {
      const topics = topicsCollection({
        coursesCollectionSlug,
        mediaCollectionSlug,
        quizzesCollectionSlug,
        lessonsCollectionSlug,
      })
      incomingConfig.collections.push(topics)
    }

    if (pluginConfig.quizzes) {
      const quizzes = quizzesCollection({
        mediaCollectionSlug,
      })
      incomingConfig.collections.push(quizzes)
    }


    if (incomingConfig.collections?.find((col) => col.slug === 'categories') && pluginConfig.categories) {
      const existingCategories = incomingConfig.collections.find((col) => col.slug === 'categories')
      const newCategories = categoriesCollection()
      
      // Deep merge the collections
      if (existingCategories) {
        existingCategories.fields = deepMerge(existingCategories.fields || [], newCategories.fields || [])
      }
    } else if (pluginConfig.categories) {
      const categories = categoriesCollection()
      incomingConfig.collections.push(categories)
    }

    if (incomingConfig.collections?.find((col) => col.slug === 'tags') && pluginConfig.tags) {
      const existingTags = incomingConfig.collections.find((col) => col.slug === 'tags')
      const newTags = tagsCollection()
      
      // Deep merge the collections
      if (existingTags) {
        existingTags.fields = deepMerge(existingTags.fields || [], newTags.fields || [])
      }
    } else if (pluginConfig.tags) {
      const tags = tagsCollection()
      incomingConfig.collections.push(tags)
    }

    if (pluginConfig.questions) {
      const questions = questionsCollection()
      incomingConfig.collections.push(questions)
    }

    return {
      ...incomingConfig,
    }
  }
