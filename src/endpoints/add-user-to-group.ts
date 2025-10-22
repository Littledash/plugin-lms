import { addDataAndFileToRequest, CollectionSlug, TypedCollection, type Endpoint } from 'payload'

type Args = {
  userSlug: string
  groupSlug: string
}

type AddUserToGroupHandler = (args: Args) => Endpoint['handler']

export const addUserToGroupHandler: AddUserToGroupHandler = ({ 
  userSlug = 'users', 
  groupSlug = 'groups' 
}) => async (req) => {
  await addDataAndFileToRequest(req)
  const data = req.data
  const user = req.user
  const payload = req.payload
  const groupId = data?.groupId
  const userId = data?.userId
  const role = data?.role // 'leader' or 'student'

  if (!user || !userId) {
    return Response.json(
      { message: 'You must be logged in to add users to a group.' },
      { status: 401 },
    )
  }

  if (!groupId || !userId || !role) {
    return Response.json(
      { message: 'Group ID, User ID, and role are required.' },
      { status: 400 },
    )
  }

  if (!['leader', 'student'].includes(role)) {
    return Response.json(
      { message: 'Role must be either "leader" or "student".' },
      { status: 400 },
    )
  }

  try {

    const currentUser = await payload.findByID({
      collection: userSlug as CollectionSlug,
      id: userId ? userId : user.id,
      depth: 1,
    })

    if (!currentUser) {
      return Response.json({ message: 'User not found.' }, { status: 404 })
    }

    const group = await payload.findByID({
      collection: groupSlug as CollectionSlug,
      id: groupId,
      depth: 1,
    })

    if (!group) {
      return Response.json({ message: 'Group not found.' }, { status: 404 })
    }

    // Authorization check: only admins or leaders of the group can add users
    const isLeader = group.leaders?.some((leader: TypedCollection['users']) => {
      const leaderId = typeof leader === 'object' ? leader.id : leader
      return leaderId === currentUser.id
    })
    const isAdmin = currentUser.roles?.includes('admin')

    if (!isAdmin && !isLeader) {
      return Response.json(
        { message: 'You are not authorized to add users to this group.' },
        { status: 403 },
      )
    }

    // Check if user is already in the group
    const currentLeaders = (group.leaders?.docs || []).map(
      (leader: string | TypedCollection[typeof userSlug]) => (typeof leader === 'object' ? leader.id : leader),
    )
    const currentStudents = (group.users?.docs || []).map(
      (student: string | TypedCollection[typeof userSlug]) => (typeof student === 'object' ? student.id : student),
    )

    if (role === 'leader' && currentLeaders.includes(userId)) {
      return Response.json({ message: 'User is already a leader in this group.' }, { status: 409 })
    }

    if (role === 'student' && currentStudents.includes(userId)) {
      return Response.json({ message: 'User is already a student in this group.' }, { status: 409 })
    }

    // Add user to the appropriate role
    const updateData: Record<string, string[]> = {}
    
    if (role === 'leader') {
      updateData.leaders = [...currentLeaders, currentUser.id]
    } else {
      updateData.users = [...currentStudents, currentUser.id]
    }

    await payload.update({
      collection: groupSlug as CollectionSlug,
      id: groupId,
      data: updateData,
    })

    payload.logger.info(`User ${userId} added to group ${groupId} as ${role}`)

    return Response.json({ 
      success: true, 
      message: `Successfully added user to group as ${role}.` 
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred.'
    payload.logger.error(message)
    return Response.json({ message }, { status: 500 })
  }
}
