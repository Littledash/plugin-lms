type RichTextNode = {
    type: string;
    version: number;
    text?: string;
    children?: RichTextNode[];
    [k: string]: unknown;
};
type RichText = {
    root: {
        type: string;
        children: RichTextNode[];
        direction: ('ltr' | 'rtl') | null;
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
        indent: number;
        version: number;
    };
    [k: string]: unknown;
};
type createPDFProps = {
    studentName: string;
    courseTitle: string;
    completionDate: string;
    certificateNumber: string;
    templateImage: string;
    description: string | RichText;
    fontFamily: string;
    authorName?: string;
};
export declare const createPDF: ({ studentName, courseTitle, completionDate, certificateNumber, templateImage, description, fontFamily, authorName, }: createPDFProps) => Promise<Uint8Array>;
export {};
