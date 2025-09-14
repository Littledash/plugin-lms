import { TypedCollection } from "payload";
import { Progress } from "../providers/types.js";
export declare const isPreviousLessonCompleted: (progress: Progress, course: Pick<TypedCollection["courses"], "id" | "title" | "slug" | "lessons">, lessonId: string) => boolean | {
    lesson: import("payload").DefaultDocumentIDType | import("../providers/types.js").Lesson;
    completedAt: string;
};
