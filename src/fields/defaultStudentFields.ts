import type { Field } from 'payload'
import { enrolledCoursesField } from './enrolledCoursesField.js'
import { completedCoursesField } from './completedCoursesField.js'
import { certificatesField } from './certifcatesField.js'

export const defaultStudentFields: () => Field[] = () => {
  return [
    enrolledCoursesField({}),
    completedCoursesField({}),
    certificatesField({}),
  ]
}
