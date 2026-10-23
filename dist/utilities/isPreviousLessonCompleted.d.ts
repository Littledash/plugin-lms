import type { TypedCollection } from "payload";
import type { Progress } from "../providers/types.js";
export declare const isPreviousLessonCompleted: (progress: Progress, course: Pick<TypedCollection["courses"], "id" | "lessons" | "slug" | "title">, lessonId: string) => boolean;
