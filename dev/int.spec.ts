/**
 * Integration tests for the LMS plugin endpoints, services and access control.
 *
 * Endpoints are called through the real REST handlers so authentication and access control run
 * exactly as in production. Tests use an in-memory MongoDB replica set (transactions enabled).
 */

import type { Payload } from 'payload'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { getPayload } from 'payload'

import { NextRESTClient } from './helpers/NextRESTClient.js'
import {
  addUserToGroup,
  completeCourse,
  enrollUser,
  generateCertificate,
  getCertificateFileName,
  LMSError,
} from '../src/exports/services.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = { id: string; [key: string]: any }

let payload: Payload
let memoryDB: MongoMemoryReplSet | undefined

const PASSWORD = 'test-password'
let counter = 0

const createUser = async (roles: string[] = ['student']): Promise<Doc> => {
  counter++
  return (await payload.create({
    collection: 'users',
    data: {
      email: `user${counter}@example.com`,
      password: PASSWORD,
      firstName: 'Test',
      lastName: `User${counter}`,
      roles,
    },
  })) as unknown as Doc
}

const clientFor = async (user: Doc): Promise<NextRESTClient> => {
  const client = new NextRESTClient(payload.config)
  const result = await client.login({ slug: 'users', credentials: { email: user.email, password: PASSWORD } })
  if (!result.token) {
    throw new Error(`Login failed for ${user.email}: ${JSON.stringify(result)}`)
  }
  return client
}

const anonymous = () => new NextRESTClient(payload.config)

const post = async (client: NextRESTClient, path: string, body: Record<string, unknown>) => {
  const response = await client.POST(`/lms/${path}` as `/${string}`, { body: JSON.stringify(body) })
  return { status: response.status, body: await response.json() }
}

const createLesson = async (quizzes: string[] = []): Promise<Doc> =>
  (await payload.create({
    collection: 'lessons',
    data: { title: `Lesson ${++counter}`, quizzes },
  })) as unknown as Doc

const createCourse = async ({
  accessMode = 'open',
  lessons = [],
  certificate,
  status = 'published',
}: {
  accessMode?: string
  status?: 'draft' | 'published'
  lessons?: { lesson: string; isOptional?: boolean }[]
  certificate?: string
} = {}): Promise<Doc> =>
  (await payload.create({
    collection: 'courses',
    data: {
      _status: status,
      title: `Course ${++counter}`,
      enrollment: { accessMode },
      lessons,
      ...(certificate ? { awards: { certificate } } : {}),
    },
  })) as unknown as Doc

const createQuiz = async (minimumScore = 100): Promise<{ quiz: Doc; correctChoiceId: string; questionId: string }> => {
  const question = (await payload.create({
    collection: 'questions',
    data: {
      title: 'Question',
      question: 'Pick the right one',
      questionType: 'multipleChoice',
      points: 1,
      choices: [
        { label: 'Right', isCorrect: true },
        { label: 'Wrong', isCorrect: false },
      ],
    },
  })) as unknown as Doc
  const quiz = (await payload.create({
    collection: 'quizzes',
    data: { title: `Quiz ${++counter}`, questions: [question.id], minimumScore },
  })) as unknown as Doc
  const correctChoice = question.choices.find((choice: Doc) => choice.isCorrect)
  return { quiz, correctChoiceId: correctChoice.id, questionId: question.id }
}

const getDoc = async (collection: 'users' | 'courses' | 'groups', id: string): Promise<Doc> =>
  (await payload.findByID({ collection, id, depth: 0 })) as unknown as Doc

const ids = (values: unknown): string[] =>
  (Array.isArray(values) ? values : []).map((value) => String(typeof value === 'object' ? value.id : value))

/** Enrolls a user the way the site does after a verified purchase. */
const enroll = (user: Doc, course: Doc) =>
  enrollUser({ req: { payload } as never, userId: user.id, courseId: course.id })

beforeAll(async () => {
  process.env.DISABLE_PAYLOAD_HMR = 'true'
  // Always use an in-memory database so tests never touch the dev database from .env
  if (process.env.TEST_DATABASE_URI) {
    process.env.DATABASE_URI = process.env.TEST_DATABASE_URI
  } else {
    memoryDB = await MongoMemoryReplSet.create({
      replSet: { count: 1, dbName: 'payloadmemory' },
      // MongoDB's default 5ms lock wait makes back-to-back writes to one user flaky in tests
      instanceOpts: [
        {
          args: ['--setParameter', 'maxTransactionLockRequestTimeoutMillis=5000'],
          // The default 10s start timeout is too short on a busy machine
          launchTimeout: 60000,
        },
      ],
    })
    process.env.DATABASE_URI = `${memoryDB.getUri()}&retryWrites=true`
  }
  process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || 'test-secret'

  const { default: config } = await import('./payload.config.js')
  payload = await getPayload({ config })
  // Payload builds indexes in the background; writes in a transaction fail until they exist
  await Promise.all(
    Object.values((payload.db as unknown as { collections: Record<string, { init: () => Promise<unknown> }> }).collections).map(
      (model) => model.init(),
    ),
  )
})

