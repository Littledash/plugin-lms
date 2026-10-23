# Security model

This page explains what the plugin enforces and what your app still has to configure.

## Two ways in

| | HTTP endpoints (`/api/lms/*`) | Services (`@littledash/plugin-lms/services`) |
| --- | --- | --- |
| Called by | The browser, as the logged-in user | Your server code (webhooks, hooks, jobs) |
| Acts on | `req.user` only | The `userId` you pass |
| Trust | Untrusted input, fully validated | Trusted: you vouch for `userId` and payment |

**Rule:** never pass a `userId` that came from a request to a service. Take it from trusted server
state, such as the customer on a paid order.

Do not call the HTTP endpoints from your server with an API key. The endpoints reject a `userId` in
the body, and the API-key account is not the user you mean to act on.

## What the endpoints enforce

| Endpoint | Enforced |
| --- | --- |
| all | Logged-in user; body `userId` rejected; IDs must be plain strings or positive integers |
| `enroll` | Course access mode is `open` or `free` (admins excepted); no group enrollment |
| `complete-lesson` | Enrolled; lesson in course; all of the lesson's quizzes passed |
| `submit-quiz` | Enrolled; quiz belongs to a lesson in the course; attempt limit and cooldown; answers capped at 500 primitive values |
| `complete-course` | Enrolled; all required lessons completed |
| `generate-certificate` | The user was awarded that certificate for that course |
| `add-user-to-group` | Requester is an admin or a leader of the group; a seat is free |
| `fetch-progress` | Returns only the requester's progress |

"Enrolled" means the user is in the course's `enrolledStudents` or `courseCompletedStudents`, or is a
student or leader of a group in `courseEnrolledGroups`.

Errors return a JSON `message` and a status code. Unexpected errors are logged on the server and
return a generic `500` message, so internal details never reach the client.

## What the plugin locks down

- `coursesProgress` and `certificates` on the students collection: create and update by admins only.
  The services write them through the Local API.
- `roles` from `rolesField`: create and update by admins only.
- Question answer fields (`choices.isCorrect`, `correctAnswer`, `correctAnswers`,
  `assessmentCriteria`): read by admins and authors only.
- Lesson, topic, quiz and course content fields: read by admins, authors, and users enrolled in a
  course that contains them.

Overriding one of these fields replaces its `access`. Keep an equivalent rule.

## What your app must configure

The plugin does not set collection-level access on the collections it creates. Payload's default
lets **any logged-in user create, update and delete** documents, so set `access` on every LMS
collection you enable. A typical setup:

```typescript
import { isAdminOrAuthor, isAdminOrPublished, isAdminOrSelf, isAdmin, anyone } from '@littledash/plugin-lms/access'

lmsPlugin({
  students: {
    slug: 'users',
    studentsCollection: {
      access: { create: anyone, read: isAdminOrSelf, update: isAdminOrSelf, delete: isAdmin },
      // ...
    },
  },
  courses: {
    coursesCollection: {
      access: { create: isAdminOrAuthor, read: isAdminOrPublished, update: isAdminOrAuthor, delete: isAdminOrAuthor },
    },
  },
  // Same pattern for lessons, topics, quizzes, questions and certificates
})
```

Also check:

- **Roles on your users collection.** If you define your own `roles` field, restrict `create` and
  `update` to admins. Otherwise users can make themselves admins.
- **CSRF and CORS.** The endpoints use Payload's cookie authentication. Set `csrf` and `cors` in your
  Payload config to your site's origins.
- **API keys.** If you enabled `useAPIKey` only so your server could call the LMS endpoints, switch
  to the services and consider removing the key.
- **Logging.** The plugin logs document IDs, not user details. Keep it that way in your own hooks.

## Known limits

- Lesson ordering (`navigation.navigationMode: 'linear'`), lesson release schedules and
  `accessExpirationDays` are not enforced on the server yet. Enforce them in your app if they matter.
- The quiz cooldown slows scripted guessing but cannot stop it; the score a user gets back always
  reveals how many answers were right. Use `attemptLimit` on assessments that matter.
