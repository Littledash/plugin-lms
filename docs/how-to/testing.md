# How to run and write the tests

The integration tests in `dev/int.spec.ts` boot Payload with the dev config (`dev/payload.config.ts`)
against an in-memory MongoDB replica set, so transactions behave as they do in production.

## Run them

```bash
pnpm install
pnpm test
```

The first run downloads a MongoDB binary to `~/.cache/mongodb-binaries`.

Tests never use `DATABASE_URI` from `dev/.env`. To run against your own replica set instead of the
in-memory one, set `TEST_DATABASE_URI`:

```bash
TEST_DATABASE_URI="mongodb://127.0.0.1:27017/lms-test?replicaSet=rs0" pnpm test
```

That database is not cleaned up, so use a throwaway one.

## How the tests are structured

- Endpoints are called through the real REST handlers (`NextRESTClient`), so authentication, access
  control and body parsing run as in production.
- Each test creates its own users, courses and lessons with the helpers at the top of the file
  (`createUser`, `clientFor`, `createCourse`, `createLesson`, `createQuiz`), so tests do not depend
  on each other.
- Server-side flows call the services directly, as your app would.

## Write a test

```typescript
it('refuses a lesson from another course', async () => {
  const course = await createCourse({ lessons: [{ lesson: (await createLesson()).id }] })
  const otherLesson = await createLesson()
  const user = await createUser()
  await enroll(user, course) // the server-side enrollUser service

  const { status } = await post(await clientFor(user), 'complete-lesson', {
    courseId: course.id,
    lessonId: otherLesson.id,
  })

  expect(status).toBe(400)
})
```

For every rule an endpoint enforces, test both sides: the request that must be refused, and the one
that must succeed. Check the stored documents, not only the response.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `Instance failed to start within …ms` | The machine is busy. The start timeout is 60s; retry, or raise `launchTimeout` in `dev/int.spec.ts`. |
| `Unable to write … due to catalog changes` | A write ran before Payload finished building indexes. The setup waits for them; keep that `model.init()` step if you change `beforeAll`. |
| `Cannot use import statement outside a module` | A dependency ships ESM only. Add it to `esModules` in `jest.config.js`. |
