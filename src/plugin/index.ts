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
import { deepMerge } from '../utilities/deepMerge.js'
import { address } from '../fields/addressFields.js'

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
      // Generic function to find any field by name and type
      const findFieldByNameAndType = (fields: Field[], fieldName: string, fieldType: string): Field | null => {
        for (const field of fields) {
          if (field.type === 'tabs') {
            for (const tab of field.tabs) {
              const found = tab.fields?.find(f => 'name' in f && f.name === fieldName && f.type === fieldType);
              if (found) return found;
            }
          } else if ('name' in field && field.name === fieldName && field.type === fieldType) {
            return field;
          }
        }
        return null;
      };

      // Check for roles field in tabs
      const existingRolesField = findFieldByNameAndType(existingStudentsCollection?.fields || [], 'roles', 'select')

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
      const existingEnrolledCoursesField = findFieldByNameAndType(existingStudentsCollection?.fields || [], 'enrolledCourses', 'relationship') as RelationshipField | null

      if (!existingEnrolledCoursesField) {
        existingStudentsCollection.fields.push(enrolledCoursesField({}))
      }

      // Add completedCourses field if it doesn't exist
      const existingCompletedCoursesField = findFieldByNameAndType(existingStudentsCollection?.fields || [], 'completedCourses', 'relationship') as RelationshipField | null

      if (!existingCompletedCoursesField) {
        existingStudentsCollection.fields.push(completedCoursesField({}))
      }

      // Add coursesProgress field if it doesn't exist
      const existingCoursesProgressField = findFieldByNameAndType(existingStudentsCollection?.fields || [], 'coursesProgress', 'array') as ArrayField | null

      if (!existingCoursesProgressField) {
        existingStudentsCollection.fields.push(coursesProgressField({}))
      }

      // Add billing address field if it doesn't exist
      const existingBillingAddressField = findFieldByNameAndType(existingStudentsCollection?.fields || [], 'billingAddress', 'group')

      if (!existingBillingAddressField) {
        existingStudentsCollection.fields.push(address({overrides: {
          name: 'billingAddress',
          interfaceName: 'BillingAddress',   
        }}))
      }

      // Add shipping address field if it doesn't exist
      const existingShippingAddressField = findFieldByNameAndType(existingStudentsCollection?.fields || [], 'shippingAddress', 'group')

      if (!existingShippingAddressField) {
        existingStudentsCollection.fields.push(address({overrides: {
          name: 'shippingAddress',
          interfaceName: 'ShippingAddress',   
        }}))
      }

      const exisitingCertificatesField = findFieldByNameAndType(existingStudentsCollection?.fields || [],  'certificates', 'relationship') as RelationshipField | null

      if (!exisitingCertificatesField) {
        existingStudentsCollection.fields.push(
          {
            name: 'certificates',
            type: 'relationship',
            relationTo: certificatesCollectionSlug,
            hasMany: true,
            admin: {
              allowCreate: false,
              description: 'The certificates the student has earned',
            },
          }
        )
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
        studentsCollectionSlug,
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
        categoriesCollectionSlug,
        studentsCollectionSlug,
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
        studentsCollectionSlug,
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

    // Add custom fields to collections
    if (pluginConfig.customFields) {
      Object.entries(pluginConfig.customFields).forEach(([collectionSlug, fields]) => {
        const collection = incomingConfig.collections?.find((col) => col.slug === collectionSlug)

        if (collection) {
          collection.fields = [...collection.fields, ...fields]
        }
      })
    }

    return {
      ...incomingConfig,
    }
  }
