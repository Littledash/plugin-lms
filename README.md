# LMS Plugin for Payload CMS

A comprehensive Learning Management System (LMS) plugin for Payload CMS that enables course creation, management, and delivery.

## Features

- **Course Management**
  - Create and organize courses with rich content
  - Support for multiple course types and formats
  - Course progress tracking
  - Course enrollment and access control

- **Content Types**
  - Text-based lessons
  - Video content with embedded support
  - Quizzes and assessments
  - Interactive exercises
  - Downloadable resources

- **User Management**
  - Role-based access control (Admin, Author, Student)
  - User progress tracking
  - Course enrollment management
  - Student performance analytics

- **Assessment System**
  - Multiple question types (Multiple Choice, True/False, etc.)
  - Quiz creation and management
  - Automatic grading
  - Performance tracking

- **Monetization**
  - Flexible pricing system
  - Multiple currency support
  - Course bundling
  - Discount management

## Installation

1. Install the plugin:
```bash
npm install @payloadcms/plugin-lms
```

2. Add the plugin to your Payload config:
```typescript
import { buildConfig } from 'payload/config'
import lmsPlugin from '@payloadcms/plugin-lms'

export default buildConfig({
  plugins: [
    lmsPlugin({
      // Plugin configuration options
    }),
  ],
})
```

## Configuration

The plugin supports various configuration options:

```typescript
{
  // Course settings
  courseSettings: {
    // Configuration options
  },
  
  // Quiz settings
  quizSettings: {
    // Configuration options
  },
  
  // User role settings
  roleSettings: {
    // Configuration options
  }
}
```

## Usage

### Creating a Course

```typescript
// Example course creation
const course = await payload.create({
  collection: 'courses',
  data: {
    title: 'Introduction to Programming',
    description: 'Learn the basics of programming',
    // Additional course fields
  },
})
```

### Managing Users

```typescript
// Example user management
const user = await payload.create({
  collection: 'users',
  data: {
    email: 'student@example.com',
    password: 'securepassword',
    roles: ['student'],
  },
})
```

## Access Control

The plugin includes several access control utilities:

- `isAdmin`: Admin-only access
- `isAuthor`: Author-only access
- `isAdminOrAuthor`: Admin or author access
- `isAdminOrStudent`: Admin or student access
- `isAdminOrLoggedIn`: Admin or any logged-in user access

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
