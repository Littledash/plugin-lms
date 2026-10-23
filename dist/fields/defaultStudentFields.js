import { certificatesField } from './certifcatesField.js';
import { completedCoursesField } from './completedCoursesField.js';
import { coursesProgressField } from './coursesProgressField.js';
import { enrolledCoursesField } from './enrolledCoursesField.js';
export const defaultStudentFields = ()=>{
    return [
        enrolledCoursesField({}),
        completedCoursesField({}),
        certificatesField({}),
        coursesProgressField({})
    ];
};

//# sourceMappingURL=defaultStudentFields.js.map