afterAll(async () => {
  if (payload?.db?.destroy) {
    await payload.db.destroy()
  }
  await memoryDB?.stop()
})

describe('every endpoint', () => {
  const endpoints = [
    'enroll',
    'complete-lesson',
    'submit-quiz',
    'complete-course',
    'generate-certificate',
    'add-user-to-group',
  ]

  it.each(endpoints)('%s requires a logged-in user', async (path) => {
    const { status } = await post(anonymous(), path, { courseId: 'x' })
    expect(status).toBe(401)
  })

  it.each(endpoints)('%s rejects a client-supplied userId', async (path) => {
    const victim = await createUser()
    const attacker = await clientFor(await createUser())
    const { status } = await post(attacker, path, { courseId: 'x', userId: victim.id })
    expect(status).toBe(400)
  })

  it('fetch-progress requires a logged-in user', async () => {
    const response = await anonymous().GET('/lms/fetch-progress')
    expect(response.status).toBe(401)
  })
})

describe('enroll endpoint', () => {
  it('lets a user enroll themselves in an open course', async () => {
    const user = await createUser()
    const course = await createCourse({ accessMode: 'open' })

    const { status, body } = await post(await clientFor(user), 'enroll', { courseId: course.id })

    expect(status).toBe(200)
    expect(body.status).toBe('enrolled')
    expect(ids((await getDoc('courses', course.id)).enrolledStudents)).toContain(user.id)
    const progress = (await getDoc('users', user.id)).coursesProgress
    expect(ids(progress.map((entry: Doc) => entry.course))).toContain(course.id)
  })

  it.each(['buy now', 'recurring', 'closed'])('refuses self-enrollment in a %s course', async (accessMode) => {
    const user = await createUser()
    const course = await createCourse({ accessMode })

    const { status } = await post(await clientFor(user), 'enroll', { courseId: course.id })

    expect(status).toBe(403)
    expect(ids((await getDoc('courses', course.id)).enrolledStudents)).not.toContain(user.id)
  })

  it('refuses group enrollment over HTTP', async () => {
    const user = await createUser()
    const course = await createCourse()
    const { status } = await post(await clientFor(user), 'enroll', {
      courseId: course.id,
      isGroup: true,
      isLeader: true,
      companyName: 'Acme',
    })
    expect(status).toBe(403)
  })

  it('does not leak internal error details', async () => {
    const user = await createUser()
    const { status, body } = await post(await clientFor(user), 'enroll', { courseId: 'not-an-id' })
    expect([404, 500]).toContain(status)
    expect(body.message).not.toMatch(/Cast|ObjectId|mongo/i)
  })
})

describe('enrollUser service', () => {
  it('enrolls the given user, not the caller', async () => {
    const buyer = await createUser()
    const course = await createCourse({ accessMode: 'buy now' })

    const result = await enroll(buyer, course)

    expect(result.status).toBe('enrolled')
    expect(ids((await getDoc('courses', course.id)).enrolledStudents)).toEqual([buyer.id])
  })

  it('creates a group for a leader and grants the leader role', async () => {
    const leader = await createUser()
    const course = await createCourse({ accessMode: 'buy now' })

    const { groupId } = await enrollUser({
      req: { payload } as never,
      userId: leader.id,
      courseId: course.id,
      group: { companyName: 'Acme', isLeader: true, totalSeats: 5 },
    })

    const group = await getDoc('groups', String(groupId))
    expect(ids(group.leaders)).toEqual([leader.id])
    expect(group.purchasedCourses[0].seatManagement.seatsTotal).toBe(5)
    expect(ids((await getDoc('courses', course.id)).courseEnrolledGroups)).toContain(String(groupId))
    expect((await getDoc('users', leader.id)).roles).toContain('leader')
  })

  it('never joins another company group by name alone', async () => {
    const course = await createCourse({ accessMode: 'buy now' })
    const owner = await createUser()
    const { groupId: ownerGroup } = await enrollUser({
      req: { payload } as never,
      userId: owner.id,
      courseId: course.id,
      group: { companyName: 'Same Name Ltd', isLeader: true },
    })

    const outsider = await createUser()
    const { groupId: outsiderGroup } = await enrollUser({
      req: { payload } as never,
      userId: outsider.id,
      courseId: course.id,
      group: { companyName: 'Same Name Ltd', isLeader: true },
    })

    expect(String(outsiderGroup)).not.toBe(String(ownerGroup))
    expect(ids((await getDoc('groups', String(ownerGroup))).leaders)).toEqual([owner.id])
  })

  it('rolls back every write when a step fails', async () => {
    const user = await createUser()
    const course = await createCourse({ accessMode: 'buy now' })

    // No company name and no existing group: the group step throws after nothing is saved
    await expect(
      enrollUser({ req: { payload } as never, userId: user.id, courseId: course.id, group: { isLeader: true } }),
    ).rejects.toBeInstanceOf(LMSError)

    expect(ids((await getDoc('courses', course.id)).enrolledStudents)).not.toContain(user.id)
  })
})

