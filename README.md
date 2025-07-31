# LMS Plugin for Payload CMS

A comprehensive Learning Management System (LMS) plugin for Payload CMS that enables course creation, management, and delivery.

## Features

- **Course Management**
  - Create and organize courses with rich content
  - Support for multiple access modes (open, free, buy now, recurring, closed)
  - Course navigation modes (linear, free form)
  - Course prerequisites and points system
  - Course materials and resources
  - Certificate generation

- **UI Components**
  - `PriceInput`: Custom price input component with currency formatting
  - `PriceRowLabel`: Price display component for table rows
  - `SlugInput`: Auto-generating slug input with lock/unlock functionality

- **Lesson Management**
  - Rich text content support
  - Embedded video support
  - Lesson materials and resources
  - Progression control (required/optional)
  - Lesson ordering
  - Quiz integration
  - Topic organization

- **Topic Management**
  - Rich text content support
  - Embedded video support with progression tracking
  - Topic materials and resources
  - Course and lesson relationships
  - Video progression control

- **Quiz System**
  - Multiple question types:
    - Multiple Choice
    - True/False
    - Sorting
    - Fill in the Blank
    - Assessment
    - Essay/Open Answer
    - Free Choice
    - Single Choice
  - Points-based scoring
  - Quiz integration with lessons

- **User Management**
  - Role-based access control (Admin, Author, Student)
  - Course enrollment tracking
  - Course completion tracking
  - Student progress monitoring

- **Content Organization**
  - Categories for course classification
  - Tags for content organization
  - Media management for course assets

- **Monetization**
  - Flexible pricing system with multiple currencies
  - Access expiration settings
  - Enrollment URL for closed courses
  - Course bundling through prerequisites

## Installation

### From NPM (if published)

1. Install the plugin:

```bash
npm install @littedash/plugin-lms
```

### From Private GitHub Repository

1. Add the plugin to your project's `package.json`:

```json
{
  "dependencies": {
    "@littledash/plugin-lms": "github:Littledash/plugin-lms#main"
  }
}
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
# or
yarn install
```

For detailed GitHub installation instructions, see [GITHUB_INSTALLATION.md](./GITHUB_INSTALLATION.md).

### Configuration

2. Add the plugin to your Payload config:

```typescript
import { buildConfig } from 'payload/config'
import lmsPlugin from '@payloadcms/plugin-lms'

export default buildConfig({
  plugins: [
    lmsPlugin({
      // Plugin configuration options
      currencies: {
        defaultCurrency: 'AUD',
        supportedCurrencies: [AUD],
      },
      courses: true,
      lessons: true,
      topics: true,
      quizzes: true,
      categories: true,
      tags: true,
      certificates: true,
      questions: true,
    }),
  ],
})
```

## Collections

The plugin provides the following collections:

- **Courses**: Manages course content, access, and organization
- **Lessons**: Handles lesson content and progression
- **Topics**: Manages topic content and video progression
- **Quizzes**: Manages assessments and questions
- **Questions**: Stores quiz questions and answers
- **Categories**: Organizes courses by category
- **Tags**: Provides additional content organization
- **Certificates**: Manages course completion certificates
- **Media**: Handles course assets and resources

## Configuration Options

The plugin supports various configuration options:

```typescript
{
  // Currency settings
  currencies?: {
    defaultCurrency: string
    supportedCurrencies: Currency[]
  }

  // Collection slugs
  studentsCollectionSlug?: string
  certificatesCollectionSlug?: string
  coursesCollectionSlug?: string
  categoriesCollectionSlug?: string
  lessonsCollectionSlug?: string
  topicsCollectionSlug?: string
  mediaCollectionSlug?: string
  tagsCollectionSlug?: string
  quizzesCollectionSlug?: string

  // Enable/disable collections
  courses?: boolean | CoursesConfig
  lessons?: boolean | LessonsConfig
  topics?: boolean | TopicsConfig
  quizzes?: boolean | QuizzesConfig
  categories?: boolean
  tags?: boolean
  certificates?: boolean
  questions?: boolean,

  // Add custom fields to collections
  customFields?: {
    [key: string]: Field[]
  }
}
```

### Custom Fields

You can add custom fields to any of the collections provided by the plugin. This is useful for extending the functionality of the plugin to meet your specific needs.

Here's an example of how to add a custom field to the `courses` collection:

```typescript
import { buildConfig } from 'payload/config'
import lmsPlugin from '@payloadcms/plugin-lms'
import type { Field } from 'payload'

export default buildConfig({
  plugins: [
    lmsPlugin({
      // ... other options
      customFields: {
        courses: [
          {
            name: 'customField',
            type: 'text',
            label: 'Custom Field',
          },
        ],
      },
    }),
  ],
})
```

## UI Components

The plugin provides several reusable UI components that can be imported directly:

```typescript
import { PriceInput } from '@littledash/plugin-lms/ui/PriceInput'
import { PriceRowLabel } from '@littledash/plugin-lms/ui/PriceRowLabel'
import { SlugInput } from '@littledash/plugin-lms/ui/SlugInput'
```

### PriceInput

A custom price input component with currency formatting and validation.

### PriceRowLabel

A price display component designed for use in table rows.

### SlugInput

An auto-generating slug input component with lock/unlock functionality for manual editing.

## Access Control

The plugin includes several access control utilities:

- `isAdmin`: Admin-only access
- `isAuthor`: Author-only access
- `isAdminOrAuthor`: Admin or author access
- `isAdminOrStudent`: Admin or student access
- `isAdminOrPublished`: Admin or published content access
- `isAdminOrAuthorOrEnrolledInCourse`: Admin, author, or enrolled student access
- `isAdminOrAuthorOrStudent`: Admin, author, or student access

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
