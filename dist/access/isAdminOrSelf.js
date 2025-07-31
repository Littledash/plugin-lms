import { checkRole } from './checkRole.js';
/**
 * Access control that allows users with admin role or self
 * @returns True if the user is an admin or self, false otherwise
 */ export const isAdminOrSelf = ({ req: { user } })=>{
    // Need to be logged in
    if (user) {
        // If user has role of 'admin'
        if (checkRole([
            'admin'
        ], user)) {
            return true;
        }
        // If any other type of user, only provide access to themselves
        return {
            id: {
                equals: user.id
            }
        };
    }
    // Reject everyone else
    return false;
};
export const isAdminOrSelfFieldLevel = ({ req: { user }, id })=>{
    // Return true or false based on if the user has an admin role
    if (checkRole([
        'admin'
    ], user)) return true;
    if (user?.id === id) return true;
    return false;
};

//# sourceMappingURL=isAdminOrSelf.js.map