import { checkRole } from '../access/checkRole.js';
import { asSlug, getSlugs, includesId, sameId, toId } from '../services/shared.js';
/*
 * Courses are public, but who has completed a course and which groups are enrolled in it are not.
 * For reads that run access control (REST, GraphQL, Local API with `overrideAccess: false`),
 * anyone but admins and authors sees only themselves in `enrolledStudents` and
 * `courseCompletedStudents`, and only their own groups in `courseEnrolledGroups`. A site can still check "is this user in the list" from the
 * course, or in a `where` clause.
 *
 * Reads that skip access control (the LMS services, server code using the Local API's default) see
 * the full lists. They must: the services add to these lists and write them back whole.
 */ const isStaff = (req)=>checkRole([
        'admin',
        'author'
    ], req.user ?? null);
/** The groups the user leads or belongs to, looked up once per request. */ const memberGroupIdsByRequest = new WeakMap();
const memberGroupIds = (req, userId)=>{
    const cached = memberGroupIdsByRequest.get(req);
    if (cached) {
        return cached;
    }
    const slug = getSlugs(req).groups;
    const lookup = req.payload.collections[slug] ? req.payload.find({
        collection: asSlug(slug),
        depth: 0,
        limit: 0,
        overrideAccess: true,
        pagination: false,
        req,
        select: {},
        where: {
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
        }
    }).then(({ docs })=>docs.map((doc)=>doc.id)) : Promise.resolve([]);
    memberGroupIdsByRequest.set(req, lookup);
    return lookup;
};
export const onlyOwnStudent = ({ overrideAccess, req, value })=>{
    if (overrideAccess || !Array.isArray(value) || isStaff(req)) {
        return value;
    }
    const userId = req.user?.id;
    return userId === undefined ? [] : value.filter((entry)=>sameId(toId(entry), userId));
};
export const onlyOwnGroups = async ({ overrideAccess, req, value })=>{
    if (overrideAccess || !Array.isArray(value) || isStaff(req)) {
        return value;
    }
    const userId = req.user?.id;
    if (userId === undefined || value.length === 0) {
        return [];
    }
    const ownGroups = await memberGroupIds(req, userId);
    return value.filter((entry)=>includesId(ownGroups, toId(entry)));
};

//# sourceMappingURL=ownMembershipOnly.js.map