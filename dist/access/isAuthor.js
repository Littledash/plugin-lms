import { checkRole } from './checkRole.js';
/**
 * Access control that only allows users with author role
 * @returns True if the user has author role, false otherwise
 */ export const isAuthor = ({ req: { user } })=>{
    return Boolean(user && checkRole([
        'author'
    ], user));
};
export const isAuthorFieldLevel = ({ req: { user } })=>{
    // Return true or false based on if the user has an admin role
    return Boolean(checkRole([
        'author'
    ], user));
};

//# sourceMappingURL=isAuthor.js.map