import type { PayloadRequest } from 'payload'

import { asSlug, getSlugs, type ID, type LMSDoc } from '../services/shared.js'

/** Loads a group for an access check. A missing id is `null`, not an exception. */
export const findGroup = async (req: PayloadRequest, id: ID): Promise<LMSDoc | null> => {
  const group = await req.payload.findByID({
    id,
    collection: asSlug(getSlugs(req).groups),
    depth: 0,
    disableErrors: true,
    req,
  })
  return group ? (group as LMSDoc) : null
}
