import type { Field } from 'payload'

import { certificatesField } from './certifcatesField.js'
import { completedCoursesField } from './completedCoursesField.js'
import { coursesProgressField } from './coursesProgressField.js'
import { enrolledCoursesField } from './enrolledCoursesField.js'

export const defaultStudentFields: () => Field[] = () => {
  return [
    enrolledCoursesField({}),
    completedCoursesField({}),
    certificatesField({}),
    coursesProgressField({}),
  ]
}
