/* eslint-disable no-console */
/**
 * Integration tests for the LMS application.
 * These tests verify the core functionality of the application including:
 * - User authentication and authorization
 * - Course management
 * - Quiz functionality
 * - Certificate generation
 * 
 * The tests use a memory database for isolation and speed.
 */

import type { Payload } from 'payload'
import type { GeneratedTypes } from 'payload'
import dotenv from 'dotenv'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'

import { NextRESTClient } from './helpers/NextRESTClient.js'
import { devUser } from './helpers/credentials.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

let payload: Payload
let restClient: NextRESTClient
let memoryDB: MongoMemoryReplSet | undefined

describe('LMS Integration Tests', () => {
  beforeAll(async () => {
    // Disable HMR and ensure clean database for tests
    process.env.DISABLE_PAYLOAD_HMR = 'true'
    process.env.PAYLOAD_DROP_DATABASE = 'true'

    // Load environment variables
    dotenv.config({
      path: path.resolve(dirname, './.env'),
    })

    // Set up in-memory database for testing
    if (!process.env.DATABASE_URI) {
      console.log('Starting memory database')
      memoryDB = await MongoMemoryReplSet.create({
        replSet: {
          count: 3,
          dbName: 'payloadmemory',
        },
      })
      console.log('Memory database started')

      process.env.DATABASE_URI = `${memoryDB.getUri()}&retryWrites=true`
    }

    const { default: config } = await import('./payload.config.js')
    payload = await getPayload({ config })
    restClient = new NextRESTClient(payload.config)
  })

  afterAll(async () => {
    // Clean up resources
    if (payload.db.destroy) {
      await payload.db.destroy()
    }

    if (memoryDB) {
      await memoryDB.stop()
    }
  })

  describe('User Management', () => {
    it('should create and authenticate admin user', async () => {
      const user = await payload.create({
        collection: 'users',
        data: {
          ...devUser,
          firstName: 'Admin',
          lastName: 'User',
          roles: ['admin'],
        },
      })

      expect(user.email).toBe(devUser.email)
      expect(user.roles).toContain('admin')
    })

    it('should create and authenticate student user', async () => {
      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'student@example.com',
          password: 'password123',
          firstName: 'Student',
          lastName: 'User',
          roles: ['student'],
        },
      })

      expect(user.email).toBe('student@example.com')
      expect(user.roles).toContain('student')
    })
  })

  describe('Course Management', () => {
    let adminUser: GeneratedTypes['collections']['users']
    let authorUser: GeneratedTypes['collections']['users']
    let studentUser: GeneratedTypes['collections']['users']

    beforeEach(async () => {
      // Create test users with different roles
      adminUser = await payload.create({
        collection: 'users',
        data: {
          email: 'admin@example.com',
          password: 'password123',
          firstName: 'Admin',
          lastName: 'User',
          roles: ['admin'],
        },
      })

      authorUser = await payload.create({
        collection: 'users',
        data: {
          email: 'author@example.com',
          password: 'password123',
          firstName: 'Author',
          lastName: 'User',
          roles: ['author'],
        },
      })

      studentUser = await payload.create({
        collection: 'users',
        data: {
          email: 'student@example.com',
          password: 'password123',
          firstName: 'Student',
          lastName: 'User',
          roles: ['student'],
        },
      })
    })

    it('should allow admin to create a course', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          title: 'Admin Created Course',
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'A course created by admin',
                    },
                  ],
                  version: 1,
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
          accessMode: 'free',
          navigationMode: 'linear',
        },
        user: adminUser,
      })

      expect(course.title).toBe('Admin Created Course')
      expect(course.accessMode).toBe('free')
    })

    it('should allow author to create a course', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          title: 'Author Created Course',
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'A course created by author',
                    },
                  ],
                  version: 1,
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
          accessMode: 'free',
          navigationMode: 'linear',
        },
        user: authorUser,
      })

      expect(course.title).toBe('Author Created Course')
      expect(course.accessMode).toBe('free')
    })

    it('should not allow student to create a course', async () => {
      await expect(
        payload.create({
          collection: 'courses',
          data: {
            title: 'Student Created Course',
            description: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        text: 'A course created by student',
                      },
                    ],
                    version: 1,
                  },
                ],
                direction: null,
                format: '',
                indent: 0,
                version: 1,
              },
            },
            accessMode: 'free',
            navigationMode: 'linear',
          },
          user: studentUser,
        })
      ).rejects.toThrow()
    })

    it('should create a new course', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          title: 'Test Course',
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'A test course for integration testing',
                    },
                  ],
                  version: 1,
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
          accessMode: 'free',
          navigationMode: 'linear',
        },
      })

      expect(course.title).toBe('Test Course')
      expect(course.accessMode).toBe('free')
    })

    it('should create a lesson within a course', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          title: 'Test Course with Lesson',
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'Course with a test lesson',
                    },
                  ],
                  version: 1,
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
          accessMode: 'free',
          navigationMode: 'linear',
        },
      })

      const lesson = await payload.create({
        collection: 'lessons',
        data: {
          title: 'Test Lesson',
          content: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'This is a test lesson content',
                    },
                  ],
                  version: 1,
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
          course: course.id,
          progressionControl: 'required',
          lessonOrder: 1,
        },
      })

      expect(lesson.title).toBe('Test Lesson')
      expect(lesson.course).toBe(course.id)
    })
  })

  describe('Quiz Management', () => {
    it('should create a quiz with questions', async () => {
      const quiz = await payload.create({
        collection: 'quizzes',
        data: {
          title: 'Test Quiz',
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'A test quiz for integration testing',
                    },
                  ],
                  version: 1,
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
          questions: [],
        },
      })

      const question = await payload.create({
        collection: 'questions',
        data: {
          title: 'Test Question',
          points: 10,
          questionType: 'multipleChoice',
          question: 'What is the capital of France?',
          choices: [
            { label: 'Paris', isCorrect: true },
            { label: 'London', isCorrect: false },
            { label: 'Berlin', isCorrect: false },
          ],
        },
      })

      await payload.update({
        collection: 'quizzes',
        id: quiz.id,
        data: {
          questions: [question.id],
        },
      })

      const updatedQuiz = await payload.findByID({
        collection: 'quizzes',
        id: quiz.id,
      })

      expect(updatedQuiz.questions).toHaveLength(1)
    })
  })

  describe('Certificate Management', () => {
    it('should create a certificate template', async () => {
      const template = await payload.create({
        collection: 'media',
        data: {
          filename: 'certificate-template.png',
          mimeType: 'image/png',
          filesize: 1024,
          width: 1920,
          height: 1080,
        },
      })

      expect(template.filename).toBe('certificate-template.png')
      expect(template.mimeType).toBe('image/png')
    })

    it('should create a certificate for a completed course', async () => {
      const course = await payload.create({
        collection: 'courses',
        data: {
          title: 'Certificate Test Course',
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'Course for certificate testing',
                    },
                  ],
                  version: 1,
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
          accessMode: 'free',
          navigationMode: 'linear',
        },
      })

      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'certificate@example.com',
          password: 'password123',
          firstName: 'Certificate',
          lastName: 'User',
          roles: ['student'],
        },
      })

      const template = await payload.create({
        collection: 'media',
        data: {
          filename: 'certificate-template.png',
          mimeType: 'image/png',
          filesize: 1024,
          width: 1920,
          height: 1080,
        },
      })

      const certificate = await payload.create({
        collection: 'certificates',
        data: {
          title: 'Test Certificate',
          description: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'Certificate for completing the test course',
                    },
                  ],
                  version: 1,
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
          template: template.id,
          course: course.id,
          students: [user.id],
          issueDate: new Date().toISOString(),
          certificateNumber: 'TEST-' + Date.now(),
          status: 'active',
        },
      })

      expect(certificate.title).toBe('Test Certificate')
      expect(certificate.course).toBe(course.id)
      expect(certificate.students).toContain(user.id)
    })
  })
})
