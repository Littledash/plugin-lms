import { checkRole } from '../access/checkRole.js';
import { addUserToGroup } from '../services/addUserToGroup.js';
import { findDoc, getSlugs, includesId, LMSError, toIds } from '../services/shared.js';
import { lmsHandler, requireFields } from './handler.js';
/**
 * Lets an admin or a leader of the group add another user to it. The user being added is
 * `memberId`; the requester is always the logged-in user.
 */ export const addUserToGroupHandler = (_args)=>lmsHandler(async ({ data, req, userId })=>{
        requireFields(data, [
            'groupId',
            'memberId',
            'role'
        ]);
        const group = await findDoc(req, getSlugs(req).groups, data.groupId, 'Group');
        if (!checkRole([
            'admin'
        ], req.user) && !includesId(toIds(group.leaders), userId)) {
            throw new LMSError('You are not authorized to add users to this group.', 403);
        }
        const role = data.role;
        await addUserToGroup({
            groupId: group.id,
            req,
            role,
            userId: data.memberId
        });
        return Response.json({
            message: `Successfully added user to group as ${role}.`,
            success: true
        });
    });

//# sourceMappingURL=add-user-to-group.js.map