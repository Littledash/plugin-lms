# LMS Plugin for Payload CMS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive Learning Management System (LMS) plugin for Payload CMS that enables course creation, management, and delivery.

> [!WARNING]
> This plugin is under heavy development. And it may not be stable for production use. Please use with caution.

## Compatibility

- **Payload CMS:** `^3.29.0`
- **Node.js:** `^18.20.2` or `>=20.9.0`

## Installation

This plugin is designed to work with `pnpm`, but you can use `npm` or `yarn` as well.

```bash
# pnpm (recommended)
pnpm add @littledash/plugin-lms

# npm
npm install @littledash/plugin-lms

# yarn
yarn add @littledash/plugin-lms
```

## Basic Usage

Enable the plugin in your `payload.config.ts` file. Here is a basic configuration to get you started:

```typescript
// payload.config.ts
import { buildConfig } from 'payload/config';
import { lmsPlugin } from '@littledash/plugin-lms';
import { AUD } from '@littledash/plugin-lms/currencies'; // Example currency import

export default buildConfig({
  // ... other Payload config
  plugins: [
    lmsPlugin({
      // Enable the collections you need
      courses: true,
      lessons: true,
      topics: true,
      quizzes: true,
      questions: true,
      categories: true,
      tags: true,
      certificates: true,
      // Configure currency settings
      currencies: {
        defaultCurrency: 'AUD',
        supportedCurrencies: [AUD],
      },
    }),
  ],
});
```

## Configuration

This plugin is highly configurable. You can enable or disable features and customize them by passing a configuration object to `lmsPlugin`.

| Option         | Type                               | Description                                                                                             |
| -------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `students`     | `boolean \| { ... }`               | Enables and configures the `students` collection. Can accept an object for overrides.                   |
| `addresses`    | `boolean \| { ... }`               | Enables and configures the `addresses` collection for students.                                         |
| `courses`      | `boolean \| { ... }`               | Enables and configures the `courses` collection.                                                        |
| `lessons`      | `boolean \| { ... }`               | Enables and configures the `lessons` collection.                                                        |
| `topics`       | `boolean \| { ... }`               | Enables and configures the `topics` collection.                                                         |
| `quizzes`      | `boolean \| { ... }`               | Enables and configures the `quizzes` collection.                                                        |
| `questions`    | `boolean \| { ... }`               | Enables and configures the `questions` collection for quizzes.                                          |
| `categories`   | `boolean \| { ... }`               | Enables and configures the `categories` collection for courses.                                         |
| `tags`         | `boolean \| { ... }`               | Enables and configures the `tags` collection for content organization.                                  |
| `certificates` | `boolean \| { ... }`               | Enables and configures the `certificates` collection for course completion awards.                      |
| `groups`       | `boolean \| { ... }`               | Enables and configures the `groups` collection to manage student cohorts.                               |
| `currencies`   | `{ defaultCurrency: string, supportedCurrencies: Currency[] }` | **Required.** Configures the default and supported currencies for course pricing. |
| `endpoints`    | `Endpoint[]`                       | An array of custom [Payload endpoints](https://payloadcms.com/docs/rest-api/endpoints) to add to your config. |

---

## Advanced Usage

### Customizing Collections

You can override the default configuration for any collection, for example to add custom fields. This is useful for extending the plugin's functionality to meet your specific needs.

Here's an example of how to add a custom `externalLink` field to the `courses` collection:

```typescript
// payload.config.ts
import { buildConfig } from 'payload/config';
import { lmsPlugin } from '@littledash/plugin-lms';
import type { Field } from 'payload/types';

export default buildConfig({
  // ...
  plugins: [
    lmsPlugin({
      courses: {
        coursesCollection: {
          fields: ({ defaultFields }) => [
            ...defaultFields,
            {
              name: 'externalLink',
              type: 'text',
              label: 'External Link',
            },
          ],
        },
      },
      // ... other options
    }),
  ],
});
```

### Modular Imports

For maximum flexibility, you can import individual components like fields, access control functions, and UI components directly from the plugin.

**Example: Importing a Field**
```typescript
import { pricesField } from '@littledash/plugin-lms/fields';
```

**Example: Importing an Access Control Function**
```typescript
import { isAdminOrAuthor } from '@littledash/plugin-lms/access';
```

**Example: Importing a UI Component**
```typescript
import { SlugInput } from '@littledash/plugin-lms/ui/SlugInput';
```

## API Endpoints

The plugin automatically registers several endpoints to handle core LMS functionality. These endpoints are prefixed with `/lms`.

| Method | Path                        | Description                                      |
| ------ | --------------------------- | ------------------------------------------------ |
| `POST` | `/lms/enroll`               | Enrolls the current user in a specified course.  |
| `POST` | `/lms/complete-lesson`      | Marks a lesson as complete for the current user. |
| `POST` | `/lms/submit-quiz`          | Submits a user's answers for a quiz.             |
| `POST` | `/lms/complete-course`      | Marks a course as complete for the current user. |
| `POST` | `/lms/generate-certificate` | Generates a certificate for a completed course.  |
| `POST` | `/lms/add-user-to-group`    | Adds a specified user to a group.                |
| `GET`  | `/lms/fetch-progress`       | Fetches the current user's progress.             |


## License

This plugin is licensed under the MIT License.
