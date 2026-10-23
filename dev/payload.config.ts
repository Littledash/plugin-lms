import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, Field } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import type { CollectionOverride } from '../src/types.js'

import { anyone } from '../src/access/anyone.js'
import { isAdmin, isAdminFieldLevel } from '../src/access/isAdmin.js'
import { isAdminOrSelf } from '../src/access/isAdminOrSelf.js'
import { lmsPlugin } from '../src/index.js'
import { devUser } from './helpers/credentials.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const studentCollection: CollectionOverride = {
  slug: 'users',
  auth: true,
  // Mirrors the consuming site so tests exercise the same access rules
  access: {
    create: anyone,
    delete: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
  },
  admin: {
    defaultColumns: ['fullName', 'email', 'roles'],
    useAsTitle: 'email',
  },
  fields: ({ defaultFields }: { defaultFields: Field[] }) => [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
      defaultValue: ['public'],
      hasMany: true,
      options: [
        {
          label: 'Administrator',
          value: 'admin',
        },
        { label: 'Author', value: 'author' },
        { label: 'Student', value: 'student' },
        { label: 'Leader', value: 'leader' },
        {
          label: 'Public',
          value: 'public',
        },
      ],
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          required: true,
        },
        {
          name: 'lastName',
          type: 'text',
          required: true,
        },
        {
          name: 'fullName',
          type: 'text',
          admin: {
            hidden: true, // hides the field from the admin panel
          },
          hooks: {
            afterRead: [
              ({ data }) => {
                return `${data?.firstName} ${data?.lastName}`
              },
            ],
            beforeChange: [
              ({ siblingData }) => {
                // ensures data is not stored in DB
                delete siblingData['fullName']
              },
            ],
          },
        },
      ],
    },
    ...defaultFields,
  ],
}

export default buildConfig({
  admin: {
    autoLogin: process.env.NODE_ENV === 'test' ? false : devUser,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'posts',
      fields: [],
    },
    {
      slug: 'coupons',
      fields: [],
    },
    {
      slug: 'media',
      fields: [],
      upload: {
        staticDir: path.resolve(dirname, 'media'),
      },
    },
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  editor: lexicalEditor(),
  email: testEmailAdapter,
  // onInit: async (payload) => {
  //   await seed(payload)
  // },
  plugins: [
    lmsPlugin({
      groups: true,
      students: {
        slug: 'users',
        studentsCollection: studentCollection,
      },
      // Drafts on, as in the consuming site
      courses: { coursesCollection: { versions: { drafts: true } } },
      lessons: true,
      // Tests retry quizzes back-to-back; the cooldown test raises this at runtime
      categories: true,
      certificates: true,
      questions: {
        questionTypes: [
          { label: 'Multiple Choice', value: 'multipleChoice' },
          { label: 'True/False', value: 'trueFalse' },
          { label: 'Essay', value: 'essay' },
          { label: 'Fill in the Blank', value: 'fillInBlank' },
        ],
      },
      quizzes: { attemptCooldownSeconds: 0 },
      tags: true,
      topics: true,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
  sharp,
  typescript: {
    // Each test boot would otherwise spawn a detached `payload generate:types` that outlives Jest
    autoGenerate: process.env.NODE_ENV !== 'test',
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
