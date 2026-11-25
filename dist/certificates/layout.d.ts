import type { CertificateFont, CertificateLayout } from '../types.js';
type Sizes = Required<NonNullable<NonNullable<CertificateLayout['body']>['sizes']>>;
export type ResolvedCertificateLayout = {
    body: {
        bottom: number;
        center: number;
        maxWidth: number;
        sizes: Sizes;
        top: number;
    };
    colors: Required<NonNullable<CertificateLayout['colors']>>;
    date: {
        format?: (date: Date) => string;
        locale: string;
        right: number;
        size: number;
        y: number;
    } | false;
    fonts: {
        bold: CertificateFont;
        regular: CertificateFont;
    };
    pageSize: [number, number];
    text: Required<NonNullable<CertificateLayout['text']>>;
};
/** The layout the plugin has always printed, designed for an A4 landscape template */
export declare const DEFAULT_CERTIFICATE_LAYOUT: ResolvedCertificateLayout;
/**
 * Merges layouts over the default, later ones winning, and checks the result. Throws on a value the
 * PDF cannot use, so a mistake in the site's config shows up as a clear error instead of a broken
 * certificate.
 */
export declare const resolveCertificateLayout: (...layouts: (CertificateLayout | undefined)[]) => ResolvedCertificateLayout;
/** `#rrggbb` as the 0–1 channels pdf-lib takes */
export declare const colorChannels: (hex: string) => [number, number, number];
/** The award date as printed, e.g. "November 26, 2025" with the default locale */
export declare const formatCompletionDate: (date: Date, layout: ResolvedCertificateLayout) => string;
export {};
