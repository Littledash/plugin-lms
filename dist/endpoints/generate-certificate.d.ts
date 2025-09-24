import { type Endpoint } from 'payload';
type Args = {
    userSlug: string;
    courseSlug: string;
    mediaSlug: string;
};
type GenerateCertificateHandler = (args: Args) => Endpoint['handler'];
export declare const generateCertificateHandler: GenerateCertificateHandler;
export {};
