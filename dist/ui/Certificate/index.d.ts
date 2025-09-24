import React from 'react';
export type CertificateData = {
    studentName: string;
    courseTitle: string;
    completionDate: string;
    certificateNumber: string;
    templateImage: string;
    fontFamily: string;
    authorName?: string;
};
export declare const CertificateDocument: React.FC<CertificateData>;
