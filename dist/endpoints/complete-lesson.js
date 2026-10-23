import { completeLesson } from '../services/progress.js';
import { lmsHandler, requireFields } from './handler.js';
export const completeLessonHandler = (_args)=>lmsHandler(async ({ data, req, userId })=>{
        requireFields(data, [
            'courseId',
            'lessonId'
        ]);
        const { courseCompleted } = await completeLesson({
            courseId: data.courseId,
            lessonId: data.lessonId,
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