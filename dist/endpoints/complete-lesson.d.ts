import { type Endpoint } from 'payload';
type Args = {
    userSlug: string;
};
type CompleteLessonHandler = (args: Args) => Endpoint['handler'];
export declare const completeLessonHandler: CompleteLessonHandler;
export {};
