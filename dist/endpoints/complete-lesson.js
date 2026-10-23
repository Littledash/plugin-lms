import { completeLesson } from '../services/progress.js';
import { lmsHandler, requireId } from './handler.js';
export const completeLessonHandler = (_args)=>lmsHandler(async ({ data, req, userId })=>{
        const { courseCompleted } = await completeLesson({
            courseId: requireId(data, 'courseId'),
            lessonId: requireId(data, 'lessonId'),
            req,
            userId
        });
        return Response.json({
            courseCompleted,
            message: courseCompleted ? 'Successfully completed course and lesson.' : 'Successfully completed lesson.',
            success: true
        });
    });

//# sourceMappingURL=complete-lesson.js.map