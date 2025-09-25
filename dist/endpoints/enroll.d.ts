import { type Endpoint } from 'payload';
type Args = {
    userSlug?: string;
    courseSlug?: string;
    groupSlug?: string;
};
type EnrollHandler = (args: Args) => Endpoint['handler'];
export declare const enrollHandler: EnrollHandler;
export {};
