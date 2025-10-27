import type { CollectionSlugMap, SanitizedLMSPluginConfig } from '../types.js'

type Props = {
  sanitizedPluginConfig: SanitizedLMSPluginConfig
}
/**
 * Generates a map of collection slugs based on the sanitized plugin configuration.
 * Takes into consideration any collection overrides provided in the plugin.
 */
export const getCollectionSlugMap = ({ sanitizedPluginConfig }: Props): CollectionSlugMap => {
  const defaultSlugMap: CollectionSlugMap = {
    addresses: 'addresses',
    courses: 'courses',
    coupons: 'coupons',
    groups: 'groups',
    lessons: 'lessons',
    quizzes: 'quizzes',
    categories: 'categories',
    tags: 'tags',
    certificates: 'certificates',
    questions: 'questions',
    topics: 'topics',
    media: 'media',
    students: 'users',
  }
  const collectionSlugsMap: CollectionSlugMap = {
    ...defaultSlugMap,
  }

  //   if (typeof sanitizedPluginConfig.students === 'object' && sanitizedPluginConfig.students.studentsCollection?.slug) {
  //     collectionSlugsMap.students = sanitizedPluginConfig.students.studentsCollection.slug

  //     if (
  //       typeof sanitizedPluginConfig.addresses === 'object' &&
  //       sanitizedPluginConfig.addresses.addressesCollection?.slug
  //     ) {
  //       collectionSlugsMap.addresses = sanitizedPluginConfig.addresses.addressesCollection.slug
  //     }
  //   }

  if (
    typeof sanitizedPluginConfig.courses === 'object' &&
    sanitizedPluginConfig.courses.coursesCollection?.slug
  ) {
    collectionSlugsMap.courses = sanitizedPluginConfig.courses.coursesCollection.slug
  }
  if (
    typeof sanitizedPluginConfig.groups === 'object' &&
    sanitizedPluginConfig.groups.groupsCollection?.slug
  ) {
    collectionSlugsMap.groups = sanitizedPluginConfig.groups.groupsCollection.slug
  }
  if (
    typeof sanitizedPluginConfig.lessons === 'object' &&
    sanitizedPluginConfig.lessons.lessonsCollection?.slug
  ) {
    collectionSlugsMap.lessons = sanitizedPluginConfig.lessons.lessonsCollection.slug
  }

  if (
    typeof sanitizedPluginConfig.quizzes === 'object' &&
    sanitizedPluginConfig.quizzes.quizzesCollection?.slug
  ) {
    collectionSlugsMap.quizzes = sanitizedPluginConfig.quizzes.quizzesCollection.slug
  }

  if (
    typeof sanitizedPluginConfig.certificates === 'object' &&
    sanitizedPluginConfig.certificates.certificatesCollection?.slug
  ) {
    collectionSlugsMap.certificates = sanitizedPluginConfig.certificates.certificatesCollection.slug
  }

  if (
    typeof sanitizedPluginConfig.questions === 'object' &&
    sanitizedPluginConfig.questions.questionsCollection?.slug
  ) {
    collectionSlugsMap.questions = sanitizedPluginConfig.questions.questionsCollection.slug
  }

  if (
    typeof sanitizedPluginConfig.topics === 'object' &&
    sanitizedPluginConfig.topics.topicsCollection?.slug
  ) {
    collectionSlugsMap.topics = sanitizedPluginConfig.topics.topicsCollection.slug
  }

  if (
    typeof sanitizedPluginConfig.categories === 'object' &&
    sanitizedPluginConfig.categories.categoriesCollection?.slug
  ) {
    collectionSlugsMap.categories = sanitizedPluginConfig.categories.categoriesCollection.slug
  }

  if (
    typeof sanitizedPluginConfig.tags === 'object' &&
    sanitizedPluginConfig.tags.tagsCollection?.slug
  ) {
    collectionSlugsMap.tags = sanitizedPluginConfig.tags.tagsCollection.slug
  }

  return collectionSlugsMap
}
