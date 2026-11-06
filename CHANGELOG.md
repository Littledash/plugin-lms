# Changelog

## 2.0.0

Security release. See [Upgrading to 2.0](./docs/upgrading-to-2.0.md) for the breaking changes.

### Breaking

- Requires Payload `^3.92.0` and Next.js `>=16.3.3`.
- Endpoints act on the logged-in user only and reject `userId` in the body.
- `enroll` only allows `open` and `free` courses; paid and group enrollment is server-side.
- `add-user-to-group` takes `memberId`; `generate-certificate` returns the media document.
- Provider `enroll` and `completeCourse` no longer accept `userId` or group options.

### Added

- `@littledash/plugin-lms/services`: `enrollUser`, `completeLesson`, `submitQuiz`,
  `completeCourse`, `generateCertificate`, `addUserToGroup`, `getProgress`, `LMSError`.
- Quiz `attemptLimit` field and `quizzes.attemptCooldownSeconds` option.
- A per-user rate limit on `/api/lms/*` (`rateLimit`, default 60 calls per 60 seconds).
- Group seat limits; group leaders cannot edit seats or membership directly.
- `enrollUser({ renewal: { key } })` renews expired or expiring access for a purchase, at most once
  per key (an order id), so retried webhooks and duplicate fulfilment cannot add extra periods
  (`coursesProgress.accessFrom`); enrolling again without it never extends access.
- Members added to a group by a leader are dated on the day they join.
- Passing a quiz completes its lessons (and the course) once all of a lesson's quizzes are passed.
- Secure default access on every plugin collection; overrides merge per operation.
- A private `documents` upload collection (on by default): each file is readable only by its
  owner and staff, including downloads. Accepts PDF, common image formats (no SVG) and Word `.docx` by default
  (`DEFAULT_DOCUMENT_MIME_TYPES`). Certificate PDFs are stored there, linked from
  `certificates[].document`, dated with the completion date. Public copies in media from older
  versions are deleted when a certificate is first requested.
- `renderCertificatePDF` returns a certificate's PDF bytes for email attachments.
- A protected `course-files` upload collection (on by default) for lesson downloads. A file is
  readable and downloadable only by staff and by students who can open a lesson offering it now
  (enrollment, expiry, release and order apply). `downloadableFiles` points here instead of media.
- Admin descriptions on every plugin collection field, and on `documents` and `course-files`, say
  what belongs in each and who can open it. The price and slug inputs now show field descriptions.
  Override them with `overrides.admin.description` or `overrides.fields`.
- Integration tests and client tests for the React provider and admin field components.

### Fixed

- The provider's progress cache is tied to the logged-in user and removed on logout, so one
  student's progress never shows for another on a shared browser.
- The endpoint rate limiter forgets idle users instead of keeping every user in memory.
- The provider recorded `undefined` for enrolled and completed courses: it expected `{ id }`
  objects but `fetch-progress` returns ids.
- Free enrollment in paid courses; completion and certificates without doing the lessons; acting
  on other users with `userId`.
- Users could edit their own progress, certificates and roles; quiz answers were readable.
- The API-key account was added to courses and groups instead of the buyer.
- Course completion and certificate award raced; they now happen in one transaction.
- Group enrollment joined another company's group with the same name.
- `isMemberOfGroup` and `add-user-to-group` used a non-existent `users` field.
- Enrollment field access ran an invalid query per field.
- `fetch-progress` returned empty `enrolledCourses` and `completedCourses`.
- The `./addresses` export pointed at a missing file.
- The groups collection ignored its overrides, including `access`.
- Draft courses could be self-enrolled in.
- Lesson downloads were stored in media, so anyone could list and download paid course files.
- Passing a quiz never completed its lesson (1.x read a `quiz.lesson` field that does not exist).
- Certificate PDFs from 1.x kept a file name built from the course, certificate and user ids. The
  first request now copies the file to a random name and deletes the old one.
- Lesson order, release schedules and `accessExpirationDays` were not enforced, so a student could
  skip ahead or keep a time-limited course after it should have closed. Completing a lesson, submitting
  a quiz and reading lesson content now follow those rules. New enrollments store `enrolledAt`.
  Progress from before that field has no date, so it does not expire.
- `completedLesson` treated any populated lesson in progress as the lesson being checked, and
  `isPreviousLessonCompleted` treated an id-only lesson list as already finished. Both now compare
  ids as strings, including a lesson that was not populated.
- Lesson documents are public, and their `quizzes` relationship was too, so anyone could read the
  quiz ids. That field now follows the same enrollment check as lesson content.
- `isAdminOrAuthorOrEnrolledInCourse` read `data.course`, which is empty on a read, so it denied
  every enrolled student. It now checks the stored document, and a list is limited to enrolled
  courses and their lessons.
- Group read and leader update compared ids with `Array.includes` and looked up a hardcoded
  `groups` slug. A missing group threw out of the access check. Ids now match as strings, the
  configured slug is used, and a missing group is denied.
- A logged-in user could save an address with `customer` set to someone else. The owner is now
  the logged-in user, and only admins can set or change `customer`.
- GraphQL schema failed to build. `correctAnswer` is still stored as `true`, `false` or `both`, and
  the admin still shows a select, but the field is text so those words are not GraphQL enum names.
  Regenerate the admin import map after upgrading so the select renders.

### Dependencies

- 0 production audit findings. One dev-only finding remains (`deepmerge` under Jest, no fixed
  release). `happy-dom` (via `@payloadcms/richtext-lexical`) is overridden to `^21.0.4` for its
  advisories; Lexical's headless HTML conversion was checked against it.
