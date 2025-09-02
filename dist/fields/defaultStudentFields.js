import { enrolledCoursesField } from './enrolledCoursesField.js';
import { completedCoursesField } from './completedCoursesField.js';
import { certificatesField } from './certifcatesField.js';
import { coursesProgressField } from './coursesProgressField.js';
export const defaultStudentFields = ()=>{
    return [
        enrolledCoursesField({}),
        completedCoursesField({}),
        certificatesField({}),
        coursesProgressField({})
    ];
};

//# sourceMappingURL=defaultStudentFields.js.map