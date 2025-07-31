import type { Field } from 'payload'
import { rolesField } from './rolesField.js'
import { enrolledCoursesField } from './enrolledCoursesField.js'
import { completedCoursesField } from './completedCoursesField.js'
import { certificatesField } from './certifcatesField.js'

export const defaultStudentFields: () => Field[] = () => {
  return [
    rolesField({}),
    enrolledCoursesField({}),
    completedCoursesField({}),
    certificatesField({}),
  ]
}
