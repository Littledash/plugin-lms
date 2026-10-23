import { includesId } from '../services/shared.js';
import { checkRole } from './checkRole.js';
import { findGroup } from './findGroup.js';
const memberQuery = (userId)=>({
        or: [
            {
                students: {
                    in: [
                        userId
                    ]
                }
            },
            {
                leaders: {
                    in: [
                        userId
                    ]
                }
            }
        ]
    });
export const isMemberOfGroup = async ({ id, req })=>{
    const { user } = req;
    if (!user) {
        return false;
    }
    if (checkRole([
        'admin'
    ], user)) {
        return true;
    }
    if (id) {
        const group = await findGroup(req, id);
        if (!group) {
            return false;
        }
        return includesId(group.students || [], user.id) || includesId(group.leaders || [], user.id);
    }
    return memberQuery(user.id);
};

//# sourceMappingURL=isMemberOfGroup.js.map