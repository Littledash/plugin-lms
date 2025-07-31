import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig, Field } from 'payload'
import { lmsPlugin } from '../src/index.js'
import type { CollectionOverride } from '../src/types.js'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

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
      hasMany: true,
      defaultValue: ['public'],
      required: true,
      options: [
        {
          label: 'Administrator',
          value: 'admin',
        },
        {
          label: 'Public',
          value: 'public',
        },
      ],
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
            beforeChange: [
              ({ siblingData }) => {
                // ensures data is not stored in DB
                delete siblingData['fullName']
              },
            ],
            afterRead: [
              ({ data }) => {
                return `${data?.firstName} ${data?.lastName}`
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
    autoLogin: devUser,
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
      students: {
        slug: 'users',
        studentsCollection: studentCollection,
      },
      courses: true,
      lessons: true,
      quizzes: true,
      categories: true,
      topics: true,
      tags: true,
      certificates: true,
      questions: true,
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
