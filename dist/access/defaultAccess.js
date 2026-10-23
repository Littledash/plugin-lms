import { anyone } from './anyone.js';
import { checkRole } from './checkRole.js';
import { isAdmin } from './isAdmin.js';
import { isAdminOrAuthor } from './isAdminOrAuthor.js';
import { isAdminOrGroupLeader } from './isAdminOrGroupLeader.js';
import { isAdminOrLoggedIn } from './isAdminOrLoggedIn.js';
import { isAdminOrSelf } from './isAdminOrSelf.js';
import { isMemberOfGroup } from './isMemberOfGroup.js';
/**
 * Admins, or the user the document belongs to through `field`.
 */ export const isAdminOrOwner = (field)=>({ req: { user } })=>{
        if (!user) {
            return false;
        }
        if (checkRole([
            'admin'
        ], user)) {
            return true;
        }
        return {
            [field]: {
                equals: user.id
            }
        };
    };
const authoredContent = (read)=>({
        create: isAdminOrAuthor,
        delete: isAdminOrAuthor,
        read,
        update: isAdminOrAuthor
    });
/**
 * Access applied to plugin collections. Payload's own default lets any logged-in user create,
 * update and delete, so every operation is set. A consumer's `access` override is merged over
 * these, so overriding one operation keeps the others safe.
 */ export const defaultAccess = {
    addresses: {
        create: isAdminOrLoggedIn,
        delete: isAdminOrOwner('customer'),
        read: isAdminOrOwner('customer'),
        update: isAdminOrOwner('customer')
    },
    categories: authoredContent(anyone),
    certificates: authoredContent(isAdminOrLoggedIn),
    // Lesson and course content fields have their own enrollment checks
    courses: authoredContent(anyone),
    groups: {
        create: isAdmin,
        delete: isAdmin,
        read: isMemberOfGroup,
        update: isAdminOrGroupLeader
    },
    lessons: authoredContent(anyone),
    // Answer fields are hidden by field access
    questions: authoredContent(isAdminOrLoggedIn),
    quizzes: authoredContent(isAdminOrLoggedIn),
    students: {
        create: anyone,
        delete: isAdmin,
        read: isAdminOrSelf,
        update: isAdminOrSelf
    },
    tags: authoredContent(anyone),
    topics: authoredContent(anyone)
};
export const withDefaultAccess = (defaults, overrides)=>({
        ...defaults,
        ...overrides
    });

//# sourceMappingURL=defaultAccess.js.map