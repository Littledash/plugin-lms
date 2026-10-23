import { submitQuiz } from '../services/progress.js';
import { lmsHandler, requireAnswers, requireId } from './handler.js';
export const submitQuizHandler = (_args)=>lmsHandler(async ({ data, req, userId })=>{
        const { minimumScore, passed, score } = await submitQuiz({
            answers: requireAnswers(data),
            courseId: requireId(data, 'courseId'),
            quizId: requireId(data, 'quizId'),
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