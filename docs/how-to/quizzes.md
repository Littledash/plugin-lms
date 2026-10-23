# How to add quizzes to lessons

## Set up a quiz

1. Create **Questions**. Supported for grading: `multipleChoice` and `singleChoice` (mark one choice
   as correct) and `trueFalse` (set **Correct answer**; `both` accepts either). Other types are
   stored but score zero.
2. Create a **Quiz**, add the questions, and set:
   - **Minimum score** (0–100, default 100) to pass.
   - **Attempt limit** (optional) for the maximum attempts per student.
3. Add the quiz to a **Lesson** in its **Quizzes** field. The quiz belongs to every course that lists
   that lesson.

## Take a quiz

Submit answers keyed by question ID. Choice questions take the choice's `id`; true/false questions
take `'true'` or `'false'`.

```tsx
const { submitQuiz, completeLesson } = useLMS()

const result = await submitQuiz(courseId, quiz.id, {
  [question1.id]: selectedChoiceId,
  [question2.id]: 'true',
})

if (result.passed) {
  await completeLesson(courseId, lessonId)
}
```

The best score is kept. A lesson cannot be completed until every quiz on it has a score at or above
its minimum.

## Answers stay on the server

Correct answers (`choices.isCorrect`, `correctAnswer`, `correctAnswers`, `assessmentCriteria`) are
hidden from everyone except admins and authors, so students cannot read them from `/api/questions`.
Do not grade in the browser; the response from `submit-quiz` gives the score and whether it passed.

If your quiz page is a Server Component that reads questions with the Local API, that read bypasses
access control. Strip the answer fields before passing questions to client components, or read them
with `overrideAccess: false` and the student as `user`.

## Attempt limits and cooldown

| Setting | Where | Default | Response when hit |
| --- | --- | --- | --- |
| Attempt limit | Quiz → **Attempt limit** | Unlimited | `429 You have used all N attempts for this quiz.` |
| Cooldown | `lmsPlugin({ quizzes: { attemptCooldownSeconds } })` | 5 seconds | `429 Please wait N seconds before trying this quiz again.` |

Both are checked before grading, so a refused attempt reveals nothing. Each attempt's count and time
are stored on the student's progress (`completedQuizzes[].attempts`, `lastAttemptAt`).

```typescript
lmsPlugin({
  quizzes: {
    attemptCooldownSeconds: 30,
  },
})
```

To reset a student's attempts, an admin can edit or remove the quiz entry in that student's
**Courses Progress**.
