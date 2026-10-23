/**
 * Stored as text. `true` and `false` are illegal GraphQL enum names, so this cannot be a select
 * field or the schema fails to build for every consumer. The admin still shows a select.
 */
export const trueFalseAnswerOptions = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
  { label: 'Both', value: 'both' },
] as const

export type TrueFalseAnswer = (typeof trueFalseAnswerOptions)[number]['value']

const trueFalseAnswerValues: readonly string[] = trueFalseAnswerOptions.map((option) => option.value)

export const isTrueFalseAnswer = (value: unknown): value is TrueFalseAnswer =>
  typeof value === 'string' && trueFalseAnswerValues.includes(value)
