import { addDataAndFileToRequest } from 'payload';
export const addUserToGroupHandler = ({ userSlug = 'users', groupSlug = 'groups' })=>async (req)=>{
        await addDataAndFileToRequest(req);
        const data = req.data;
        const user = req.user;
        const payload = req.payload;
        const groupId = data?.groupId;
        const userId = data?.userId;
        const role = data?.role // 'leader' or 'student'
        ;
        if (!user) {
            return Response.json({
                message: 'You must be logged in to add users to a group.'
            }, {
                status: 401
            });
        }
        if (!groupId || !userId || !role) {
            return Response.json({
                message: 'Group ID, User ID, and role are required.'
            }, {
                status: 400
            });
        }
        if (![
            'leader',
            'student'
        ].includes(role)) {
            return Response.json({
                message: 'Role must be either "leader" or "student".'
            }, {
                status: 400
            });
        }
        try {
            const group = await payload.findByID({
                collection: groupSlug,
                id: groupId,
                depth: 1
            });
            if (!group) {
                return Response.json({
                    message: 'Group not found.'
                }, {
                    status: 404
                });
            }
            // Authorization check: only admins or leaders of the group can add users
            const isLeader = group.leaders?.some((leader)=>leader.id === user.id);
            const isAdmin = user.roles?.includes('admin');
            if (!isAdmin && !isLeader) {
                return Response.json({
                    message: 'You are not authorized to add users to this group.'
                }, {
                    status: 403
                });
            }
            const targetUser = await payload.findByID({
                collection: userSlug,
                id: userId,
                depth: 1
            });
            if (!targetUser) {
                return Response.json({
                    message: 'User not found.'
                }, {
                    status: 404
                });
            }
            // Check if user is already in the group
            const currentLeaders = (group.leaders?.docs || []).map((leader)=>typeof leader === 'object' ? leader.id : leader);
            const currentStudents = (group.users?.docs || []).map((student)=>typeof student === 'object' ? student.id : student);
            if (role === 'leader' && currentLeaders.includes(userId)) {
                return Response.json({
                    message: 'User is already a leader in this group.'
                }, {
                    status: 409
                });
            }
            if (role === 'student' && currentStudents.includes(userId)) {
                return Response.json({
                    message: 'User is already a student in this group.'
                }, {
                    status: 409
                });
            }
            // Add user to the appropriate role
            const updateData = {};
            if (role === 'leader') {
                updateData.leaders = [
                    ...currentLeaders,
                    userId
                ];
            } else {
                updateData.users = [
                    ...currentStudents,
                    userId
                ];
            }
            await payload.update({
                collection: groupSlug,
                id: groupId,
                data: updateData
            });
            payload.logger.info(`User ${userId} added to group ${groupId} as ${role}`);
            return Response.json({
                success: true,
                message: `Successfully added user to group as ${role}.`
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            payload.logger.error(message);
            return Response.json({
                message
            }, {
                status: 500
            });
        }
    };

//# sourceMappingURL=add-user-to-group.js.map