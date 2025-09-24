import { checkRole } from './checkRole.js';
/**
 * Access control that allows users with admin role or student role
 * @returns True if the user is an admin or student, false otherwise
 */ export const isAdminOrStudent = ({ req: { user } })=>{
    if (user && checkRole([
        'admin',
        'student'
    ], user)) {
        return true;
    }
    return false;
};
export const isAdminOrStudentFieldLevel = ({ req: { user }, doc })=>{
    if (!user) return false;
    if (checkRole([
        'admin',
        'student'
    ], user)) return true;
    return doc?.students?.includes(String(user.id)) ?? false;
};

//# sourceMappingURL=isAdminOrStudent.js.map