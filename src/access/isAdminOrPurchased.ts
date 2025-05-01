import type { Access, FieldAccess, Where } from 'payload'

import type { User } from '../payload-types.js'

import { checkRole } from './checkRole.js'

/**
 * Access control for Course based on the user's role and the query string
 */
export const isAdminOrPurchased: Access = ({ req, req: { user } }) => {
  if (user && checkRole(['admin'], user)) {
    return true
  }

  return {
    students: {
      contains: user?.id,
    },
  }
}


export const isAdminOrPurchasedFieldLevel: FieldAccess<{ id: string }, User> = ({
  req: { user },
  id,
}) => {
  return isAdminOrPurchased({ req, req: { user } })
}