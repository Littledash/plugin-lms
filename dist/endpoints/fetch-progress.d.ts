import { type Endpoint } from 'payload';
type Args = {
    userSlug: string;
    courseSlug?: string;
};
type FetchProgressHandler = (args: Args) => Endpoint['handler'];
export declare const fetchProgressHandler: FetchProgressHandler;
export {};
