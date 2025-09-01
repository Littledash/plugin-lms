import { checkRole } from './checkRole.js';
export const isAdminOrGroupLeader = async ({ req, id })=>{
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
        const group = await req.payload.findByID({
            collection: 'groups',
            id,
            depth: 1
        });
        if (group && group.leaders) {
            const leaderIds = group.leaders.map((leader)=>typeof leader === 'object' ? leader.id : leader);
            if (leaderIds.includes(user.id)) {
                return true;
            }
        }
    }
    return false;
};

//# sourceMappingURL=isAdminOrGroupLeader.js.map