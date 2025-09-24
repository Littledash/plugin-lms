import { type Endpoint } from 'payload';
type Args = {
    userSlug: string;
    courseSlug: string;
    certificatesSlug: string;
};
type AddCertificateToUserHandler = (args: Args) => Endpoint['handler'];
export declare const addCertificateToUserHandler: AddCertificateToUserHandler;
export {};
