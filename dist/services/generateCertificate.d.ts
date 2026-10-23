import type { PayloadRequest } from 'payload';
import { type ID, type LMSDoc } from './shared.js';
type GenerateCertificateArgs = {
    certificateId: ID;
    courseId: ID;
    req: PayloadRequest;
    userId: ID;
};
export type GenerateCertificateResult = {
    /** The media document holding the certificate PDF. */
    media: LMSDoc;
    status: 'created' | 'existing';
};
export declare const getCertificateFileName: ({ certificateId, courseId, userId }: {
    certificateId: ID;
    courseId: ID;
    userId: ID;
}) => string;
/**
 * Returns the certificate PDF for a course, creating it on first request. The user must have
 * been awarded this certificate for this course.
 */
export declare const generateCertificate: ({ certificateId, courseId, req, userId, }: GenerateCertificateArgs) => Promise<GenerateCertificateResult>;
export {};
