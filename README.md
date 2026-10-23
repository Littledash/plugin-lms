# LMS Plugin for Payload CMS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive Learning Management System (LMS) plugin for Payload CMS that enables course creation, management, and delivery.

> [!WARNING]
> This plugin is under heavy development. And it may not be stable for production use. Please use with caution.

## Compatibility

- **Payload CMS:** `^3.92.0`
- **Next.js:** `>=16.3.3` (required by Payload 3.92)
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

## Complete Configuration Examples

### Basic E-Learning Platform

```typescript
// payload.config.ts
import { buildConfig } from 'payload/config'
import { lmsPlugin } from '@littledash/plugin-lms'
import { USD, EUR, GBP } from '@littledash/plugin-lms/currencies'
import { isAdminOrAuthor, isAdminOrLoggedIn, isAdminOrAuthorOrEnrolledInCourse } from '@littledash/plugin-lms/access'

export default buildConfig({
  plugins: [
    lmsPlugin({
      // Enable all collections
      students: true,
      addresses: true,
      courses: true,
      lessons: true,
      topics: true,
      quizzes: true,
      questions: true,
      categories: true,
      tags: true,
      certificates: true,
      groups: true,

      // Currency configuration
      currencies: {
        defaultCurrency: 'USD',
        supportedCurrencies: [USD, EUR, GBP]
      },

      // Access control
      courses: {
        coursesCollection: {
          access: {
            create: isAdminOrAuthor,
            read: isAdminOrLoggedIn,
            update: isAdminOrAuthor,
            delete: isAdminOrAuthor,
          }
        }
      },

      lessons: {
        lessonsCollection: {
          access: {
            read: isAdminOrAuthorOrEnrolledInCourse,
            create: isAdminOrAuthor,
            update: isAdminOrAuthor,
            delete: isAdminOrAuthor,
          }
        }
      }
    })
  ]
})
```

### Corporate Training Platform

```typescript
// payload.config.ts
import { buildConfig } from 'payload/config'
import { lmsPlugin } from '@littledash/plugin-lms'
import { AUD } from '@littledash/plugin-lms/currencies'
import { isAdminOrGroupLeader, isMemberOfGroup } from '@littledash/plugin-lms/access'

export default buildConfig({
  plugins: [
    lmsPlugin({
      // Focus on group-based learning
      students: true,
      groups: true,
      courses: true,
      lessons: true,
      topics: true,
      quizzes: true,
      certificates: true,

      // Australian pricing
      currencies: {
        defaultCurrency: 'AUD',
        supportedCurrencies: [AUD]
      },

      // Group-based access control
      groups: {
        groupsCollection: {
          access: {
            read: isMemberOfGroup,
            create: isAdminOrLoggedIn,
            update: isAdminOrGroupLeader,
            delete: isAdminOrGroupLeader,
          }
        }
      }
    })
  ]
})
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
| `questions`    | `boolean \| { questionTypes?: QuestionTypeOption[], questionsCollection?: CollectionOverride }` | Enables and configures the `questions` collection for quizzes. You can customize available question types. |
| `categories`   | `boolean \| { ... }`               | Enables and configures the `categories` collection for courses.                                         |
| `tags`         | `boolean \| { ... }`               | Enables and configures the `tags` collection for content organization.                                  |
| `certificates` | `boolean \| { ... }`               | Enables and configures the `certificates` collection for course completion awards.                      |
| `groups`       | `boolean \| { ... }`               | Enables and configures the `groups` collection to manage student cohorts.                               |
| `currencies`   | `{ defaultCurrency: string, supportedCurrencies: Currency[] }` | **Required.** Configures the default and supported currencies for course pricing. |
| `endpoints`    | `Endpoint[]`                       | An array of custom [Payload endpoints](https://payloadcms.com/docs/rest-api/endpoints) to add to your config. |

### Customizing Question Types

You can customize which question types are available in your LMS by providing a `questionTypes` array in the questions configuration:

```typescript
// payload.config.ts
import { buildConfig } from 'payload/config'
import { lmsPlugin } from '@littledash/plugin-lms'