describe('complete-lesson endpoint', () => {
  it('refuses users who are not enrolled', async () => {
    const lesson = await createLesson()
    const course = await createCourse({ lessons: [{ lesson: lesson.id }] })
    const user = await createUser()

    const { status } = await post(await clientFor(user), 'complete-lesson', {
      courseId: course.id,
      lessonId: lesson.id,
    })
    expect(status).toBe(403)
  })

  it('refuses a lesson that is not part of the course', async () => {
    const course = await createCourse({ lessons: [{ lesson: (await createLesson()).id }] })
    const otherLesson = await createLesson()
    const user = await createUser()
    await enroll(user, course)

    const { status } = await post(await clientFor(user), 'complete-lesson', {
      courseId: course.id,
      lessonId: otherLesson.id,
    })
    expect(status).toBe(400)
  })

  it("requires the lesson's quizzes to be passed first", async () => {
    const { quiz, questionId, correctChoiceId } = await createQuiz()
    const lesson = await createLesson([quiz.id])
    const course = await createCourse({ lessons: [{ lesson: lesson.id }, { lesson: (await createLesson()).id }] })
    const user = await createUser()
    await enroll(user, course)
    const client = await clientFor(user)

    const blocked = await post(client, 'complete-lesson', { courseId: course.id, lessonId: lesson.id })
    expect(blocked.status).toBe(409)

    await post(client, 'submit-quiz', {
      courseId: course.id,
      quizId: quiz.id,
      answers: { [questionId]: correctChoiceId },
    })
    const allowed = await post(client, 'complete-lesson', { courseId: course.id, lessonId: lesson.id })
    expect(allowed.status).toBe(200)
    expect(allowed.body.courseCompleted).toBe(false)
  })

  it('completes the course and awards its certificate after the last required lesson', async () => {
    const certificate = (await payload.create({
      collection: 'certificates',
      data: { title: 'Completion' },
    })) as unknown as Doc
    const required = await createLesson()
    const optional = await createLesson()
    const course = await createCourse({
      lessons: [{ lesson: required.id }, { lesson: optional.id, isOptional: true }],
      certificate: certificate.id,
    })
    const user = await createUser()
    await enroll(user, course)

    const { status, body } = await post(await clientFor(user), 'complete-lesson', {
      courseId: course.id,
      lessonId: required.id,
    })

    expect(status).toBe(200)
    expect(body.courseCompleted).toBe(true)
    const updatedCourse = await getDoc('courses', course.id)
    expect(ids(updatedCourse.courseCompletedStudents)).toContain(user.id)
    expect(ids(updatedCourse.enrolledStudents)).not.toContain(user.id)
    const updatedUser = await getDoc('users', user.id)
    expect(ids(updatedUser.certificates.map((entry: Doc) => entry.certificate))).toEqual([certificate.id])
  })
})

describe('submit-quiz endpoint', () => {
  it('refuses a quiz that is not part of the course', async () => {
    const { quiz } = await createQuiz()
    const course = await createCourse({ lessons: [{ lesson: (await createLesson()).id }] })
    const user = await createUser()
    await enroll(user, course)

    const { status } = await post(await clientFor(user), 'submit-quiz', {
      courseId: course.id,
      quizId: quiz.id,
      answers: {},
    })
    expect(status).toBe(400)
  })

  it('grades answers and keeps the best score', async () => {
    const { quiz, questionId, correctChoiceId } = await createQuiz()
    const course = await createCourse({ lessons: [{ lesson: (await createLesson([quiz.id])).id }] })
    const user = await createUser()
    await enroll(user, course)
    const client = await clientFor(user)

    const pass = await post(client, 'submit-quiz', {
      courseId: course.id,
      quizId: quiz.id,
      answers: { [questionId]: correctChoiceId },
    })
    expect(pass.body).toMatchObject({ score: 100, passed: true })

    const fail = await post(client, 'submit-quiz', { courseId: course.id, quizId: quiz.id, answers: {} })
    expect(fail.body).toMatchObject({ score: 0, passed: false })

    const progress = (await getDoc('users', user.id)).coursesProgress[0]
    expect(progress.completedQuizzes[0].score).toBe(100)
  })
})

describe('complete-course endpoint', () => {
  it('refuses to complete a course with required lessons outstanding', async () => {
    const course = await createCourse({ lessons: [{ lesson: (await createLesson()).id }] })
    const user = await createUser()
    await enroll(user, course)

    const { status } = await post(await clientFor(user), 'complete-course', { courseId: course.id })

    expect(status).toBe(409)
    expect(ids((await getDoc('courses', course.id)).courseCompletedStudents)).not.toContain(user.id)
  })

  it('completeCourse service awards a missing certificate on an already completed course', async () => {
    const lesson = await createLesson()
    const course = await createCourse({ lessons: [{ lesson: lesson.id }] })
    const user = await createUser()
    await enroll(user, course)
    await post(await clientFor(user), 'complete-lesson', { courseId: course.id, lessonId: lesson.id })

    // The course gains a certificate after the user completed it (the legacy data case)
    const certificate = (await payload.create({
      collection: 'certificates',
      data: { title: 'Late certificate' },
    })) as unknown as Doc
    await payload.update({ collection: 'courses', id: course.id, data: { awards: { certificate: certificate.id } } })

    const result = await completeCourse({ req: { payload } as never, userId: user.id, courseId: course.id })

    expect(result).toEqual({ status: 'already-completed', certificateAwarded: true })
    expect((await getDoc('users', user.id)).certificates).toHaveLength(1)
  })
})

