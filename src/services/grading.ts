/**
 * Quiz marking. Each question is marked correct, incorrect, or not marked at all: essay,
 * assessment and free choice answers need a person to judge them, so they never count against
 * the student.
 */

import type { LMSDoc as Doc } from './shared.js'

/** The most items a list answer (multiple choice, sorting) may hold. */
export const MAX_ANSWER_ITEMS = 100

const isScalar = (value: unknown): value is number | string =>
  typeof value === 'string' || typeof value === 'number'

/** A single answer or a list of answers, as strings. */
const toList = (answer: unknown): string[] => {
  if (Array.isArray(answer)) {
    return answer.filter(isScalar).map(String)
  }
  return isScalar(answer) && answer !== '' ? [String(answer)] : []
}

/** Case, surrounding spaces and repeated spaces are ignored when comparing typed answers. */
const normalise = (value: unknown): string => String(value).trim().replace(/\s+/g, ' ').toLowerCase()

const getChoices = (question: Doc): Doc[] =>
  (Array.isArray(question.choices) ? question.choices : []).filter(
    (choice: unknown): choice is Doc => Boolean(choice) && typeof choice === 'object',
  )

const correctChoiceIds = (question: Doc): string[] =>
  getChoices(question)
    .filter((choice) => choice.isCorrect)
    .map((choice) => String(choice.id))

/**
 * The correct order for a sorting question: by each choice's `order`, and by its position in the
 * list where `order` is missing or tied.
 */
const sortedChoiceIds = (question: Doc): string[] =>
  getChoices(question)
    .map((choice, position) => ({ id: String(choice.id), order: choice.order, position }))
    .sort((a, b) => {
      const aOrder = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY
      const bOrder = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY
      return aOrder === bOrder ? a.position - b.position : aOrder - bOrder
    })
    .map((choice) => choice.id)

/**
 * Marks one answer. Returns null for a question the plugin does not mark.
 *
 * - True/false: the answer is `'true'` or `'false'`; a question whose answer is `both` accepts either.
 * - Single choice: the ID of a choice ticked as correct.
 * - Multiple choice: the IDs of exactly the choices ticked as correct, as a list (a single ID is
 *   enough when only one choice is correct).
 * - Sorting: every choice ID, in the correct order.
 * - Fill in the blank: matches any accepted answer, ignoring case and extra spaces.
 */
export const markAnswer = (question: Doc, answer: unknown): boolean | null => {
  switch (question.questionType) {
    case 'fillInBlank': {
      if (!isScalar(answer)) {
        return false
      }
      const accepted = (Array.isArray(question.correctAnswers) ? question.correctAnswers : [])
        .map((entry: Doc | null) => (entry && isScalar(entry.answer) ? normalise(entry.answer) : ''))
        .filter(Boolean)
      return accepted.includes(normalise(answer))
    }
    case 'multipleChoice': {
      const correct = correctChoiceIds(question)
      const submitted = new Set(toList(answer))
      return (
        correct.length > 0 &&
        submitted.size === correct.length &&
        correct.every((id) => submitted.has(id))
      )
    }
    case 'singleChoice':
      return isScalar(answer) && correctChoiceIds(question).includes(String(answer))
    case 'sorting': {
      const expected = sortedChoiceIds(question)
      const submitted = toList(answer)
      return (
        expected.length > 0 &&
        submitted.length === expected.length &&
        expected.every((id, index) => submitted[index] === id)
      )
    }
    case 'trueFalse':
      return question.correctAnswer === 'both'
        ? answer === 'true' || answer === 'false'
        : answer === question.correctAnswer
    default:
      // Essay, assessment, free choice, and any custom type the plugin does not know how to mark
      return null
  }
}

/**
 * The percentage of marked questions answered correctly. A quiz with nothing to mark (no
 * questions, or only essay-style ones) scores 100 once submitted.
 */
export const scoreQuiz = (
  questions: Doc[],
  answers: Record<string, unknown>,
): { correct: number; marked: number; score: number } => {
  let correct = 0
  let marked = 0
  for (const question of questions) {
    const result = markAnswer(question, answers[String(question.id)])
    if (result === null) {
      continue
    }
    marked += 1
    if (result) {
      correct += 1
    }
  }
  return { correct, marked, score: marked > 0 ? (correct / marked) * 100 : 100 }
}
