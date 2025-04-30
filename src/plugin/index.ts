import type { Config } from 'payload'

import type { LMSPluginConfig } from '../types.js'
import { AUD } from '../currencies/index.js'
import { coursesCollection } from '../courses/coursesCollection.js'
import { lessonsCollection } from '../lessons/lessonsCollection.js'
import { quizzesCollection } from '../quizzes/quizzesCollection.js'
import { categoriesCollection } from '../categoires/categoriesCollection.js'
import { tagsCollection } from '../tags/tagsCollection.js'

export const lmsPlugin = (pluginConfig?: LMSPluginConfig) => (incomingConfig: Config): Config => {
  
    if (!pluginConfig) {
        return incomingConfig
      }

     const studentsCollectionSlug = pluginConfig.studentsCollectionSlug || 'users'
     const categoriesCollectionSlug = pluginConfig.categoriesCollectionSlug || 'categories'
     const coursesCollectionSlug = pluginConfig.coursesCollectionSlug || 'courses'
     const lessonsCollectionSlug = pluginConfig.lessonsCollectionSlug || 'lessons'
     const mediaCollectionSlug = pluginConfig.mediaCollectionSlug || 'media'
     const tagsCollectionSlug = pluginConfig.tagsCollectionSlug || 'tags'
     const quizzesCollectionSlug = pluginConfig.quizzesCollectionSlug || 'quizzes'


    // Ensure collections exists
    if (!incomingConfig.collections) {
        incomingConfig.collections = []
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