describe('generate-certificate endpoint', () => {
  it('refuses a certificate the user has not been awarded', async () => {
    const certificate = (await payload.create({
      collection: 'certificates',
      data: { title: 'Not earned' },
    })) as unknown as Doc
    const course = await createCourse({ certificate: certificate.id })
    const user = await createUser()
    await enroll(user, course)

    const { status } = await post(await clientFor(user), 'generate-certificate', {
      courseId: course.id,
      certificateId: certificate.id,
    })
    expect(status).toBe(403)
  })

  it('creates the PDF once for an awarded certificate', async () => {
    const certificate = (await payload.create({
      collection: 'certificates',
      data: { title: 'Earned' },
    })) as unknown as Doc
    const lesson = await createLesson()
    const course = await createCourse({ lessons: [{ lesson: lesson.id }], certificate: certificate.id })
    const user = await createUser()
    await enroll(user, course)
    const client = await clientFor(user)
    await post(client, 'complete-lesson', { courseId: course.id, lessonId: lesson.id })

    const first = await post(client, 'generate-certificate', { courseId: course.id, certificateId: certificate.id })
    expect(first.status).toBe(200)
    expect(first.body.status).toBe('created')
    expect(first.body.certificate.mimeType).toBe('application/pdf')

    const second = await generateCertificate({
      req: { payload } as never,
      userId: user.id,
      courseId: course.id,
      certificateId: certificate.id,
    })
    expect(second.status).toBe('existing')
    expect(String(second.media.id)).toBe(String(first.body.certificate.id))
  })
})

describe('add-user-to-group endpoint', () => {
  const createGroup = async (leader: Doc): Promise<Doc> =>
    (await payload.create({
      collection: 'groups',
      data: { title: `Group ${++counter}`, leaders: [leader.id] },
    })) as unknown as Doc

  it('refuses requesters who are not a leader of the group', async () => {
    const group = await createGroup(await createUser())
    const outsider = await createUser()

    const { status } = await post(await clientFor(outsider), 'add-user-to-group', {
      groupId: group.id,
      memberId: outsider.id,
      role: 'leader',
    })

    expect(status).toBe(403)
    expect(ids((await getDoc('groups', group.id)).leaders)).not.toContain(outsider.id)
  })

  it('lets a group leader add a student', async () => {
    const leader = await createUser()
    const group = await createGroup(leader)
    const member = await createUser()

    const { status } = await post(await clientFor(leader), 'add-user-to-group', {
      groupId: group.id,
      memberId: member.id,
      role: 'student',
    })

    expect(status).toBe(200)
    expect(ids((await getDoc('groups', group.id)).students)).toEqual([member.id])
  })

  it('addUserToGroup service rejects duplicate membership', async () => {
    const leader = await createUser()
    const group = await createGroup(leader)
    await expect(
      addUserToGroup({ req: { payload } as never, groupId: group.id, userId: leader.id, role: 'leader' }),
    ).rejects.toMatchObject({ status: 409 })
  })
})

describe('fetch-progress endpoint', () => {
  it("returns only the logged-in user's progress", async () => {
    const lesson = await createLesson()
    const course = await createCourse({ lessons: [{ lesson: lesson.id }, { lesson: (await createLesson()).id }] })
    const user = await createUser()
    await enroll(user, course)
    const client = await clientFor(user)
    await post(client, 'complete-lesson', { courseId: course.id, lessonId: lesson.id })

    const response = await client.GET('/lms/fetch-progress')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.enrolledCourses.map(String)).toEqual([course.id])
    expect(body.coursesProgress[0]).toMatchObject({ completionPercentage: 50, courseCompletion: '1/2' })
  })
})

