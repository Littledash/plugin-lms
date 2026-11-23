import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - @pdf-lib/fontkit doesn't have proper TypeScript definitions
import fontkit from '@pdf-lib/fontkit';
// A4 landscape at about 200 dpi: sharp in print, small enough to download and store per student
const TEMPLATE_MAX_WIDTH = 2400;
const TEMPLATE_MAX_HEIGHT = 1700;
const TEMPLATE_JPEG_QUALITY = 85;
/**
 * Templates are often uploaded as large PNGs (5 MB or more). pdf-lib embeds images byte for byte,
 * so every certificate would carry the full file. Resize to print resolution and re-encode as JPEG,
 * keeping the original when it is already smaller.
 */ export const shrinkTemplateImage = async (bytes, sharp)=>{
    if (!sharp) {
        return bytes;
    }
    try {
        const resized = await sharp(bytes).rotate().resize({
            fit: 'inside',
            height: TEMPLATE_MAX_HEIGHT,
            width: TEMPLATE_MAX_WIDTH,
            withoutEnlargement: true
        })// Transparent areas would turn black in a JPEG; the page behind them is white
        .flatten({
            background: '#ffffff'
        }).jpeg({
            mozjpeg: true,
            quality: TEMPLATE_JPEG_QUALITY
        }).toBuffer();
        return resized.length < bytes.length ? new Uint8Array(resized) : bytes;
    } catch  {
        return bytes;
    }
};
const nodeText = (node)=>{
    if (node.type === 'linebreak') {
        return '\n';
    }
    let text = typeof node.text === 'string' ? node.text : '';
    for (const child of Array.isArray(node.children) ? node.children : []){
        text += nodeText(child);
    }
    return text;
};
const toBlocks = (text, bold)=>text.split(/\r?\n/).map((line)=>line.replace(/\s+/g, ' ').trim()).filter(Boolean).map((line)=>({
            bold,
            text: line
        }));
