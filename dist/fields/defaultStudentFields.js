import { rolesField } from './rolesField.js';
import { enrolledCoursesField } from './enrolledCoursesField.js';
import { completedCoursesField } from './completedCoursesField.js';
import { certificatesField } from './certifcatesField.js';
export const defaultStudentFields = ()=>{
    return [
        rolesField({}),
        enrolledCoursesField({}),
        completedCoursesField({}),
        certificatesField({})
    ];
};

//# sourceMappingURL=defaultStudentFields.js.map