describe('field access', () => {
  it('users cannot edit their own progress or certificates through the REST API', async () => {
    const user = await createUser()
    const course = await createCourse()
    const certificate = (await payload.create({
      collection: 'certificates',
      data: { title: 'Forged' },
    })) as unknown as Doc

    await (await clientFor(user)).PATCH(`/users/${user.id}`, {
      body: JSON.stringify({
        coursesProgress: [{ course: course.id, completed: true, completedLessons: [], completedQuizzes: [] }],
        certificates: [{ certificate: certificate.id, course: course.id, completedDate: new Date().toISOString() }],
        roles: ['admin'],
      }),
    })

    const saved = await getDoc('users', user.id)
    expect(saved.coursesProgress ?? []).toHaveLength(0)
    expect(saved.certificates ?? []).toHaveLength(0)
    expect(saved.roles).not.toContain('admin')
  })

  it('hides quiz answers from students but not from authors', async () => {
    const { questionId } = await createQuiz()
    const read = async (user: Doc) => {
      const response = await (await clientFor(user)).GET(`/questions/${questionId}`)
      return response.json()
    }

    const asStudent = await read(await createUser(['student']))
    expect(asStudent.choices[0]).not.toHaveProperty('isCorrect')

    const asAuthor = await read(await createUser(['author']))
    expect(asAuthor.choices.some((choice: Doc) => choice.isCorrect)).toBe(true)
  })

  it('shows quiz questions only to students enrolled in a course containing the quiz', async () => {
    const { quiz } = await createQuiz()
    const course = await createCourse({ lessons: [{ lesson: (await createLesson([quiz.id])).id }] })
    const enrolled = await createUser()
    await enroll(enrolled, course)
    const outsider = await createUser()

    const read = async (user: Doc) => (await (await clientFor(user)).GET(`/quizzes/${quiz.id}`)).json()

    expect((await read(enrolled)).questions).toHaveLength(1)
    expect(await read(outsider)).not.toHaveProperty('questions')
  })
})

describe('hardening', () => {
  it.each([{ $ne: null }, ['a'], 'not a valid id!', -1, 1.5])('rejects courseId %p', async (courseId) => {
    const user = await createUser()
    const { status } = await post(await clientFor(user), 'enroll', { courseId })
    expect(status).toBe(400)
  })

  it.each([[['a']], [{ q: { $gt: '' } }], ['answers']])('rejects malformed answers %p', async (answers) => {
    const { quiz } = await createQuiz()
    const course = await createCourse({ lessons: [{ lesson: (await createLesson([quiz.id])).id }] })
    const user = await createUser()
    await enroll(user, course)

    const { status } = await post(await clientFor(user), 'submit-quiz', {
      answers,
      courseId: course.id,
      quizId: quiz.id,
    })
    expect(status).toBe(400)
  })

  it('enforces the quiz attempt limit before grading', async () => {
    const { quiz, questionId, correctChoiceId } = await createQuiz()
    await payload.update({ collection: 'quizzes', id: quiz.id, data: { attemptLimit: 2 } })
    const course = await createCourse({ lessons: [{ lesson: (await createLesson([quiz.id])).id }] })
    const user = await createUser()
    await enroll(user, course)
    const client = await clientFor(user)
    const attempt = (answers: Record<string, string>) =>
      post(client, 'submit-quiz', { answers, courseId: course.id, quizId: quiz.id })

    expect((await attempt({})).status).toBe(200)
    expect((await attempt({})).status).toBe(200)
    const third = await attempt({ [questionId]: correctChoiceId })
    expect(third.status).toBe(429)
    expect(third.body).not.toHaveProperty('score')
  })

  it('enforces a cooldown between quiz attempts', async () => {
    const lms = payload.config.custom.lms as { quizAttemptCooldownSeconds: number }
    lms.quizAttemptCooldownSeconds = 60
    try {
      const { quiz } = await createQuiz()
      const course = await createCourse({ lessons: [{ lesson: (await createLesson([quiz.id])).id }] })
      const user = await createUser()
      await enroll(user, course)
      const client = await clientFor(user)
      const attempt = () => post(client, 'submit-quiz', { answers: {}, courseId: course.id, quizId: quiz.id })

      expect((await attempt()).status).toBe(200)
      const second = await attempt()
      expect(second.status).toBe(429)
      expect(second.body.message).toMatch(/wait \d+ seconds/)
    } finally {
      lms.quizAttemptCooldownSeconds = 0
    }
  })

  it('stops a leader adding more members than the group paid for', async () => {
    const leader = await createUser()
    const course = await createCourse({ accessMode: 'buy now' })
    const { groupId } = await enrollUser({
      courseId: course.id,
      group: { companyName: 'Two Seats Ltd', isLeader: true, totalSeats: 2 },
      req: { payload } as never,
      userId: leader.id,
    })
    const client = await clientFor(leader)
    const add = async () =>
      post(client, 'add-user-to-group', { groupId, memberId: (await createUser()).id, role: 'student' })

    expect((await add()).status).toBe(200)
    expect((await add()).status).toBe(409)
    const group = await getDoc('groups', String(groupId))
    expect(group.purchasedCourses[0].seatManagement.seatsUsed).toBe(2)
  })

  it('stops coupon enrollments once the group is full', async () => {
    const coupon = (await payload.create({ collection: 'coupons', data: {} })) as unknown as Doc
    const course = await createCourse({ accessMode: 'buy now' })
    const join = async (isLeader: boolean) =>
      enrollUser({
        courseId: course.id,
        group: { companyName: 'Coupon Co', couponId: coupon.id, isLeader, totalSeats: 2 },
        req: { payload } as never,
        userId: (await createUser()).id,
      })

    await join(true)
    await join(false)
    await expect(join(false)).rejects.toMatchObject({ status: 409 })
  })
})

