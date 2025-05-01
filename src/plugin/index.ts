import type { Config, Field, SelectField } from 'payload'

import type { LMSPluginConfig } from '../types.js'
import { AUD } from '../currencies/index.js'
import { coursesCollection } from '../courses/coursesCollection.js'
import { lessonsCollection } from '../lessons/lessonsCollection.js'
import { quizzesCollection } from '../quizzes/quizzesCollection.js'
import { categoriesCollection } from '../categoires/categoriesCollection.js'
import { tagsCollection } from '../tags/tagsCollection.js'
import { certificatesCollection } from '../certificates/certificatesCollection.js'
import { rolesField, rolesOptions } from '../fields/rolesField.js'
export const lmsPlugin = (pluginConfig?: LMSPluginConfig) => (incomingConfig: Config): Config => {

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


    // Ensure collections exists
    if (!incomingConfig.collections) {
        incomingConfig.collections = []
      }
      const existingStudentsCollection = incomingConfig.collections.find(
        collection => collection.slug === studentsCollectionSlug
    )
     if ( existingStudentsCollection ) {


                const existingRolesField = existingStudentsCollection?.fields?.find(
                    (field): field is SelectField => 
                        'name' in field && field.name === 'roles' && field.type === 'select'
                )

                if (!existingRolesField) {
                    // Add roles field if it doesn't exist
                    existingStudentsCollection.fields.push(rolesField({}))
                } else if (existingRolesField.type === 'select') {
                    // Merge options if roles field exists
                    const existingOptions = (existingRolesField.options || []) as Array<{ label: string; value: string }>
                    const rolesFieldConfig = rolesField({})
                    existingRolesField.options = [
                        ...existingOptions,
                        ...(rolesOptions).filter(
                            newOpt => !existingOptions.find(
                                existingOpt => existingOpt.value === newOpt.value
                            )
                        )
                    ]
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

    if ( pluginConfig.certificates) {
        const certificates = certificatesCollection({
            mediaCollectionSlug,
        })
        incomingConfig.collections.push(certificates)
    }   
   
    if ( pluginConfig.courses) {
        const courses = coursesCollection({
            categoriesCollectionSlug,
            currenciesConfig,
            lessonsCollectionSlug,
            mediaCollectionSlug,
            studentsCollectionSlug,
            tagsCollectionSlug,
        })
        incomingConfig.collections.push(courses)
    }

    if ( pluginConfig.lessons) {
        const lessons = lessonsCollection({
            coursesCollectionSlug,
            mediaCollectionSlug,
            quizzesCollectionSlug,
        })
        incomingConfig.collections.push(lessons)
    }

    if ( pluginConfig.quizzes) {
        const quizzes = quizzesCollection({
            mediaCollectionSlug,
        })
        incomingConfig.collections.push(quizzes)
    }   

    if ( pluginConfig.categories) {
        const categories = categoriesCollection()
        incomingConfig.collections.push(categories)
    }

    if ( pluginConfig.tags) {
        const tags = tagsCollection()
        incomingConfig.collections.push(tags)
    }

    return {
        ...incomingConfig,
      
    }
}