/**
 * Splits a certificate description into the lines it should print as. Each Lexical block (heading,
 * paragraph, list item) and each soft line break starts a new line. Joining them would run the text
 * together on one line that falls off the page. Headings are printed bold.
 */ export const descriptionBlocks = (richText)=>{
    if (typeof richText === 'string') {
        return toBlocks(richText, false);
    }
    if (!richText || typeof richText !== 'object' || !Array.isArray(richText.root?.children)) {
        return [];
    }
    return richText.root.children.flatMap((block)=>{
        const items = block.type === 'list' && Array.isArray(block.children) ? block.children : [
            block
        ];
        return items.flatMap((item)=>toBlocks(nodeText(item), block.type === 'heading'));
    });
};
const wrapText = (text, maxWidth, fontSize, font)=>{
    const lines = [];
    let currentLine = '';
    for (const word of text.split(' ')){
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines.length > 0 ? lines : [
        text
    ];
};
const DESCRIPTION_MAX_SIZE = 20;
const DESCRIPTION_MIN_SIZE = 10;
const DESCRIPTION_LEADING = 1.3;
/**
 * Wraps the description to `maxWidth`, stepping the font size down from 20pt until the lines fit in
 * `maxHeight`, so a long imported description does not push the course title and presenter off
 * the page. At the minimum size the lines are returned even if they do not fit.
 */ export const layoutDescription = ({ blocks, boldFont, font, maxHeight, maxWidth })=>{
    for(let size = DESCRIPTION_MAX_SIZE;; size--){
        const lineHeight = size * DESCRIPTION_LEADING;
        const lines = blocks.flatMap((block)=>wrapText(block.text, maxWidth, size, block.bold ? boldFont : font).map((text)=>({
                    bold: block.bold,
                    text
                })));
        if (lines.length * lineHeight <= maxHeight || size <= DESCRIPTION_MIN_SIZE) {
            return {
                lineHeight,
                lines,
                size
            };
        }
    }
};
export const createPDF = async ({ authorName, completionDate, courseTitle, description, sharp, studentName, templateImage })=>{
    // Validate inputs
    if (!studentName || !courseTitle) {
        throw new Error('Missing required fields: studentName and courseTitle are required');
    }
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    // Register fontkit for custom font support
    pdfDoc.registerFontkit(fontkit);
    // Add a page (A4 size in landscape orientation)
    const page = pdfDoc.addPage([
        842,
        595
    ]) // A4 landscape dimensions
    ;
    // Helvetica matches the sans-serif certificate template
    const primaryFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    // Get page dimensions
    const { height, width } = page.getSize();
    // Add background image if provided
    if (templateImage) {
        try {
            const imageResponse = await fetch(templateImage);
            const imageBytes = await shrinkTemplateImage(new Uint8Array(await imageResponse.arrayBuffer()), sharp);
            // Embed by content rather than URL: a shrunk PNG template is now a JPEG
            let image;
            try {
                image = await pdfDoc.embedJpg(imageBytes);
            } catch  {
                image = await pdfDoc.embedPng(imageBytes);
            }
            // Scale image to fit page
            const imageDims = image.scaleToFit(width, height);
            // Center the image on the page
            page.drawImage(image, {
                height: imageDims.height,
                width: imageDims.width,
                x: (width - imageDims.width) / 2,
                y: (height - imageDims.height) / 2
            });
        } catch  {
            // No details: the template URL is not useful to users and the PDF still renders
            // eslint-disable-next-line no-console
            console.warn('Certificate template image could not be loaded; generating without it');
        }
    }
    // Add certificate content - Updated template layout
    const centerX = width / 2;
    // Helper function to center text horizontally
    const getCenteredX = (text, fontSize, font)=>{
        try {
            // pdf-lib fonts have widthOfTextAtSize method
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            return centerX - textWidth / 2;
        } catch  {
            // Fallback: estimate based on character count (approximate)
            const estimatedWidth = text.length * (fontSize * 0.6);
            return centerX - estimatedWidth / 2;
        }
    };
    // Starting Y position - "This certifies that" should be just below the "CERTIFICATE OF COMPLETION" heading
    // Position text higher on the page, just below the heading
    let currentY = height - 190;
    // "This certifies that" - static text, 20pt, positioned below the certificate heading
    const certifiesText = 'this certifies that';
    page.drawText(certifiesText, {
        color: rgb(0, 0, 0),
        font: primaryFont,
        size: 20,
        x: getCenteredX(certifiesText, 20, primaryFont),
        y: currentY
    });
    // Student name - ensure there's a space between first and last name
    // Trim and normalize spaces in studentName
    const normalizedStudentName = studentName.trim().replace(/\s+/g, ' ');
    currentY -= 50;
    page.drawText(normalizedStudentName, {
        color: rgb(0.8, 0.2, 0.4),
        font: boldFont,
        size: 22,
        x: getCenteredX(normalizedStudentName, 22, boldFont),
        y: currentY
    });
    const maxTextWidth = width * 0.7;
    const lineHeight = 30;
    const courseTitleLines = wrapText(courseTitle, maxTextWidth, 24, boldFont);
    // The space the original one-line description had, plus the slack above the footer, less any
    // extra lines the course title needs
    const blocks = descriptionBlocks(description);
    const descriptionLayout = layoutDescription({
        blocks: blocks.length ? blocks : [
            {
                bold: false,
                text: 'has completed a 1 hour online Masterclass on the topic of'
            }
        ],
        boldFont,
        font: primaryFont,
        maxHeight: Math.max(DESCRIPTION_MAX_SIZE * DESCRIPTION_LEADING, 110 - (courseTitleLines.length - 1) * lineHeight),
        maxWidth: maxTextWidth
    });
    currentY -= 50;
    descriptionLayout.lines.forEach((line, index)=>{
        const font = line.bold ? boldFont : primaryFont;
        page.drawText(line.text, {
            color: rgb(0, 0, 0),
            font,
            size: descriptionLayout.size,
            x: getCenteredX(line.text, descriptionLayout.size, font),
            y: currentY - index * descriptionLayout.lineHeight
        });
    });
    currentY -= (descriptionLayout.lines.length - 1) * descriptionLayout.lineHeight;
    // Course title - wrap text if needed, 24pt, dark blue, bold
    currentY -= 50;
    courseTitleLines.forEach((line, index)=>{
        page.drawText(line, {
            color: rgb(64 / 255, 84 / 255, 165 / 255),
            font: boldFont,
            size: 24,
            x: getCenteredX(line, 24, boldFont),
            y: currentY - index * lineHeight
        });
    });
    // Adjust currentY based on number of lines
    currentY -= (courseTitleLines.length - 1) * lineHeight;
    // "presented by" - 20pt, above author name
    if (authorName) {
        currentY -= 50;
        const presentedByText = 'presented by';
        page.drawText(presentedByText, {
            color: rgb(0, 0, 0),
            font: primaryFont,
            size: 20,
            x: getCenteredX(presentedByText, 20, primaryFont),
            y: currentY
        });
        // Author name - below "presented by", closer spacing
        currentY -= 25;
        page.drawText(authorName, {
            color: rgb(0, 0, 0),
            font: primaryFont,
            size: 20,
            x: getCenteredX(authorName, 20, primaryFont),
            y: currentY
        });
    }
    // Completion date - positioned above "DATE" line in bottom right
    // The "DATE" label is in the bottom right, date should be above that line, moved left and higher
    const dateTextWidth = primaryFont.widthOfTextAtSize(completionDate, 12);
    const dateX = width - 150 - dateTextWidth // Right-aligned, 150px from right edge (moved left)
    ;
    page.drawText(completionDate, {
        color: rgb(0, 0, 0),
        font: primaryFont,
        size: 12,
        x: dateX,
        y: 100
    });
    // Set document metadata
    pdfDoc.setTitle(`Certificate of Completion - ${studentName}`);
    pdfDoc.setAuthor(authorName || 'LMS System');
    pdfDoc.setSubject(`Certificate for ${courseTitle}`);
    pdfDoc.setKeywords([
        'certificate',
        'completion',
        'course',
        'education'
    ]);
    pdfDoc.setCreationDate(new Date());
    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    // Return the Uint8Array directly - the calling code can convert to blob if needed
    return pdfBytes;
};

//# sourceMappingURL=createPDF.js.map