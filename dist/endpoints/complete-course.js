import { completeCourse } from '../services/completeCourse.js';
import { LMSError } from '../services/shared.js';
import { lmsHandler, requireId } from './handler.js';
export const completeCourseHandler = (_args)=>lmsHandler(async ({ data, req, userId })=>{
        const { certificateAwarded, status } = await completeCourse({
            courseId: requireId(data, 'courseId'),
            req,
            userId
        });
        if (status === 'already-completed' && !certificateAwarded) {
            throw new LMSError('You have already completed this course.', 409);
        }
        return Response.json({
            certificateAwarded,
            message: 'Successfully completed course.',
            success: true
        });
    });

//# sourceMappingURL=complete-course.js.map