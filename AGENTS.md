# AGENTS.md

Guide for coding agents working on `@littledash/plugin-lms`, a Payload CMS plugin that adds an LMS
(courses, lessons, topics, quizzes, questions, certificates, groups) to a Payload app.

## Commands

```bash
pnpm install
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint on src and dev; dist is ignored
pnpm build          # copyfiles + tsc declarations + swc → dist/
pnpm test           # integration tests (Jest, ESM, in-memory MongoDB), 1–3 minutes
pnpm dev            # dev app in dev/ against DATABASE_URI from dev/.env
pnpm hooks:install  # once per clone: pre-push runs typecheck and tests
```

Always run `pnpm build` and commit `dist/` with source changes. Consumers install this package from
git, and CI fails when `dist/` does not match the source.

## Layout

| Path | Contents |
| --- | --- |
| `src/plugin/index.ts` | Plugin entry: adds collections and `/lms/*` endpoints, stores slugs on `config.custom.lms`. |
| `src/<collection>/*Collection.ts` | Collection factories. Pattern: `...overrides`, then `access: withDefaultAccess(defaultAccess.x, overrides?.access)`, then merged `fields`. |
| `src/services/` | Business logic on the Local API: `enrollUser`, `completeLesson`, `submitQuiz`, `completeCourse`, `generateCertificate`, `addUserToGroup`, `getProgress`. Exported as `@littledash/plugin-lms/services`. |
| `src/endpoints/` | Thin HTTP wrappers built with `lmsHandler` (`handler.ts`). |
| `src/access/` | Access functions and `defaultAccess.ts`. |
| `src/fields/` | Reusable field factories (progress, certificates, roles, prices, ...). |
| `src/providers/` | Client React provider (`useLMS`). |
| `dev/` | Dev Payload app and `int.spec.ts` (all tests). |
| `docs/` | Upgrade guide, security model, how-to guides. Update them with behaviour changes. |

## Security rules (do not regress)

- Endpoints act on `req.user` only. `lmsHandler` rejects a body `userId`; never read one.
- Validate input with `requireId` / `requireAnswers`, never cast request data.
- Services trust their `userId` argument, so only server code with a verified identity may call them.
- Pass `req` to every Local API call in services and wrap writes in `withTransaction`.
- Throw `LMSError(message, status)` for refusals; other errors become a generic 500.
- Progress, certificates, roles, group seats and membership are admin-only writes; question answer
  fields are hidden from non-authors. Keep field `access` when changing those fields.
- Every collection sets every access operation (Payload's default lets any logged-in user write).
- Compare IDs with `sameId` / `includesId` (ObjectId vs string).
- Do not log user documents or personal details; log IDs.

## Tests

Every rule an endpoint enforces needs a test for the refused request and the allowed one, and
should check the stored documents, not only the response. Use the helpers at the top of
`dev/int.spec.ts` (`createUser`, `clientFor`, `createCourse`, `createLesson`, `createQuiz`, `enroll`).
Endpoints are called through the real REST handlers so access control runs as in production.

## Style

TypeScript, ESM (`.js` import suffixes), Payload's ESLint config (sorted imports and keys).
Comments explain why, not what. Match the surrounding code.
