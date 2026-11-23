import type { SanitizedConfig } from 'payload';
import type { PDFFont } from 'pdf-lib';
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
/**
 * Makes text drawable with a standard PDF font, which only covers WinAnsi and throws on anything
 * else. A student can type any character into their name, and a throw would mean they never get a
 * certificate. Invisible format characters (such as a left-to-right mark) are dropped, letters with
 * marks the font lacks lose the mark, and anything else becomes '?'.
 */
export declare const toDrawableText: (text: string, characterSet: ReadonlySet<number>) => string;
type DescriptionBlock = {
    bold: boolean;
    text: string;
};
/**
 * Splits a certificate description into the lines it should print as. Each Lexical block (heading,
 * paragraph, list item) and each soft line break starts a new line. Joining them would run the text
 * together on one line that falls off the page. Headings are printed bold.
 */
export declare const descriptionBlocks: (richText: RichText | string | undefined) => DescriptionBlock[];
/**
 * Wraps the description to `maxWidth`, stepping the font size down from 20pt until the lines fit in
 * `maxHeight`, so a long imported description does not push the course title and presenter off
 * the page. At the minimum size the lines are returned even if they do not fit.
 */
export declare const layoutDescription: ({ blocks, boldFont, font, maxHeight, maxWidth, }: {
    blocks: DescriptionBlock[];
    boldFont: PDFFont;
    font: PDFFont;
    maxHeight: number;
    maxWidth: number;
}) => {
    lineHeight: number;
    lines: DescriptionBlock[];
    size: number;
};
export declare const createPDF: ({ authorName: rawAuthorName, completionDate: rawCompletionDate, courseTitle: rawCourseTitle, description, sharp, studentName: rawStudentName, templateImage, }: createPDFProps) => Promise<Uint8Array>;
export {};
