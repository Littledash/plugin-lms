import type { SanitizedConfig } from 'payload';
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
type Sharp = NonNullable<SanitizedConfig['sharp']>;
type createPDFProps = {
    authorName?: string;
    certificateNumber: string;
    completionDate: string;
    courseTitle: string;
    description: RichText | string;
    fontFamily: string;
    /** Payload's `sharp`, used to shrink the template image. Without it the image is embedded as uploaded. */
    sharp?: Sharp;
    studentName: string;
    templateImage: string;
};
/**
 * Templates are often uploaded as large PNGs (5 MB or more). pdf-lib embeds images byte for byte,
 * so every certificate would carry the full file. Resize to print resolution and re-encode as JPEG,
 * keeping the original when it is already smaller.
 */
export declare const shrinkTemplateImage: (bytes: Uint8Array, sharp?: Sharp) => Promise<Uint8Array>;
export declare const createPDF: ({ authorName, completionDate, courseTitle, description, sharp, studentName, templateImage, }: createPDFProps) => Promise<Uint8Array>;
export {};
