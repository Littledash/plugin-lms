import { type Endpoint } from 'payload';
type Args = {
    userSlug: string;
    quizzesSlug: string;
};
type SubmitQuizHandler = (args: Args) => Endpoint['handler'];
export declare const submitQuizHandler: SubmitQuizHandler;
export {};
