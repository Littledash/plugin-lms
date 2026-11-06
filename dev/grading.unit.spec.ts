import { markAnswer, scoreQuiz } from '../src/services/grading.js'

const choices = (...rows: { isCorrect?: boolean; order?: number }[]) =>
  rows.map((row, index) => ({ id: `c${index + 1}`, label: `Choice ${index + 1}`, ...row }))

describe('quiz marking', () => {
  it('marks true/false, accepting either answer when the answer is both', () => {
    expect(markAnswer({ id: 'q', correctAnswer: 'true', questionType: 'trueFalse' }, 'true')).toBe(true)
    expect(markAnswer({ id: 'q', correctAnswer: 'true', questionType: 'trueFalse' }, 'false')).toBe(false)
    expect(markAnswer({ id: 'q', correctAnswer: 'both', questionType: 'trueFalse' }, 'false')).toBe(true)
    expect(markAnswer({ id: 'q', correctAnswer: 'both', questionType: 'trueFalse' }, 'maybe')).toBe(false)
  })

  it('marks single choice against any ticked choice, and refuses a list', () => {
    const question = { id: 'q', choices: choices({ isCorrect: true }, {}, { isCorrect: true }), questionType: 'singleChoice' }
    expect(markAnswer(question, 'c1')).toBe(true)
    expect(markAnswer(question, 'c3')).toBe(true)
    expect(markAnswer(question, 'c2')).toBe(false)
    expect(markAnswer(question, ['c1'])).toBe(false)
  })

  it('marks multiple choice only when exactly the ticked choices are picked', () => {
    const question = { id: 'q', choices: choices({ isCorrect: true }, {}, { isCorrect: true }), questionType: 'multipleChoice' }
    expect(markAnswer(question, ['c3', 'c1'])).toBe(true)
    expect(markAnswer(question, ['c1'])).toBe(false)
    expect(markAnswer(question, ['c1', 'c2', 'c3'])).toBe(false)
    expect(markAnswer(question, ['c1', 'c1'])).toBe(false)

    const oneCorrect = { id: 'q', choices: choices({ isCorrect: true }, {}), questionType: 'multipleChoice' }
    expect(markAnswer(oneCorrect, 'c1')).toBe(true)

    const noneTicked = { id: 'q', choices: choices({}, {}), questionType: 'multipleChoice' }
    expect(markAnswer(noneTicked, [])).toBe(false)
  })

  it('marks sorting by each choice order, falling back to list position', () => {
    const question = { id: 'q', choices: choices({ order: 3 }, { order: 1 }, { order: 2 }), questionType: 'sorting' }
    expect(markAnswer(question, ['c2', 'c3', 'c1'])).toBe(true)
    expect(markAnswer(question, ['c1', 'c2', 'c3'])).toBe(false)
    expect(markAnswer(question, ['c2', 'c3'])).toBe(false)

    const unordered = { id: 'q', choices: choices({}, {}, {}), questionType: 'sorting' }
    expect(markAnswer(unordered, ['c1', 'c2', 'c3'])).toBe(true)
  })

  it('marks fill in the blank ignoring case and extra spaces', () => {
    const question = {
      id: 'q',
      correctAnswers: [{ answer: 'Attachment theory' }, { answer: 'attachment' }],
      questionType: 'fillInBlank',
    }
    expect(markAnswer(question, '  attachment   THEORY ')).toBe(true)
    expect(markAnswer(question, 'Attachment')).toBe(true)
    expect(markAnswer(question, 'attach')).toBe(false)
    expect(markAnswer(question, ['attachment'])).toBe(false)
    expect(markAnswer({ id: 'q', correctAnswers: [{ answer: '' }], questionType: 'fillInBlank' }, '')).toBe(false)
  })

  it('does not mark essay, assessment, free choice or unknown types', () => {
    for (const questionType of ['essay', 'assessment', 'freeChoice', 'somethingCustom']) {
      expect(markAnswer({ id: 'q', questionType }, 'anything')).toBeNull()
    }
  })

  it('scores only the marked questions, and scores 100 when nothing can be marked', () => {
    const questions = [
      { id: 'tf', correctAnswer: 'true', questionType: 'trueFalse' },
      { id: 'sc', choices: choices({ isCorrect: true }, {}), questionType: 'singleChoice' },
      { id: 'essay', questionType: 'essay' },
    ]
    expect(scoreQuiz(questions, { sc: 'c2', tf: 'true' })).toStrictEqual({ correct: 1, marked: 2, score: 50 })
    expect(scoreQuiz([{ id: 'essay', questionType: 'essay' }], {}).score).toBe(100)
    expect(scoreQuiz([], {}).score).toBe(100)
  })
})
