import { LMSError, sameId, toId } from './shared.js';
const DAY_MS = 24 * 60 * 60 * 1000;
const MESSAGES = {
    expired: {
        message: 'Your access to this course has expired.',
        status: 403
    },
    linear: {
        message: 'Complete the previous lesson first.',
        status: 409
    },
    unreleased: {
        message: 'This lesson is not available yet.',
        status: 403
    }
};
const parsedTime = (value)=>{
    if (typeof value !== 'string' || value === '') {
        return undefined;
    }
    const time = Date.parse(value);
    return Number.isNaN(time) ? undefined : time;
};
const accessDays = (course)=>{
    const days = course.courseSettings?.accessExpirationDays;
    return typeof days === 'number' && days > 0 ? days : undefined;
};
/** Access counts from the last renewal, or from enrollment when it was never renewed. */ const accessStart = (progress)=>parsedTime(progress?.accessFrom) ?? parsedTime(progress?.enrolledAt);
/**
 * Access has expired when the course sets a positive `accessExpirationDays` and the student's
 * access started at least that many days ago. Enrollments with no date are left open: they
 * predate this field.
 */ export const isAccessExpired = (course, progress, now = new Date())=>{
    const days = accessDays(course);
    const start = accessStart(progress);
    if (days === undefined || start === undefined) {
        return false;
    }
    return now.getTime() >= start + days * DAY_MS;
};
/**
 * Starts a new access period for a renewal purchase. A renewal before expiry is added to the end
 * of the current period, so paid days are not lost; after expiry it starts now. `enrolledAt` is
 * left alone so lessons already released by their delay stay released.
 */ export const renewAccess = (course, progress, now = new Date())=>{
    const days = accessDays(course);
    const start = accessStart(progress);
    const currentEnd = days !== undefined && start !== undefined ? start + days * DAY_MS : undefined;
    progress.accessFrom = new Date(Math.max(now.getTime(), currentEnd ?? 0)).toISOString();
};
const isReleased = (lesson, progress, now)=>{
    const settings = lesson.accessSettings ?? {};
    const schedule = settings.lessonReleaseSchedule ?? 'immediately';
    if (schedule === 'immediately') {
        return true;
    }
    if (schedule === 'specificDate') {
        const releaseAt = parsedTime(settings.lessonReleaseDate);
        return releaseAt !== undefined && now.getTime() >= releaseAt;
    }
    if (schedule === 'enrollment') {
        const days = typeof settings.lessonRelaseDays === 'number' ? settings.lessonRelaseDays : 0;
        if (days <= 0) {
            return true;
        }
        const enrolledAt = parsedTime(progress?.enrolledAt);
        // No enrollment date means we cannot count the delay, so the lesson stays available.
        if (enrolledAt === undefined) {
            return true;
        }
        return now.getTime() >= enrolledAt + days * DAY_MS;
    }
    return true;
};
const previousLessonIsComplete = (course, lessonId, progress)=>{
    if ((course.navigation?.navigationMode ?? 'linear') !== 'linear') {
        return true;
    }
    const items = Array.isArray(course.lessons) ? course.lessons : [];
    const index = items.findIndex((item)=>sameId(item?.lesson, lessonId));
    if (index <= 0) {
        return true;
    }
    return items.slice(0, index).every((item)=>{
        if (item?.isOptional) {
            return true;
        }
        const previousId = toId(item?.lesson);
        if (previousId === undefined) {
            return true;
        }
        return Boolean(progress?.completedLessons?.some((entry)=>sameId(entry.lesson, previousId)));
    });
};
/**
 * Why a student cannot open this lesson right now, or null when they can.
 * Admins and authors are not checked here.
 */ export const lessonBlockReason = ({ course, lesson, lessonId, now = new Date(), progress })=>{
    if (isAccessExpired(course, progress, now)) {
        return 'expired';
    }
    if (!isReleased(lesson, progress, now)) {
        return 'unreleased';
    }
    if (!previousLessonIsComplete(course, lessonId, progress)) {
        return 'linear';
    }
    return null;
};
export const assertLessonAccessible = (args)=>{
    const reason = lessonBlockReason(args);
    if (!reason) {
        return;
    }
    const { message, status } = MESSAGES[reason];
    throw new LMSError(message, status);
};

//# sourceMappingURL=lessonAccess.js.map