describe('collection access defaults', () => {
  it('students cannot create, edit or join groups through the REST API', async () => {
    const leader = await createUser()
    const group = (await payload.create({
      collection: 'groups',
      data: { title: 'Locked Ltd', leaders: [leader.id] },
    })) as unknown as Doc
    const student = await createUser()
    const client = await clientFor(student)

    const created = await client.POST('/groups', { body: JSON.stringify({ title: 'Mine' }) })
    expect(created.status).toBe(403)

    await client.PATCH(`/groups/${group.id}`, { body: JSON.stringify({ students: [student.id] }) })
    expect(ids((await getDoc('groups', group.id)).students)).not.toContain(student.id)
  })

  it.each(['courses', 'lessons', 'quizzes', 'questions', 'certificates', 'tags', 'topics', 'categories'])(
    'students cannot create %s',
    async (collection) => {
      const client = await clientFor(await createUser())
      const response = await client.POST(`/${collection}`, { body: JSON.stringify({ title: 'Nope' }) })
      expect(response.status).toBe(403)
    },
  )

  it('refuses self-enrollment in an unpublished course', async () => {
    const course = await createCourse({ status: 'draft' })
    const { status } = await post(await clientFor(await createUser()), 'enroll', { courseId: course.id })
    expect(status).toBe(404)
  })

  it('stores generated certificates under a random file name on the award', async () => {
    const certificate = (await payload.create({
      collection: 'certificates',
      data: { title: 'Private' },
    })) as unknown as Doc
    const lesson = await createLesson()
    const course = await createCourse({ lessons: [{ lesson: lesson.id }], certificate: certificate.id })
    const user = await createUser()
    await enroll(user, course)
    await post(await clientFor(user), 'complete-lesson', { courseId: course.id, lessonId: lesson.id })

    const { media } = await generateCertificate({
      certificateId: certificate.id,
      courseId: course.id,
      req: { payload } as never,
      userId: user.id,
    })

    expect(media.filename).not.toContain(String(user.id))
    expect(media.filename).toMatch(/^certificate-[0-9a-f-]{36}\.pdf$/)
    const award = (await getDoc('users', user.id)).certificates[0]
    expect(String(award.file)).toBe(String(media.id))
  })
})


