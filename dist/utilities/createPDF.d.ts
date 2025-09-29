type createPDFProps = {
    studentName: string;
    courseTitle: string;
    completionDate: string;
    certificateNumber: string;
    templateImage: string;
    fontFamily: string;
    authorName?: string;
};
export declare const createPDF: ({ studentName, courseTitle, completionDate, certificateNumber, templateImage, fontFamily, authorName, }: createPDFProps) => Promise<Blob>;
export {};
