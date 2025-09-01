import { enrolledCoursesField } from './enrolledCoursesField.js';
import { completedCoursesField } from './completedCoursesField.js';
import { certificatesField } from './certifcatesField.js';
export const defaultStudentFields = ()=>{
    return [
        enrolledCoursesField({}),
        completedCoursesField({}),
        certificatesField({})
    ];
};

//# sourceMappingURL=defaultStudentFields.js.map