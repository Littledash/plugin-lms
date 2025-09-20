import { Progress } from '../providers/types.js';
export declare const completedLesson: (progress: Progress, courseId: string, lessonId: string) => false | {
    lesson: import("payload").DefaultDocumentIDType | {
        id: import("payload").DefaultDocumentIDType;
    };
    completedAt: string;
};
