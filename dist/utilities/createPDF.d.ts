type RichTextNode = {
    [k: string]: unknown;
    children?: RichTextNode[];
    text?: string;
    type: string;
    version: number;
};
type RichText = {
    [k: string]: unknown;
    root: {
        children: RichTextNode[];
        direction: ('ltr' | 'rtl') | null;
        format: '' | 'center' | 'end' | 'justify' | 'left' | 'right' | 'start';
        indent: number;
        type: string;
        version: number;
    };
};
type createPDFProps = {
    authorName?: string;
    certificateNumber: string;
    completionDate: string;
    courseTitle: string;
    description: RichText | string;
    fontFamily: string;
    studentName: string;
    templateImage: string;
};
export declare const createPDF: ({ authorName, certificateNumber, completionDate, courseTitle, description, fontFamily, studentName, templateImage, }: createPDFProps) => Promise<Uint8Array>;
export {};
