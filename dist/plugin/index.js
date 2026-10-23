import { addressesCollection } from '../addresses/addressesCollection.js';
import { categoriesCollection } from '../categoires/categoriesCollection.js';
import { certificatesCollection } from '../certificates/certificatesCollection.js';
import { coursesCollection } from '../courses/coursesCollection.js';
import { addUserToGroupHandler } from '../endpoints/add-user-to-group.js';
import { completeCourseHandler } from '../endpoints/complete-course.js';
import { completeLessonHandler } from '../endpoints/complete-lesson.js';
import { enrollHandler } from '../endpoints/enroll.js';
import { fetchProgressHandler } from '../endpoints/fetch-progress.js';
import { generateCertificateHandler } from '../endpoints/generate-certificate.js';
import { submitQuizHandler } from '../endpoints/submit-quiz.js';
import { defaultAddressFields } from '../fields/defaultAddressFields.js';
import { defaultStudentFields } from '../fields/defaultStudentFields.js';
import { groupsCollection } from '../groups/groupsCollection.js';
import { lessonsCollection } from '../lessons/lessonsCollection.js';
import { questionsCollection } from '../questions/questionsCollection.js';
import { quizzesCollection } from '../quizzes/quizzesCollection.js';
import { studentsCollection } from '../students/studentsCollection.js';
import { tagsCollection } from '../tags/tagsCollection.js';
import { topicsCollection } from '../topics/topicsCollection.js';
import { getCollectionSlugMap } from '../utilities/getCollectionSlugMap.js';
import { sanitizePluginConfig } from '../utilities/sanitizePluginConfig.js';
export const lmsPlugin = (pluginConfig)=>(incomingConfig)=>{
        if (!pluginConfig) {
            return incomingConfig;
        }
        const sanitizedPluginConfig = sanitizePluginConfig({
            pluginConfig
        });
        /**
     * Used to keep track of the slugs of collections in case they are overridden by the user.
     */ const collectionSlugMap = getCollectionSlugMap({
            sanitizedPluginConfig
        });
        // Ensure collections exists
        if (!incomingConfig.collections) {
            incomingConfig.collections = [];
        }
        const currenciesConfig = sanitizedPluginConfig.currencies;
        let studentsFields;
        if (sanitizedPluginConfig.students) {
            const collectionOverrides = typeof sanitizedPluginConfig.students === 'object' ? sanitizedPluginConfig.students.studentsCollection : undefined;
            studentsFields = sanitizedPluginConfig.students.studentsFields;
            if (studentsFields) {
                const students = studentsCollection({
                    overrides: collectionOverrides,
                    studentsCollectionSlug: collectionSlugMap.students,
                    studentsFields: studentsFields({
                        defaultFields: defaultStudentFields()
                    })
                });
                incomingConfig.collections.push(students);
            }
        }
        let addressFields;
        if (sanitizedPluginConfig.addresses) {
            const collectionOverrides = typeof sanitizedPluginConfig.addresses === 'object' ? sanitizedPluginConfig.addresses.addressesCollection : undefined;
            addressFields = sanitizedPluginConfig.addresses.addressFields;
            const supportedCountries = sanitizedPluginConfig.addresses.supportedCountries;
            const addresses = addressesCollection({
                addressFields: addressFields({
                    defaultFields: defaultAddressFields()
                }),
                overrides: collectionOverrides,
                studentsCollectionSlug: collectionSlugMap.students,
                supportedCountries
            });
            incomingConfig.collections.push(addresses);
        }
        if (sanitizedPluginConfig.certificates) {
            const collectionOverrides = typeof sanitizedPluginConfig.certificates === 'object' ? sanitizedPluginConfig.certificates.certificatesCollection : undefined;
            const certificates = certificatesCollection({
                mediaCollectionSlug: collectionSlugMap.media,
                overrides: collectionOverrides,
                studentsCollectionSlug: collectionSlugMap.students
            });
            incomingConfig.collections.push(certificates);
        }
        if (sanitizedPluginConfig.courses) {
            const collectionOverrides = typeof sanitizedPluginConfig.courses === 'object' ? sanitizedPluginConfig.courses.coursesCollection : undefined;
            const courses = coursesCollection({
                categoriesCollectionSlug: collectionSlugMap.categories,
                certificatesCollectionSlug: collectionSlugMap.certificates,
                currenciesConfig,
                lessonsCollectionSlug: collectionSlugMap.lessons,
                mediaCollectionSlug: collectionSlugMap.media,
                overrides: collectionOverrides,
                studentsCollectionSlug: collectionSlugMap.students,
                tagsCollectionSlug: collectionSlugMap.tags
            });
            incomingConfig.collections.push(courses);
        }
        if (sanitizedPluginConfig.groups) {
            const collectionOverrides = typeof sanitizedPluginConfig.groups === 'object' ? sanitizedPluginConfig.groups.groupsCollection : undefined;
            const groups = groupsCollection({
                couponsCollectionSlug: collectionSlugMap.coupons,
                coursesCollectionSlug: collectionSlugMap.courses,
                usersCollectionSlug: collectionSlugMap.students,
                // certificatesCollectionSlug: collectionSlugMap.certificates,
                overrides: collectionOverrides
            });
            incomingConfig.collections.push(groups);
        }
        if (sanitizedPluginConfig.lessons) {
            const collectionOverrides = typeof sanitizedPluginConfig.lessons === 'object' ? sanitizedPluginConfig.lessons.lessonsCollection : undefined;
            const lessons = lessonsCollection({
                categoriesCollectionSlug: collectionSlugMap.categories,
                coursesCollectionSlug: collectionSlugMap.courses,
                mediaCollectionSlug: collectionSlugMap.media,
                overrides: collectionOverrides,
                quizzesCollectionSlug: collectionSlugMap.quizzes,
                studentsCollectionSlug: collectionSlugMap.students
            });
            incomingConfig.collections.push(lessons);
        }
        if (sanitizedPluginConfig.topics) {
            const collectionOverrides = typeof sanitizedPluginConfig.topics === 'object' ? sanitizedPluginConfig.topics.topicsCollection : undefined;
            const topics = topicsCollection({
                coursesCollectionSlug: collectionSlugMap.courses,
                lessonsCollectionSlug: collectionSlugMap.lessons,
                mediaCollectionSlug: collectionSlugMap.media,
                overrides: collectionOverrides,
                quizzesCollectionSlug: collectionSlugMap.quizzes
            });
            incomingConfig.collections.push(topics);
        }
        if (sanitizedPluginConfig.quizzes) {
            const collectionOverrides = typeof sanitizedPluginConfig.quizzes === 'object' ? sanitizedPluginConfig.quizzes.quizzesCollection : undefined;
            const quizzes = quizzesCollection({
                mediaCollectionSlug: collectionSlugMap.media,
                overrides: collectionOverrides,
                studentsCollectionSlug: collectionSlugMap.students
            });
            incomingConfig.collections.push(quizzes);
        }
        if (sanitizedPluginConfig.categories) {
            const collectionOverrides = typeof sanitizedPluginConfig.categories === 'object' ? sanitizedPluginConfig.categories.categoriesCollection : undefined;
            const categories = categoriesCollection({
                overrides: collectionOverrides
            });
            incomingConfig.collections.push(categories);
        }
        if (sanitizedPluginConfig.tags) {
            const collectionOverrides = typeof sanitizedPluginConfig.tags === 'object' ? sanitizedPluginConfig.tags.tagsCollection : undefined;
            const tags = tagsCollection({
                overrides: collectionOverrides
            });
            incomingConfig.collections.push(tags);
        }
        if (sanitizedPluginConfig.questions) {
            const collectionOverrides = typeof sanitizedPluginConfig.questions === 'object' ? sanitizedPluginConfig.questions.questionsCollection : undefined;
            const questionTypes = typeof sanitizedPluginConfig.questions === 'object' ? sanitizedPluginConfig.questions.questionTypes : undefined;
            const questions = questionsCollection({
                overrides: collectionOverrides,
                questionTypes,
                studentsCollectionSlug: collectionSlugMap.students
            });
            incomingConfig.collections.push(questions);
        }
        if (sanitizedPluginConfig.endpoints) {
            incomingConfig.endpoints = [
                ...incomingConfig.endpoints || [],
                ...sanitizedPluginConfig.endpoints
            ];
        }
        // Default endpoints. They act on the logged-in user only; see `services` for server-side use.
        const defaultEndpoints = [
            {
                handler: enrollHandler(),
                method: 'post',
                path: '/lms/enroll'
            },
            {
                handler: completeLessonHandler(),
                method: 'post',
                path: '/lms/complete-lesson'
            },
            {
                handler: submitQuizHandler(),
                method: 'post',
                path: '/lms/submit-quiz'
            },
            {
                handler: completeCourseHandler(),
                method: 'post',
                path: '/lms/complete-course'
            },
            {
                handler: generateCertificateHandler(),
                method: 'post',
                path: '/lms/generate-certificate'
            },
            {
                handler: addUserToGroupHandler(),
                method: 'post',
                path: '/lms/add-user-to-group'
            },
            {
                handler: fetchProgressHandler(),
                method: 'get',
                path: '/lms/fetch-progress'
            }
        ];
        incomingConfig.endpoints = [
            ...incomingConfig.endpoints || [],
            ...defaultEndpoints
        ];
        return {
            ...incomingConfig,
            custom: {
                ...incomingConfig.custom,
                // Read by the LMS services so they work without the plugin config
                lms: {
                    quizAttemptCooldownSeconds: typeof sanitizedPluginConfig.quizzes === 'object' ? sanitizedPluginConfig.quizzes.attemptCooldownSeconds ?? 5 : 5,
                    rateLimitMax: typeof sanitizedPluginConfig.rateLimit === 'object' ? sanitizedPluginConfig.rateLimit.max ?? 60 : 60,
                    rateLimitWindowSeconds: typeof sanitizedPluginConfig.rateLimit === 'object' ? sanitizedPluginConfig.rateLimit.windowSeconds ?? 60 : 60,
                    slugs: collectionSlugMap
                }
            }
        };
    };

//# sourceMappingURL=index.js.map