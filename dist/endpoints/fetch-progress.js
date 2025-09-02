import { addDataAndFileToRequest } from 'payload';
export const fetchProgressHandler = ({ userSlug = 'users' })=>async (req)=>{
        await addDataAndFileToRequest(req);
        const user = req.user;
        const payload = req.payload;
        if (!user) {
            return Response.json({
                message: 'You must be logged in to fetch progress.'
            }, {
                status: 401
            });
        }
        try {
            const currentUser = await payload.findByID({
                collection: userSlug,
                id: user.id,
                depth: 1
            });
            if (!currentUser) {
                return Response.json({
                    message: 'User not found.'
                }, {
                    status: 404
                });
            }
            const coursesProgress = currentUser.coursesProgress || [];
            const enrolledCourses = currentUser.enrolledCourses || [];
            const completedCourses = currentUser.completedCourses || [];
            payload.logger.info(`Fetched progress for user ${user.id}`);
            return Response.json({
                coursesProgress,
                enrolledCourses,
                completedCourses
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            payload.logger.error(message);
            return Response.json({
                message
            }, {
                status: 500
            });
        }
    };

//# sourceMappingURL=fetch-progress.js.map