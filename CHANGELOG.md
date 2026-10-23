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
- Group seat limits; group leaders cannot edit seats or membership directly.
- Passing a quiz completes its lessons (and the course) once all of a lesson's quizzes are passed.
- Secure default access on every plugin collection; overrides merge per operation.
- `certificates[].file` links each award to its PDF, stored under a random file name.
- Integration tests and client tests for the React provider and admin field components.

### Fixed

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
- Passing a quiz never completed its lesson (1.x read a `quiz.lesson` field that does not exist).
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

### Known issues

- Dependencies: 84 audit findings down to 1 (dev-only, no fix available); 0 in production.
