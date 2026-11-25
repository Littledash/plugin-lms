/** The layout the plugin has always printed, designed for an A4 landscape template */ export const DEFAULT_CERTIFICATE_LAYOUT = {
    body: {
        bottom: 165,
        center: 0.5,
        maxWidth: 0.7,
        sizes: {
            courseTitle: 24,
            description: 20,
            intro: 20,
            presentedBy: 16,
            presenter: 18,
            studentName: 22
        },
        top: 190
    },
    colors: {
        courseTitle: '#4054a5',
        studentName: '#cc3366',
        text: '#000000'
    },
    date: {
        locale: 'en-US',
        right: 150,
        size: 12,
        y: 100
    },
    fonts: {
        bold: 'Helvetica-Bold',
        regular: 'Helvetica'
    },
    pageSize: [
        842,
        595
    ],
    text: {
        defaultDescription: 'Certificate of Completion',
        intro: 'this certifies that',
        presentedBy: 'presented by'
    }
};
const HEX_COLOR = /^#[\da-f]{6}$/i;
const fail = (path, problem)=>{
    throw new Error(`LMS certificate layout: ${path} ${problem}`);
};
const checkNumber = (path, value, { max, min = 0 } = {})=>{
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || max !== undefined && value > max) {
        fail(path, `must be a number from ${min}${max !== undefined ? ` to ${max}` : ''}, got ${String(value)}`);
    }
};
const checkFont = (path, font)=>{
    if (typeof font !== 'string' && !(font instanceof Uint8Array) && !(font instanceof ArrayBuffer)) {
        fail(path, 'must be a standard font name or the bytes of a font file');
    }
};
/**
 * Merges layouts over the default, later ones winning, and checks the result. Throws on a value the
 * PDF cannot use, so a mistake in the site's config shows up as a clear error instead of a broken
 * certificate.
 */ export const resolveCertificateLayout = (...layouts)=>{
    const resolved = layouts.reduce((current, layout)=>{
        if (!layout) {
            return current;
        }
        const date = layout.date === false ? false : layout.date ? {
            ...current.date || DEFAULT_CERTIFICATE_LAYOUT.date,
            ...layout.date
        } : current.date;
        return {
            body: {
                ...current.body,
                ...layout.body,
                sizes: {
                    ...current.body.sizes,
                    ...layout.body?.sizes
                }
            },
            colors: {
                ...current.colors,
                ...layout.colors
            },
            date,
            fonts: {
                ...current.fonts,
                ...layout.fonts
            },
            pageSize: layout.pageSize ?? current.pageSize,
            text: {
                ...current.text,
                ...layout.text
            }
        };
    }, DEFAULT_CERTIFICATE_LAYOUT);
    const { body, colors, date, fonts, pageSize, text } = resolved;
    if (!Array.isArray(pageSize) || pageSize.length !== 2) {
        fail('pageSize', 'must be [width, height]');
    }
    pageSize.forEach((value, index)=>checkNumber(`pageSize[${index}]`, value, {
            min: 1
        }));
    checkNumber('body.bottom', body.bottom);
    checkNumber('body.top', body.top);
    checkNumber('body.center', body.center, {
        max: 1
    });
    checkNumber('body.maxWidth', body.maxWidth, {
        max: 1,
        min: 0.01
    });
    for (const [key, value] of Object.entries(body.sizes)){
        checkNumber(`body.sizes.${key}`, value, {
            min: 1
        });
    }
    for (const [key, value] of Object.entries(colors)){
        if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
            fail(`colors.${key}`, `must be a colour like '#1a2b3c', got ${JSON.stringify(value)}`);
        }
    }
    for (const [key, value] of Object.entries(text)){
        if (typeof value !== 'string') {
            fail(`text.${key}`, 'must be a string');
        }
    }
    checkFont('fonts.regular', fonts.regular);
    checkFont('fonts.bold', fonts.bold);
    if (date) {
        checkNumber('date.right', date.right);
        checkNumber('date.size', date.size, {
            min: 1
        });
        checkNumber('date.y', date.y);
        if (date.format !== undefined && typeof date.format !== 'function') {
            fail('date.format', 'must be a function');
        }
    }
    return resolved;
};
/** `#rrggbb` as the 0–1 channels pdf-lib takes */ export const colorChannels = (hex)=>[
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255
    ];
/** The award date as printed, e.g. "November 26, 2025" with the default locale */ export const formatCompletionDate = (date, layout)=>{
    const settings = layout.date || DEFAULT_CERTIFICATE_LAYOUT.date;
    if (settings && settings.format) {
        return settings.format(date);
    }
    return date.toLocaleDateString(settings ? settings.locale : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

//# sourceMappingURL=layout.js.map