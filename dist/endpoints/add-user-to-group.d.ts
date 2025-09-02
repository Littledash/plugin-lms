import { type Endpoint } from 'payload';
type Args = {
    userSlug: string;
    groupSlug: string;
};
type AddUserToGroupHandler = (args: Args) => Endpoint['handler'];
export declare const addUserToGroupHandler: AddUserToGroupHandler;
export {};
