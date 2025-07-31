import { Field } from "payload"

export const findFieldByNameAndType = (
    fields: Field[],
    fieldName: string,
    fieldType: string,
  ): Field | null => {
    for (const field of fields) {
      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          const found = tab.fields?.find(
            (f) => 'name' in f && f.name === fieldName && f.type === fieldType,
          )
          if (found) return found
        }
      } else if ('name' in field && field.name === fieldName && field.type === fieldType) {
        return field
      }
    }
    return null
  }