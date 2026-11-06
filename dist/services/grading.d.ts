/**
 * Quiz marking. Each question is marked correct, incorrect, or not marked at all: essay,
 * assessment and free choice answers need a person to judge them, so they never count against
 * the student.
 */
import type { LMSDoc as Doc } from './shared.js';
/** The most items a list answer (multiple choice, sorting) may hold. */
export declare const MAX_ANSWER_ITEMS = 100;
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
export declare const markAnswer: (question: Doc, answer: unknown) => boolean | null;
/**
 * The percentage of marked questions answered correctly. A quiz with nothing to mark (no
 * questions, or only essay-style ones) scores 100 once submitted.
 */
export declare const scoreQuiz: (questions: Doc[], answers: Record<string, unknown>) => {
    correct: number;
    marked: number;
    score: number;
};
