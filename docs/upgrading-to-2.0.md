# Upgrading to 2.0

Version 2.0 closes security holes in the LMS endpoints. In 1.x, any logged-in user could enroll in
paid courses for free, complete courses and collect certificates without doing the lessons, and act
on other users by sending their `userId`. Upgrading is strongly recommended.

## Requirements

| Package | 1.x | 2.0 |
| --- | --- | --- |
| `payload` and `@payloadcms/*` | `^3.29.0` | `^3.92.0` |
| `next` | 15.x | `>=16.3.3` (required by `@payloadcms/next` 3.92) |
| `react`, `react-dom` | 19.1 | 19.3 |

## Breaking changes

### Endpoints reject `userId`

Every `/api/lms/*` endpoint acts on the logged-in user. A request body containing `userId` (or
`userID`) is rejected with `400`, so callers that relied on it fail loudly instead of acting on the
wrong account.

**If your server calls the endpoints with an API key**, replace those calls with the
[server-side services](./how-to/enroll-after-payment.md). For example:

```diff
- await fetch(`${serverURL}/api/lms/enroll`, {
-   method: 'POST',
-   headers: { Authorization: `users API-Key ${process.env.PAYLOAD_API_KEY}` },
-   body: JSON.stringify({ courseId, userId }),
- })
+ import { enrollUser } from '@littledash/plugin-lms/services'
+
+ await enrollUser({ req, userId, courseId })
```

With an API key, `req.user` in 1.x was the API-key account, so some writes (for example
`enrolledStudents` and group membership) went to that account instead of the buyer. Check your data
for the API-key user in `courses.enrolledStudents`, `groups.leaders` and `groups.students`.

### Enrollment rules

`POST /api/lms/enroll` only enrolls the user in `open` or `free` courses. Paid courses (`buy now`,
`recurring`, `closed`) and group enrollments (`isGroup: true`) return `403`. Enroll paid and group
purchases with `enrollUser` once the payment is verified.

Group enrollment no longer joins an existing group because the company name matches. It joins the
group that bought the course with the given `couponId`, or a group the user already leads, and
otherwise creates a new group.

### Completion rules

- `complete-lesson` requires the user to be enrolled, the lesson to belong to the course, and every
  quiz on the lesson to be passed.
- `complete-course` requires every non-optional lesson to be completed.
- Completing the last required lesson completes the course **and awards the course certificate** in
  the same transaction. You no longer need a hook that calls `complete-course` after
  `courseCompletedStudents` changes; remove it.
- `submit-quiz` only accepts quizzes that belong to a lesson in the course. A pass now completes
  every lesson in the course that contains the quiz once all of that lesson's quizzes are passed,
  and the course if that was the last required lesson. The response lists them in
  `completedLessonIds` and `courseCompleted`. (1.x tried to do this through `quiz.lesson`, a field
  quizzes do not have, so it never happened.)

### Response and request shape changes

| Endpoint | Change |
| --- | --- |
| `generate-certificate` | `certificate` is always the private document holding the PDF. 1.x returned a `find` result (`{ docs }`) when the PDF already existed. |
| `add-user-to-group` | The user being added is sent as `memberId`. |
| `enroll` | Response includes `status`: `enrolled`, `already-enrolled` or `already-completed`. |
| `fetch-progress` | `enrolledCourses` and `completedCourses` are now populated (1.x always returned empty arrays). `completionPercentage` counts required lessons only. |

### Provider (`useLMS`)

- `enroll(courseId)` no longer takes options. Group enrollment happens server-side.
- `completeCourse(courseId)` no longer takes `userId`.
- `addUserToGroup(groupId, memberId, role)` sends `memberId`.

### Field access

These fields can now only be written by admins or the server-side services. Users editing their own
account through the REST API can no longer change them:

- `coursesProgress` and `certificates` on the students collection
- `roles` when you use the plugin's `rolesField`

These question fields are hidden from everyone except admins and authors: `choices.isCorrect`,
`correctAnswer`, `correctAnswers` and `assessmentCriteria`. Grade quizzes with `submit-quiz`, never
in the browser.

If you override these fields, your overrides replace the plugin's `access`, so set equivalent rules.

### Default access and overrides

- Every plugin collection now has secure default access (see the
  [security model](./security.md#default-collection-access)). Your `access` overrides are merged
  over the defaults per operation instead of replacing them.
- **The groups collection now applies your overrides.** In 1.x it ignored `groupsCollection`
  overrides entirely (including `access`), so any logged-in user could edit groups. Check that your
  group overrides are what you want before deploying.
- Self-enrollment refuses draft courses (`404`).

### Certificate files

Certificate PDFs move to a new private **documents** collection (on by default; turn it off with
`documents: false` only if you also stop generating certificates). Each PDF is owned by the
student and readable only by them and staff.

- Awards have a new `document` field. `certificates[].file` (a media upload) is legacy.
- `generate-certificate` and `generateCertificate` return the private document (`certificate` and
  `document`; `media` is kept as an alias).
- The first request for a certificate stored by an older version creates the private PDF and
  **deletes the public media copies**. Links to them, for example in emails already sent, stop
  working.
- Email the PDF as an attachment with `renderCertificatePDF` instead of linking to it. See
  [Certificates](./how-to/certificates.md#email-the-certificate-when-it-is-awarded).
- With a storage adapter (S3 and others), add `documents` to its collections.

### New limits

- Quizzes have an optional `attemptLimit` field and a cooldown between attempts
  (`quizzes.attemptCooldownSeconds`, default 5). See [Quizzes](./how-to/quizzes.md).
- `/api/lms/*` allows 60 calls per user per minute. Change it with `rateLimit`, or set `max: 0` to
  turn it off. The count is kept in the server process.
- Group seats are enforced: members cannot be added once `seatsUsed` reaches `seatsTotal`. Check
  existing groups whose `seatsUsed` is wrong before upgrading. See
  [Groups and seats](./how-to/groups-and-seats.md).
- Linear courses (`navigation.navigationMode`, default `linear`) require earlier lessons before a
  later lesson or its quiz. Lesson release (`immediately`, days after enrollment, or a date) and
  `accessExpirationDays` are enforced. Expiry counts from `coursesProgress.enrolledAt`, set when a
  student is enrolled. Older progress rows have no date, so they do not expire.

## Upgrade checklist

1. Upgrade Payload to 3.92 and Next.js to 16.3.3 or later in your app.
2. Update `@littledash/plugin-lms` to 2.0.
3. Replace every server-side `fetch` to `/api/lms/*` that sends `userId` with the matching service.
4. Remove any hook that calls `complete-course` when `courseCompletedStudents` changes.
5. Update `generate-certificate` callers to read `certificate` as the private document, read PDFs
   from `certificates[].document`, attach PDFs to emails with `renderCertificatePDF`, and add
   `documents` to your storage adapter.
6. Make sure the students collection has `update` access limited to admins and the user themselves.
7. Run your test suite, then check the data issues above (API-key user in course and group lists,
   group seat counts).
8. Optionally backfill missing certificates: run `completeCourse` for users in
   `courseCompletedStudents`; it only awards certificates that are missing. See
   [Certificates](./how-to/certificates.md#backfill-missing-certificates).
9. Regenerate the admin import map (`payload generate:importmap`). True/false questions keep the
   stored values `true`, `false` and `both`; the field is text so GraphQL can build, and the select
   comes from `@littledash/plugin-lms/ui/TrueFalseAnswer`.
