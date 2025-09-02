import { type Endpoint } from 'payload';
type Args = {
    userSlug: string;
    courseSlug: string;
};
type CompleteCourseHandler = (args: Args) => Endpoint['handler'];
export declare const completeCourseHandler: CompleteCourseHandler;
export {};
