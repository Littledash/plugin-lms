# Changelog

## 2.0.13

### Added

- `fetch-progress` and `getProgress` return `accessibleCourses`, and the provider exposes it as
  `useLMS().accessibleCourses`: the courses the user can open now, enrolled directly, completed, or
  through a group they lead or belong to, and not expired. It is the rule the server applies to
  course content, so sites no longer need to infer access from progress entries, which are kept
  after a refund, dispute or expiry and are missing for some group access. `enrolledCourses` and
  `completedCourses` are unchanged and still list direct enrollments only. The provider caches the
  list with the rest of the progress; a cache saved by an older version shows no courses until the
  server responds.

## 2.0.12

### Changed

- The provider's `CourseProgress` type (`useLMS().getProgress`, `progress`) includes `revokedAt` and
  `revokedReason`. The data was already returned; now it is typed, so a site can see that a
  progress entry kept after a refund or dispute gives no access. The `getProgress` and
  `enrolledCourses` docs say what each one means for access, and the README progress example
  checks `revokedAt`.

## 2.0.11

### Added

- `unenrollGroup({ req, groupId, courseId, reason?, keepUserIds? })` in
  `@littledash/plugin-lms/services` takes a course away from a group after its purchase was
  refunded or disputed. The group is removed from the course's enrolled groups and its purchase is
  marked with the new `purchasedCourses.seatManagement.revokedAt` and `revokedReason` fields. Every
  leader and member loses the course unless another group gives them access or they are in
  `keepUserIds`; their progress is kept and marked revoked, and certificates are kept. Returns the
  IDs of the members who lost access. Safe to call twice.
- A revoked group purchase refuses coupon joins (403) and takes no seat when a leader adds a member.
  A new purchase by a leader of the group restores it with the seats bought and clears the members'
  revocations. A retried fulfilment of the refunded group order (same purchase key) restores
  nothing.

## 2.0.10

### Added

- `unenrollUser({ req, userId, courseId, reason? })` in `@littledash/plugin-lms/services` takes a
  course away, for example after a refund or a payment dispute. The student is removed from the
  course's enrolled and completed students, so content access stops at once. Their progress is
  kept and marked with the new `coursesProgress.revokedAt` and `revokedReason` fields. Awarded
  certificates are kept. Safe to call twice. Groups are not changed; the result's `groupAccess`
  says whether the student still has access through one.
- `enrollUser` restores a revoked student on a new purchase: back on the enrolled list (or the
  completed list if they had finished), revocation cleared, new access period from now. A purchase
  key already recorded for that course returns `already-renewed`, so a retried fulfilment of a
  refunded order does not give the course back.

## 2.0.9

### Added

- `courses.canSelfEnroll` plugin option: a server-side callback, `({ course, req, user }) =>
  boolean | Promise<boolean>`, that can refuse self-enrollment through `POST /api/lms/enroll`
  (403 "This course requires a purchase."), for example in a course sold by a paid product whose
  access mode was left `open`. It runs only after the access-mode check, so it can never allow
  more; a throw refuses with a 500. Admins and server-side `enrollUser` are not affected. The
  `CanSelfEnroll`, `CanSelfEnrollArgs`, `CoursesConfig` and `LMSPluginConfig` types are exported
  from `@littledash/plugin-lms`.

## 2.0.8

### Added

- Certificates have an optional **Presenter name** (`presenterName`, up to 200 characters). When
  set, the PDF prints it after "presented by" instead of the first author's name, so it can carry a
  title and post-nominals, for example "Dr Jane Smith (MBBS)".

### Changed

- The certificate PDF fits the description, course title and presenter above the logo area. They
  start at 20pt, 24pt and 18pt ("presented by" at 16pt, smaller than before) and shrink together in
  5% steps, down to half size, until the presenter's baseline is at least 165pt above the bottom of
  the page. Before, a course title of three or more lines pushed the presenter into the logo.
  Stored PDFs keep the old layout until regenerated.

## 2.0.7

### Fixed

- Certificates are generated when a name, course title or description contains characters the
  PDF font cannot draw. Before, generation failed with `WinAnsi cannot encode` and the student got
  no certificate. Invisible format characters (such as U+200E, a left-to-right mark) are removed,
  letters the font lacks lose their accent or get a close plain letter (`ř` → `r`, `Ł` → `L`), and
  anything else (emoji, non-Latin scripts) prints as `?`.

## 2.0.6

### Fixed

- Certificate PDFs print the description one line per block (heading, paragraph, list item or line
  break), wrapped to the page, with headings in bold. Before, the blocks were joined into one
  unwrapped line that ran off both edges of the page. A long description is set smaller (down to
  10pt) so the course title and presenter below it stay on the page, and they move down to make
  room. Stored PDFs keep the old layout until regenerated.

## 2.0.5

### Fixed

- Certificate PDFs no longer embed the template image at its uploaded size. The template is resized
  to fit A4 landscape at about 200 dpi (2400 × 1700 pixels at most) and embedded as a JPEG, using
  the `sharp` in the Payload config. A 16.6 MB template PNG now gives a PDF of about 490 KB.
  Without `sharp` the image is embedded as uploaded, as before. Stored PDFs keep their size until
  regenerated.

## 2.0.4

### Changed

- The price input has an accessible name (`Price (AUD)`, by currency) when the field has no label.
- Lint warnings cleared in the tests and dev app. The dev app loads the example courses on start
  when `SEED=true` is set in `dev/.env`.

## 2.0.3

### Changed

- Dev dependencies updated to clear `pnpm audit`: Payload 3.94.1 (mongoose 8.24.7), Next.js 16.4.6,
  and overrides for `follow-redirects`, `glob` and `minimatch`. The `payload` peer range is
  unchanged (`^3.92.0`) and no runtime code changed.
- Removed the "under heavy development" warning from the README.

## 2.0.2

### Changed

- `addresses.customer` is indexed, since addresses are looked up by their owner.

## 2.0.1

### Changed

- A course linked from another document (a lesson, a student's progress or certificates, a group,
  a site link) loads only `title`, `slug`, `excerpt`, `featuredImage` and `categories`, where the
  course has them, instead of everything including its student lists. Query courses directly for
  other fields, or set `defaultPopulate` in the courses override.

### Fixed

- Course member lists were public: anyone could list who is enrolled in or has completed a course,
  and its groups. Now admins and authors see them whole and everyone else sees only themselves and
  their own groups. Students can now query `enrolledStudents` for their own courses (it was refused).

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

- Quiz marking: fill in the blank (ignoring case and extra spaces), multiple choice with several
  correct answers, and sorting are now marked. Essay, assessment and free choice questions are left
  out of the score instead of counting as wrong. Answers may be lists of up to 100 IDs. Single
  choice accepts any choice ticked as correct.
- A quiz with no questions no longer blocks its lesson; it had scored 0 and could never be passed.
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
