import { checkRole } from './checkRole.js';
/**
 * Access control that allows users with admin role or author role
 * @returns True if the user is an admin or author, false otherwise
 */ export const isAdminOrAuthor = ({ req: { user } })=>{
    if (user && checkRole([
        'admin',
        'author'
    ], user)) {
        return true;
    }
    return false;
};
/**
 * Access control that allows users with admin role or author role
 * @returns True if the user is an admin or author, false otherwise
 */ export const isAdminOrAuthorFieldLevel = ({ req: { user } })=>{
    if (user && checkRole([
        'admin',
        'author'
    ], user)) {
        return true;
    }
    return false;
};

//# sourceMappingURL=isAdminOrAuthor.js.map