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
| all | Logged-in user; at most 60 calls per user per minute (`rateLimit`); body `userId` rejected; IDs must be plain strings or positive integers |
| `enroll` | Course access mode is `open` or `free` (admins excepted); no group enrollment |
| `complete-lesson` | Enrolled; access not expired; lesson released; previous lessons done when navigation is linear; lesson in course; all of the lesson's quizzes passed |
| `submit-quiz` | Enrolled; access not expired; the lesson is released and unlocked; quiz belongs to a lesson in the course; attempt limit and cooldown; answers capped at 500 primitive values. A pass completes lessons whose quizzes are all passed. |
| `complete-course` | Enrolled; access not expired; all required lessons completed |
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
  course that contains them. A lesson's `quizzes` relationship is included, so quiz ids are not
  public.

Overriding one of these fields replaces its `access`. Keep an equivalent rule.

## Default collection access

Payload's own default lets any logged-in user create, update and delete documents. The plugin
therefore sets every operation on its collections:

| Collection | create / update / delete | read |
| --- | --- | --- |
| courses, lessons, topics, categories, tags | admins and authors | anyone (content fields need enrollment) |
| quizzes, questions, certificates | admins and authors | logged-in users (answer fields hidden) |
| documents (private uploads, certificate PDFs; PDF, images and Word `.docx` by default) | create: logged-in users, who always own what they upload; update and delete: admins | admins, authors and the owner, including file downloads |
| groups | create and delete: admins; update: admins and group leaders | group members |
| addresses | create: logged-in users; update and delete: admins and the owner (`customer`). `customer` is set to the logged-in user; only admins can choose or change it | admins and the owner |
| students | create: anyone; update: admins and the user; delete: admins | admins and the user |

`isAdminOrAuthorOrEnrolledInCourse` is for a collection you want limited to enrolled students. On a
single document it reads the stored course (or, for a lesson, the courses that list it). A list is
constrained to enrolled courses and those lessons. Lesson and topic content stays public at the
collection and is hidden per field, which is what the plugin collections use.

Your `access` override is merged over these per operation, so setting only `read` keeps the safe
`create`, `update` and `delete`:

```typescript
lmsPlugin({
  tags: {
    tagsCollection: {
      access: { read: anyone }, // create/update/delete stay admin-or-author
    },
  },
})
```

## What your app must configure

Also check:

- **Roles on your users collection.** If you define your own `roles` field, restrict `create` and
  `update` to admins. Otherwise users can make themselves admins.
- **CSRF and CORS.** The endpoints use Payload's cookie authentication. Set `csrf` and `cors` in your
  Payload config to your site's origins.
- **API keys.** If you enabled `useAPIKey` only so your server could call the LMS endpoints, switch
  to the services and consider removing the key.
- **Logging.** The plugin logs document IDs, not user details. Keep it that way in your own hooks.
- **Private files.** Certificate PDFs are stored in the private documents collection. Put anything
  else that must not be public there too, such as files sent through site forms, rather than in a
  media collection that anyone can read and list. With a storage adapter such as S3, add
  `documents` to its collections and leave `disablePayloadAccessControl` off so downloads are
  checked. File types are checked against each file's contents. To accept more, override
  `upload.mimeTypes` starting from `DEFAULT_DOCUMENT_MIME_TYPES` (`@littledash/plugin-lms/documents`).
  Old `.doc` files are left out on purpose: they are detected as a generic Office container that
  also admits spreadsheets, presentations and files carrying macros. Do not let ordinary users `create`, `update` or `delete` media.

## Known limits

- `accessExpirationDays` counts from `coursesProgress.enrolledAt`, which is recorded when `enrollUser`
  creates the progress row, or from `accessFrom` once access has been renewed. Enrollments from
  before that field have no date, so they do not expire and an "enrollment" lesson delay does not
  hold them. A lesson's delay field is stored as `lessonRelaseDays`.
- Only a renewal extends access: `enrollUser({ renewal: { key: orderId } })`, called by your server
  for a verified purchase and applied at most once per key. Enrolling again without it, including
  through the self-enroll endpoint, never moves the dates, so students cannot extend their own
  access.
- Members a leader adds to a group get an enrollment date for each of the group's courses when they
  are added.
- Each user can call the LMS endpoints 60 times a minute (`rateLimit` on the plugin). That slows a
  script; it does not stop one. A quiz score still reveals how many answers were right. Use
  `attemptLimit` on assessments that matter. The limit is counted in this server process, so run one
  Node process or put your own limit in front of several.
- GraphQL works and applies the same access rules. (`correctAnswer` is a text field rendered as a
  select, because its stored values `true`, `false` and `both` are illegal GraphQL enum names.) If
  you do not use GraphQL, turn it off (`graphQL: { disable: true }` in your Payload config) to
  remove an attack surface you do not need.
- Group leaders can update their group (for example its title), but `purchasedCourses`, `students`
  and `leaders` are writable only by admins and the LMS services, so leaders cannot grant
  themselves seats or skip seat limits. Whether leaders can delete their group is up to your
  `delete` override (the plugin default is admins only).
