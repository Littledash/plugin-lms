import { checkRole } from './checkRole.js';
/**
 * Access control that only allows users with admin role
 * @returns True if the user has admin role, false otherwise
 */ export const isAdmin = ({ req: { user } })=>{
    // Return true or false based on if the user has an admin role
    return Boolean(checkRole([
        'admin'
    ], user));
};
export const isAdminFieldLevel = ({ req: { user } })=>{
    // Return true or false based on if the user has an admin role
    return Boolean(checkRole([
        'admin'
    ], user));
};

//# sourceMappingURL=isAdmin.js.map