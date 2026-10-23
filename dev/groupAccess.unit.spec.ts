import { isAdminOrGroupLeader } from '../src/access/isAdminOrGroupLeader.js'
import { isMemberOfGroup } from '../src/access/isMemberOfGroup.js'
import { sameId } from '../src/services/shared.js'

/** The shape Payload stores for an unpopulated relationship: BSON id, with raw bytes on `id`. */
const objectId = (hex: string) => ({
  id: Buffer.from(hex, 'hex'),
  _bsontype: 'ObjectId' as const,
  toString() {
    return hex
  },
})

const userId = () => '507f1f77bcf86cd799439011'

const reqFor = (user: string, group: { leaders?: unknown[]; students?: unknown[] } | null) => {
  const calls: unknown[] = []
  const req = {
    payload: {
      config: { custom: { lms: { slugs: { groups: 'cohorts' } } } },
      findByID: (args: unknown) => {
        calls.push(args)
        return group
      },
    },
    user: { id: user },
  }
  return { calls, req }
}

describe('group access ids', () => {
  it('matches an ObjectId to its string id', () => {
    const id = userId()
    expect(sameId(objectId(id) as never, id)).toBe(true)
    expect(sameId({ id: objectId(id) } as never, id)).toBe(true)
  })

  it('treats an ObjectId leader as the logged-in user', async () => {
    const id = userId()
    const { calls, req } = reqFor(id, { leaders: [objectId(id)] })

    await expect(isAdminOrGroupLeader({ id: 'g1', req: req as never })).resolves.toBe(true)
    expect(calls[0]).toMatchObject({ collection: 'cohorts', disableErrors: true, req })
  })

  it('treats an ObjectId student as a group member', async () => {
    const id = userId()
    const { req } = reqFor(id, { students: [objectId(id)] })

    await expect(isMemberOfGroup({ id: 'g1', req: req as never })).resolves.toBe(true)
  })

  it('denies a missing group instead of throwing', async () => {
    const { req } = reqFor(userId(), null)

    await expect(isMemberOfGroup({ id: 'missing', req: req as never })).resolves.toBe(false)
    await expect(isAdminOrGroupLeader({ id: 'missing', req: req as never })).resolves.toBe(false)
  })
})
