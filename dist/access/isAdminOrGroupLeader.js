import { includesId } from '../services/shared.js';
import { checkRole } from './checkRole.js';
import { findGroup } from './findGroup.js';
export const isAdminOrGroupLeader = async ({ id, req })=>{
    const { user } = req;
    if (!user) {
        return false;
    }
    if (checkRole([
        'admin'
    ], user)) {
        return true;
    }
    if (!id) {
        return false;
    }
    const group = await findGroup(req, id);
    if (!group) {
        return false;
    }
    return includesId(group.leaders || [], user.id);
};

//# sourceMappingURL=isAdminOrGroupLeader.js.map