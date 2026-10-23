import { asSlug, getSlugs } from '../services/shared.js';
/** Loads a group for an access check. A missing id is `null`, not an exception. */ export const findGroup = async (req, id)=>{
    const group = await req.payload.findByID({
        id,
        collection: asSlug(getSlugs(req).groups),
        depth: 0,
        disableErrors: true,
        req
    });
    return group ? group : null;
};

//# sourceMappingURL=findGroup.js.map