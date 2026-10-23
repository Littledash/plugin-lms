import { checkRole } from './checkRole.js';
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
        const group = await req.payload.findByID({
            id,
            collection: 'groups',
            depth: 1
        });
        if (group) {
            const userIds = group.students?.map((member)=>typeof member === 'object' ? member.id : member) || [];
            const leaderIds = group.leaders?.map((leader)=>typeof leader === 'object' ? leader.id : leader) || [];
            if (userIds.includes(user.id) || leaderIds.includes(user.id)) {
                return true;
            }
        }
    }
    // A query to find groups a user is in
    const query = {
        or: [
            {
                students: {
                    in: [
                        user.id
                    ]
                }
            },
            {
                leaders: {
                    in: [
                        user.id
                    ]
                }
            }
        ]
    };
    return query;
};

//# sourceMappingURL=isMemberOfGroup.js.map