const richText = (text: string) => ({
  root: {
    type: 'root',
    children: [{ type: 'paragraph', children: [{ type: 'text', text, version: 1 }], version: 1 }],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
})

describe('content access', () => {
  const setup = async () => {
    const lesson = (await payload.create({
      collection: 'lessons',
      data: { content: richText('Lesson secret'), title: `Lesson ${++counter}` },
    })) as unknown as Doc
    const topic = (await payload.create({
      collection: 'topics',
      data: { content: richText('Topic secret'), lesson: lesson.id, title: `Topic ${++counter}` },
    })) as unknown as Doc
    const course = (await payload.create({
      collection: 'courses',
      data: {
        _status: 'published',
        courseSettings: { courseMaterials: richText('Course secret') },
        enrollment: { accessMode: 'buy now' },
        lessons: [{ lesson: lesson.id }],
        title: `Course ${++counter}`,
      },
    })) as unknown as Doc
    const enrolled = await createUser()
    await enroll(enrolled, course)
    return { course, enrolled, lesson, outsider: await createUser(), topic }
  }

  const read = async (user: Doc, path: string) => (await (await clientFor(user)).GET(path as `/${string}`)).json()

  it('shows lesson content only to enrolled students', async () => {
    const { enrolled, lesson, outsider } = await setup()
    expect((await read(enrolled, `/lessons/${lesson.id}`)).content).toBeDefined()
    expect(await read(outsider, `/lessons/${lesson.id}`)).not.toHaveProperty('content')
  })

  it('shows topic content only to students enrolled in a course with its lesson', async () => {
    const { enrolled, outsider, topic } = await setup()
    expect((await read(enrolled, `/topics/${topic.id}`)).content).toBeDefined()
    expect(await read(outsider, `/topics/${topic.id}`)).not.toHaveProperty('content')
  })

  it('shows course materials only to enrolled students', async () => {
    const { course, enrolled, outsider } = await setup()
    expect((await read(enrolled, `/courses/${course.id}`)).courseSettings.courseMaterials).toBeDefined()
    expect((await read(outsider, `/courses/${course.id}`)).courseSettings ?? {}).not.toHaveProperty(
      'courseMaterials',
    )
  })

  it('shows content to group members of an enrolled group', async () => {
    const { course, lesson } = await setup()
    const leader = await createUser()
    const coupon = (await payload.create({ collection: 'coupons', data: {} })) as unknown as Doc
    await enrollUser({
      courseId: course.id,
      group: { companyName: 'Content Co', couponId: coupon.id, isLeader: true, totalSeats: 3 },
      req: { payload } as never,
      userId: leader.id,
    })
    const member = await createUser()
    await enrollUser({
      courseId: course.id,
      group: { couponId: coupon.id, isLeader: false },
      req: { payload } as never,
      userId: member.id,
    })

    expect((await read(member, `/lessons/${lesson.id}`)).content).toBeDefined()
  })

})

describe('ownership access', () => {
  it('users can read themselves but not other users', async () => {
    const user = await createUser()
    const other = await createUser()
    const client = await clientFor(user)

    expect((await client.GET(`/users/${user.id}`)).status).toBe(200)
    expect([403, 404]).toContain((await client.GET(`/users/${other.id}`)).status)
    const list = await (await client.GET('/users')).json()
    expect(list.docs.map((doc: Doc) => doc.id)).toEqual([user.id])
  })

  it('group members read their own group only', async () => {
    const member = await createUser()
    const own = (await payload.create({
      collection: 'groups',
      data: { students: [member.id], title: `Own ${++counter}` },
    })) as unknown as Doc
    const other = (await payload.create({
      collection: 'groups',
      data: { leaders: [(await createUser()).id], title: `Other ${++counter}` },
    })) as unknown as Doc
    const client = await clientFor(member)

    expect((await client.GET(`/groups/${own.id}`)).status).toBe(200)
    expect([403, 404]).toContain((await client.GET(`/groups/${other.id}`)).status)
    const list = await (await client.GET('/groups')).json()
    expect(list.docs.map((doc: Doc) => doc.id)).toEqual([own.id])
  })

  it('a group leader can update their group but a member cannot', async () => {
    const leader = await createUser()
    const member = await createUser()
    const group = (await payload.create({
      collection: 'groups',
      data: { leaders: [leader.id], students: [member.id], title: 'Before' },
    })) as unknown as Doc

    await (await clientFor(member)).PATCH(`/groups/${group.id}`, { body: JSON.stringify({ title: 'Member edit' }) })
    expect((await getDoc('groups', group.id)).title).toBe('Before')

    await (await clientFor(leader)).PATCH(`/groups/${group.id}`, { body: JSON.stringify({ title: 'Leader edit' }) })
    expect((await getDoc('groups', group.id)).title).toBe('Leader edit')
  })

  it('a group leader cannot change seats or membership directly', async () => {
    const leader = await createUser()
    const course = await createCourse({ accessMode: 'buy now' })
    const { groupId } = await enrollUser({
      courseId: course.id,
      group: { companyName: 'Fixed Seats Ltd', isLeader: true, totalSeats: 2 },
      req: { payload } as never,
      userId: leader.id,
    })
    const before = await getDoc('groups', String(groupId))
    const outsider = await createUser()

    await (await clientFor(leader)).PATCH(`/groups/${groupId}`, {
      body: JSON.stringify({
        purchasedCourses: [{ ...before.purchasedCourses[0], seatManagement: { ...before.purchasedCourses[0].seatManagement, seatsTotal: 500 } }],
        students: [outsider.id],
        leaders: [leader.id, outsider.id],
      }),
    })

    const after = await getDoc('groups', String(groupId))
    expect(after.purchasedCourses[0].seatManagement.seatsTotal).toBe(2)
    expect(ids(after.students)).not.toContain(outsider.id)
    expect(ids(after.leaders)).toEqual([leader.id])
  })

  it('addresses are private to their owner', async () => {
    const owner = await createUser()
    const ownerClient = await clientFor(owner)
    const created = await ownerClient.POST('/addresses', {
      body: JSON.stringify({ addressLine1: '1 Test St', city: 'Brisbane', country: 'AU', customer: owner.id }),
    })
    expect(created.status).toBe(201)
    const address = (await created.json()).doc as Doc

    const stranger = await clientFor(await createUser())
    expect([403, 404]).toContain((await stranger.GET(`/addresses/${address.id}`)).status)
    expect((await (await stranger.GET('/addresses')).json()).docs).toHaveLength(0)
    await stranger.DELETE(`/addresses/${address.id}`)
    expect(await payload.findByID({ collection: 'addresses', id: address.id, disableErrors: true })).not.toBeNull()
  })
})

describe('service edge cases', () => {
  it('admins can enroll themselves in a paid course', async () => {
    const admin = await createUser(['admin'])
    const course = await createCourse({ accessMode: 'buy now' })
    const { status, body } = await post(await clientFor(admin), 'enroll', { courseId: course.id })
    expect(status).toBe(200)
    expect(body.status).toBe('enrolled')
  })

  it('a coupon member joining a purchased course uses a seat', async () => {
    const coupon = (await payload.create({ collection: 'coupons', data: {} })) as unknown as Doc
    const course = await createCourse({ accessMode: 'buy now' })
    const leader = await createUser()
    const { groupId } = await enrollUser({
      courseId: course.id,
      group: { companyName: 'Seat Co', couponId: coupon.id, isLeader: true, totalSeats: 3 },
      req: { payload } as never,
      userId: leader.id,
    })
    const member = await createUser()
    await enrollUser({
      courseId: course.id,
      group: { couponId: coupon.id, isLeader: false },
      req: { payload } as never,
      userId: member.id,
    })

    const group = await getDoc('groups', String(groupId))
    expect(ids(group.students)).toEqual([member.id])
    expect(group.purchasedCourses[0].seatManagement.seatsUsed).toBe(2)
    expect(ids((await getDoc('courses', course.id)).enrolledStudents)).toEqual(
      expect.arrayContaining([leader.id, member.id]),
    )
  })

  it('links a certificate PDF generated under the 1.x file name', async () => {
    const certificate = (await payload.create({ collection: 'certificates', data: { title: 'Legacy' } })) as unknown as Doc
    const lesson = await createLesson()
    const course = await createCourse({ certificate: certificate.id, lessons: [{ lesson: lesson.id }] })
    const user = await createUser()
    await enroll(user, course)
    await post(await clientFor(user), 'complete-lesson', { courseId: course.id, lessonId: lesson.id })

    const legacyName = getCertificateFileName({ certificateId: certificate.id, courseId: course.id, userId: user.id })
    const pdf = Buffer.from('%PDF-1.4 legacy')
    const legacy = (await payload.create({
      collection: 'media',
      data: {},
      file: { name: legacyName, data: pdf, mimetype: 'application/pdf', size: pdf.length },
    })) as unknown as Doc

    const { media, status } = await generateCertificate({
      certificateId: certificate.id,
      courseId: course.id,
      req: { payload } as never,
      userId: user.id,
    })

    expect(status).toBe('existing')
    expect(String(media.id)).toBe(String(legacy.id))
    expect(String((await getDoc('users', user.id)).certificates[0].file)).toBe(String(legacy.id))
  })

  it('refuses to generate a certificate for a user without a full name', async () => {
    const certificate = (await payload.create({ collection: 'certificates', data: { title: 'Named' } })) as unknown as Doc
    const lesson = await createLesson()
    const course = await createCourse({ certificate: certificate.id, lessons: [{ lesson: lesson.id }] })
    const user = await createUser()
    await enroll(user, course)
    await post(await clientFor(user), 'complete-lesson', { courseId: course.id, lessonId: lesson.id })
    await payload.db.updateOne({ collection: 'users', data: { lastName: '' }, id: user.id })

    await expect(
      generateCertificate({ certificateId: certificate.id, courseId: course.id, req: { payload } as never, userId: user.id }),
    ).rejects.toMatchObject({ status: 400 })
  })
})

describe('quiz completion', () => {
  it('passing the last quiz on a lesson completes the lesson and the course', async () => {
    const certificate = (await payload.create({ collection: 'certificates', data: { title: 'Quiz cert' } })) as unknown as Doc
    const { quiz, questionId, correctChoiceId } = await createQuiz()
    const lesson = await createLesson([quiz.id])
    const course = await createCourse({ certificate: certificate.id, lessons: [{ lesson: lesson.id }] })
    const user = await createUser()
    await enroll(user, course)

    const { body } = await post(await clientFor(user), 'submit-quiz', {
      answers: { [questionId]: correctChoiceId },
      courseId: course.id,
      quizId: quiz.id,
    })

    expect(body).toMatchObject({ completedLessonIds: [lesson.id], courseCompleted: true, passed: true })
    const saved = await getDoc('users', user.id)
    expect(ids(saved.coursesProgress[0].completedLessons.map((entry: Doc) => entry.lesson))).toEqual([lesson.id])
    expect(saved.certificates).toHaveLength(1)
  })

  it('a lesson with two quizzes completes only when both are passed', async () => {
    const first = await createQuiz()
    const second = await createQuiz()
    const lesson = await createLesson([first.quiz.id, second.quiz.id])
    const course = await createCourse({ lessons: [{ lesson: lesson.id }, { lesson: (await createLesson()).id }] })
    const user = await createUser()
    await enroll(user, course)
    const client = await clientFor(user)
    const pass = (quiz: Awaited<ReturnType<typeof createQuiz>>) =>
      post(client, 'submit-quiz', {
        answers: { [quiz.questionId]: quiz.correctChoiceId },
        courseId: course.id,
        quizId: quiz.quiz.id,
      })

    expect((await pass(first)).body.completedLessonIds).toEqual([])
    expect((await pass(second)).body).toMatchObject({ completedLessonIds: [lesson.id], courseCompleted: false })
  })

  it('a failed attempt completes nothing', async () => {
    const { quiz } = await createQuiz()
    const lesson = await createLesson([quiz.id])
    const course = await createCourse({ lessons: [{ lesson: lesson.id }] })
    const user = await createUser()
    await enroll(user, course)

    const { body } = await post(await clientFor(user), 'submit-quiz', { answers: {}, courseId: course.id, quizId: quiz.id })

    expect(body).toMatchObject({ completedLessonIds: [], courseCompleted: false, passed: false })
    expect((await getDoc('users', user.id)).coursesProgress[0].completedLessons).toHaveLength(0)
  })
})