export default buildConfig({
  plugins: [
    lmsPlugin({
      questions: {
        questionTypes: [
          { label: 'Multiple Choice', value: 'multipleChoice' },
          { label: 'True/False', value: 'trueFalse' },
          { label: 'Essay', value: 'essay' },
          { label: 'Fill in the Blank', value: 'fillInBlank' },
        ],
      },
    })
  ]
})
```

If you don't specify `questionTypes`, the plugin will use all available question types by default:
- Multiple Choice
- True/False
- Sorting
- Fill in the Blank
- Assessment
- Essay/Open Answer
- Free Choice
- Single Choice

## React Provider & Context Usage

The plugin includes a React context provider that manages LMS state and provides convenient methods for interacting with the LMS API.

### Basic Setup

```tsx
// app/layout.tsx or your root component
import { LMSProvider } from '@littledash/plugin-lms/providers'

export default function RootLayout({ children }) {
  return (
    <LMSProvider
      api={{
        serverURL: 'https://your-api.com',
        apiRoute: '/api'
      }}
      syncLocalStorage={true}
    >
      {children}
    </LMSProvider>
  )
}
```

### Using the LMS Context

```tsx
// components/CourseList.tsx
import { useLMS } from '@littledash/plugin-lms/providers'

export function CourseList() {
  const {
    courses,
    enrolledCourses,
    completedCourses,
    isLoading,
    error,
    enroll,
    fetchCourses
  } = useLMS()

  useEffect(() => {
    fetchCourses()
  }, [])

  if (isLoading) return <div>Loading courses...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Available Courses</h2>
      {courses.map(course => (
        <div key={course.id}>
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          {enrolledCourses.some(ec => ec.id === course.id) ? (
            <span>Enrolled</span>
          ) : (
            <button onClick={() => enroll(course.id)}>
              Enroll Now
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Endpoints and Security

Every `/api/lms/*` endpoint acts on the **logged-in user only**. A `userId` in the request body
is rejected with `400`. The endpoints enforce the course rules on the server:

| Endpoint | Rules |
| --- | --- |
| `POST /lms/enroll` | Only `open` or `free` courses. Paid (`buy now`, `recurring`, `closed`) and group enrollments return `403`. |
| `POST /lms/complete-lesson` | User is enrolled, the lesson is in the course, and every quiz on the lesson is passed. |
| `POST /lms/submit-quiz` | User is enrolled and the quiz belongs to a lesson in the course. Answers are graded server-side; answer fields are hidden from students. |
| `POST /lms/complete-course` | Every required lesson is completed. |
| `POST /lms/generate-certificate` | The user has been awarded that certificate for that course. Returns the media document as `certificate`. |
| `POST /lms/add-user-to-group` | Requester is an admin or a leader of the group. Send the user being added as `memberId`. |
| `GET /lms/fetch-progress` | Returns the logged-in user's progress. |

Users cannot edit their own `coursesProgress` or `certificates` through the REST API; only admins
and the server-side services write them.

### Server-side Enrollment (after a purchase)

Paid and group enrollments run on the server once the payment is verified, for example in a
Stripe webhook. Call the services in-process with the Local API instead of calling the HTTP
endpoints with an API key. Pass `req` so the work joins the current transaction.

```typescript
import { enrollUser, completeCourse, generateCertificate } from '@littledash/plugin-lms/services'

// userId comes from the verified order, never from the client
await enrollUser({ req, userId: order.customer, courseId })

// Group purchase: joins the group that bought the course with `couponId`,
// or the buyer's own group, otherwise creates one named `companyName`
await enrollUser({
  req,
  userId: order.customer,
  courseId,
  group: { companyName: 'Acme', isLeader: true, totalSeats: 10, couponId },
})

// Safe to re-run: awards a missing certificate on an already completed course
await completeCourse({ req, userId, courseId })

const { media } = await generateCertificate({ req, userId, courseId, certificateId })
```

Services throw `LMSError` (with a `status`) when a rule is not met.

### Progress Tracking Example

```tsx
// components/CourseProgress.tsx
import { useLMS } from '@littledash/plugin-lms/providers'

export function CourseProgress({ courseId }) {
  const {
    getProgress,
    completeLesson,
    fetchProgress
  } = useLMS()

  const progress = getProgress(courseId)
  const completedLessons = progress?.completedLessons || []

  const handleCompleteLesson = async (lessonId) => {
    try {
      await completeLesson(courseId, lessonId)
      await fetchProgress() // Refresh progress
    } catch (error) {
      console.error('Failed to complete lesson:', error)
    }
  }

  return (
    <div>
      <h3>Course Progress</h3>
      <p>Completed: {completedLessons.length} lessons</p>
      {/* Your lesson list with completion buttons */}
    </div>
  )
}
```

## Field Types

The plugin provides several specialized field types for common LMS use cases.

### Prices Field

Manages multiple price points for different currencies.

```typescript
import { pricesField } from '@littledash/plugin-lms/fields'
import { USD, EUR, GBP } from '@littledash/plugin-lms/currencies'

export default buildConfig({
  plugins: [
    lmsPlugin({
      courses: {
        coursesCollection: {
          fields: [
            pricesField({
              currenciesConfig: {
                defaultCurrency: 'USD',
                supportedCurrencies: [USD, EUR, GBP]
              },
              overrides: {
                admin: {
                  description: 'Set pricing for different regions'
                }
              }
            })
          ]
        }
      }
    })
  ]
})
```

### Currency Field

A select field for currency selection.

```typescript
import { currencyField } from '@littledash/plugin-lms/fields'

const currencySelect = currencyField({
  currenciesConfig: {
    defaultCurrency: 'USD',
    supportedCurrencies: [USD, EUR, GBP]
  },
  overrides: {
    admin: {
      description: 'Select the currency for this price'
    }
  }
})
```

### Roles Field

A multi-select field for user roles.

```typescript
import { rolesField } from '@littledash/plugin-lms/fields'

const userRoles = rolesField({
  overrides: {
    admin: {
      description: 'Select user roles'
    }
  }
})
```

### Slug Field

A combination of text input and checkbox for automatic slug generation.

```typescript
import { slug } from '@littledash/plugin-lms/fields'

const [slugField, autoSlugField] = slug('title', {
  textField: {
    admin: {
      description: 'URL-friendly version of the title'
    }
  },
  checkboxField: {
    admin: {
      description: 'Automatically generate slug from title'
    }
  }
})
```

### Address Fields

Pre-configured address fields for student information.

```typescript
import { addressFields } from '@littledash/plugin-lms/fields'

const studentAddress = addressFields({
  overrides: {
    admin: {
      description: 'Student address information'
    }
  }
})
```

### Video Progression Field

Tracks video watching progress.

```typescript
import { videoProgressionField } from '@littledash/plugin-lms/fields'

const videoProgress = videoProgressionField({
  overrides: {
    admin: {
      description: 'Track video watching progress'
    }
  }
})
```

### Courses Progress Field

Tracks student progress across courses.

```typescript
import { coursesProgressField } from '@littledash/plugin-lms/fields'

const progressTracking = coursesProgressField({
  overrides: {
    admin: {
      description: 'Student progress across all courses'
    }
  }
})
```

## UI Components

The plugin provides several custom UI components for enhanced user experience.

### PriceInput Component

A specialized input for handling currency values with automatic formatting.

```typescript
// In your collection configuration
import { PriceInput } from '@littledash/plugin-lms/ui/PriceInput'

export default buildConfig({
  plugins: [
    lmsPlugin({
      courses: {
        coursesCollection: {
          fields: [
            {
              name: 'price',
              type: 'number',
              admin: {
                components: {
                  Field: {
                    path: '@littledash/plugin-lms/ui/PriceInput#PriceInput',
                    clientProps: {
                      currenciesConfig: {
                        defaultCurrency: 'USD',
                        supportedCurrencies: [USD, EUR, GBP]
                      }
                    }
                  }
                }
              }
            }
          ]
        }
      }
    })
  ]
})
```

### SlugInput Component

An input field that automatically generates URL-friendly slugs from another field.

```typescript
import { SlugInput } from '@littledash/plugin-lms/ui/SlugInput'

export default buildConfig({
  plugins: [
    lmsPlugin({
      courses: {
        coursesCollection: {
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true
            },
            {
              name: 'slug',
              type: 'text',
              admin: {
                components: {
                  Field: {
                    path: '@littledash/plugin-lms/ui/SlugInput#SlugInput',
                    clientProps: {
                      fieldToUse: 'title',
                      checkboxFieldPath: 'autoSlug'
                    }
                  }
                }
              }
            },
            {
              name: 'autoSlug',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                hidden: true
              }
            }
          ]
        }
      }
    })
  ]
})
```

### PriceRowLabel Component

Used in array fields to display formatted price information in row labels.

```typescript
import { PriceRowLabel } from '@littledash/plugin-lms/ui/PriceRowLabel'

// Automatically used with pricesField - see Field Types section
```

## Access Control Functions

The plugin provides several access control functions for securing your collections and fields.

### Available Access Control Functions

```typescript
import {
  anyone,
  isAdmin,
  isAdminOrAuthor,
  isAdminOrAuthorOrEnrolledInCourse,
  isAdminOrAuthorOrStudent,
  isAdminOrGroupLeader,
  isAdminOrLoggedIn,
  isAdminOrPublished,
  isAdminOrSelf,
  isAdminOrStudent,
  isAuthor,
  isMemberOfGroup
} from '@littledash/plugin-lms/access'
```

### Usage Examples

#### Basic Access Control

```typescript
// payload.config.ts
import { lmsPlugin } from '@littledash/plugin-lms'
import { isAdminOrAuthor, isAdminOrLoggedIn } from '@littledash/plugin-lms/access'

export default buildConfig({
  plugins: [
    lmsPlugin({
      courses: {
        coursesCollection: {
          access: {
            create: isAdminOrAuthor,
            read: isAdminOrLoggedIn,
            update: isAdminOrAuthor,
            delete: isAdminOrAuthor,
          }
        }
      }
    })
  ]
})
```

#### Custom Access Control with Course Enrollment

```typescript
import { isAdminOrAuthorOrEnrolledInCourse } from '@littledash/plugin-lms/access'

// Allow access to lessons only if user is admin, author, or enrolled
export default buildConfig({
  plugins: [
    lmsPlugin({
      lessons: {
        lessonsCollection: {
          access: {
            read: isAdminOrAuthorOrEnrolledInCourse,
            create: isAdminOrAuthor,
            update: isAdminOrAuthor,
            delete: isAdminOrAuthor,
          }
        }
      }
    })
  ]
})
```

#### Group-Based Access Control

```typescript
import { isMemberOfGroup, isAdminOrGroupLeader } from '@littledash/plugin-lms/access'

// Group management access
export default buildConfig({
  plugins: [
    lmsPlugin({
      groups: {
        groupsCollection: {
          access: {
            read: isMemberOfGroup,
            create: isAdminOrLoggedIn,
            update: isAdminOrGroupLeader,
            delete: isAdminOrGroupLeader,
          }
        }
      }
    })
  ]
})
```

#### Field-Level Access Control

```typescript
import { isAdminOrSelfFieldLevel } from '@littledash/plugin-lms/access'

// Restrict sensitive fields to admin or self
export default buildConfig({
  plugins: [
    lmsPlugin({
      students: {
        studentsCollection: {
          fields: [
            {
              name: 'email',
              type: 'email',
              access: {
                read: isAdminOrSelfFieldLevel,
                update: isAdminOrSelfFieldLevel,
              }
            }
          ]
        }
      }
    })
  ]
})
```

## API Endpoints

The plugin provides several REST API endpoints for LMS functionality. All endpoints are prefixed with `/api/lms`.

### Authentication
All endpoints require authentication. Include the user's session token in your requests.

### Enroll in Course

**POST** `/api/lms/enroll`

Enrolls the logged-in user in an `open` or `free` course. Paid and group enrollments return `403`;
use the [server-side services](#server-side-enrollment-after-a-purchase) after the purchase is verified.

**Request Body:**
```json
{
  "courseId": "64f8a1b2c3d4e5f6a7b8c9d0"
}
```

**Response (200):**
```json
{
  "success": true,
  "status": "enrolled",
  "message": "Successfully enrolled in course."
}
```

`status` is `enrolled`, `already-enrolled` or `already-completed`.

### Complete Lesson

**POST** `/api/lms/complete-lesson`

Marks a lesson as complete for the current user.

**Request Body:**
```json
{
  "courseId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "lessonId": "64f8a1b2c3d4e5f6a7b8c9d1"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Lesson marked as complete"
}
```

### Submit Quiz

**POST** `/api/lms/submit-quiz`

Submits user's answers for a quiz and calculates score.

**Request Body:**
```json
{
  "courseId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "quizId": "64f8a1b2c3d4e5f6a7b8c9d2",
  "answers": {
    "64f8a1b2c3d4e5f6a7b8c9d3": "64f8a1b2c3d4e5f6a7b8c9d4",
    "64f8a1b2c3d4e5f6a7b8c9d5": "64f8a1b2c3d4e5f6a7b8c9d6"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "score": 85,
  "message": "Quiz submitted successfully"
}
```

### Add User to Group

**POST** `/api/lms/add-user-to-group`

Adds a user to a group with a specific role. The requester must be an admin or a leader of the group.

**Request Body:**
```json
{
  "groupId": "64f8a1b2c3d4e5f6a7b8c9d7",
  "memberId": "64f8a1b2c3d4e5f6a7b8c9d8",
  "role": "student"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully added user to group as student"
}
```

### Fetch User Progress

**GET** `/api/lms/fetch-progress`

Retrieves the current user's progress across all courses.

**Response (200):**
```json
{
  "coursesProgress": [
    {
      "course": "64f8a1b2c3d4e5f6a7b8c9d0",
      "completedLessons": ["64f8a1b2c3d4e5f6a7b8c9d1"],
      "quizScores": [
        {
          "quiz": "64f8a1b2c3d4e5f6a7b8c9d2",
          "score": 85,
          "submittedAt": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ],
  "enrolledCourses": [
    {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Introduction to Web Development",
      "description": "Learn the basics of web development"
    }
  ],
  "completedCourses": []
}
```

## Error Handling & Best Practices

### Error Handling in React Components

```tsx
import { useLMS } from '@littledash/plugin-lms/providers'

export function CourseEnrollment({ courseId }) {
  const { enroll, isLoading, error } = useLMS()
  const [localError, setLocalError] = useState(null)

  const handleEnroll = async () => {
    try {
      setLocalError(null)
      await enroll(courseId)
      // Success handling
    } catch (err) {
      setLocalError(err.message)
    }
  }

  return (
    <div>
      {error && <div className="error">Global error: {error.message}</div>}
      {localError && <div className="error">Local error: {localError}</div>}
      <button onClick={handleEnroll} disabled={isLoading}>
        {isLoading ? 'Enrolling...' : 'Enroll'}
      </button>
    </div>
  )
}
```

### API Error Handling

```javascript
const handleApiCall = async (apiFunction) => {
  try {
    const result = await apiFunction()
    return { success: true, data: result }
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: error.message || 'An unknown error occurred'
    }
  }
}

// Usage
const { success, data, error } = await handleApiCall(() =>
  fetch('/api/lms/enroll', { /* ... */ })
)
```

### Best Practices

1. **Always handle loading states** - Use the `isLoading` state from the context
2. **Implement proper error boundaries** - Wrap your LMS components in error boundaries
3. **Use optimistic updates** - Update UI immediately, then sync with server
4. **Cache data appropriately** - The provider includes localStorage sync for offline support
5. **Validate user permissions** - Check access control before showing UI elements
6. **Handle network failures** - Implement retry logic for critical operations

## Troubleshooting

### Common Issues

#### Provider Not Working
```tsx
// ❌ Wrong - Provider not wrapping components
export function App() {
  return (
    <div>
      <LMSProvider>
        <CourseList />
      </LMSProvider>
      <UserProfile /> {/* This won't have access to LMS context */}
    </div>
  )
}

// ✅ Correct - Provider wrapping all components that need LMS access
export function App() {
  return (
    <LMSProvider>
      <div>
        <CourseList />
        <UserProfile />
      </div>
    </LMSProvider>
  )
}
```

#### Access Control Not Working
```typescript
// ❌ Wrong - Using access control without proper user context
import { isAdminOrAuthor } from '@littledash/plugin-lms/access'

// ✅ Correct - Ensure user is properly authenticated
// Access control functions automatically check req.user
```

#### Currency Display Issues
```typescript
// ❌ Wrong - Not providing currency configuration
const priceField = pricesField({})

// ✅ Correct - Always provide currency configuration
const priceField = pricesField({
  currenciesConfig: {
    defaultCurrency: 'USD',
    supportedCurrencies: [USD, EUR]
  }
})
```

### Debug Mode

Enable debug logging in development:

```typescript
// payload.config.ts
export default buildConfig({
  plugins: [
    lmsPlugin({
      // ... your config
    })
  ],
  // Enable debug mode
  debug: process.env.NODE_ENV === 'development'
})
```

## License

This plugin is licensed under the MIT License.
