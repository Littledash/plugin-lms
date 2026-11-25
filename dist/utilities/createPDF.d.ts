import type { SanitizedConfig } from 'payload';
import type { PDFFont } from 'pdf-lib';
import { type ResolvedCertificateLayout } from '../certificates/layout.js';
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
    description?: RichText | string;
    layout?: ResolvedCertificateLayout;
    /** Payload's `sharp`, used to shrink the template image. Without it the image is embedded as uploaded. */
    sharp?: Sharp;
    studentName: string;
    templateImage: string;
};
type BodySizes = ResolvedCertificateLayout['body']['sizes'];
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
type BodyLine = {
    bold: boolean;
    color: 'courseTitle' | 'text';
    size: number;
    text: string;
    y: number;
};
/** The lowest baseline the body may use by default, clear of the logo and signature area on the template */
export declare const BODY_BOTTOM: number;
/**
 * Lays out the description, course title and presenter below the student name. Sizes and gaps
 * start at `sizes` (by default 20pt description, 24pt title, 16pt "presented by", 18pt presenter)
 * and shrink together in 5% steps, down to half size, until the last line sits at or above
 * `bottom`, so a long title or presenter cannot run into the logo. At half size the lines are
 * returned even if they do not fit. Gaps are proportional to the sizes so that larger text in a
 * site's layout does not overlap.
 */
export declare const layoutCertificateBody: ({ blocks, boldFont, bottom, courseTitle, font, maxWidth, presentedBy, presenter, sizes, top, }: {
    blocks: DescriptionBlock[];
    boldFont: PDFFont;
    bottom?: number;
    courseTitle: string;
    font: PDFFont;
    maxWidth: number;
    /** Label above the presenter; empty leaves it out */
    presentedBy?: string;
    presenter?: string;
    sizes?: BodySizes;
    /** Baseline of the student name */
    top: number;
}) => BodyLine[];
export declare const createPDF: ({ authorName: rawAuthorName, completionDate: rawCompletionDate, courseTitle: rawCourseTitle, description, layout, sharp, studentName: rawStudentName, templateImage, }: createPDFProps) => Promise<Uint8Array>;
export {};
