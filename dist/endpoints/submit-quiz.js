import { submitQuiz } from '../services/progress.js';
import { LMSError } from '../services/shared.js';
import { lmsHandler, requireFields } from './handler.js';
export const submitQuizHandler = (_args)=>lmsHandler(async ({ data, req, userId })=>{
        requireFields(data, [
            'courseId',
            'quizId',
            'answers'
        ]);
        if (typeof data.answers !== 'object' || Array.isArray(data.answers)) {
            throw new LMSError('Answers must be an object keyed by question ID.', 400);
        }
        const { minimumScore, passed, score } = await submitQuiz({
            answers: data.answers,
            courseId: data.courseId,
            quizId: data.quizId,
            req,
            userId
        });
        return Response.json({
            message: passed ? 'Quiz submitted successfully and successfully passed' : `Quiz submitted successfully but you did not pass. You can try again. Required score: ${minimumScore}%`,
            passed,
            score,
            success: true
        });
    });

//# sourceMappingURL=submit-quiz.js.map