import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
export const createPDF = async ({ studentName, courseTitle, completionDate, certificateNumber, templateImage, fontFamily, authorName })=>{
    console.log('createPDF called with data:', {
        studentName,
        courseTitle,
        completionDate,
        certificateNumber,
        templateImage,
        fontFamily,
        authorName
    });
    // Validate inputs
    if (!studentName || !courseTitle) {
        throw new Error('Missing required fields: studentName and courseTitle are required');
    }
    try {
        console.log('Creating PDF with pdf-lib...');
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
        // Embed fonts - use Google Fonts or fallback to standard fonts
        let primaryFont, boldFont;
        if (fontFamily && fontFamily.toLowerCase() !== 'poppins') {
            try {
                console.log(`Loading Google Font: ${fontFamily}`);
                // Map font family to Google Fonts URL
                const getGoogleFontUrl = (fontName)=>{
                    const fontMap = {
                        'poppins': 'https://fonts.gstatic.com/s/poppins/v23/pxiEyp8kv8JHgFVrJJfecg.woff2',
                        'poppins-bold': 'https://fonts.gstatic.com/s/poppins/v23/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2',
                        'roboto': 'https://fonts.gstatic.com/s/roboto/v31/KFOmCnqEu92Fr1Mu4mxK.woff2',
                        'roboto-bold': 'https://fonts.gstatic.com/s/roboto/v31/KFOlCnqEu92Fr1MmWUlfBBc4.woff2',
                        'opensans': 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVIGxA.woff2',
                        'opensans-bold': 'https://fonts.gstatic.com/s/opensans/v40/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0Rk8ZkWVAewA.woff2',
                        'lato': 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.woff2',
                        'lato-bold': 'https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.woff2',
                        'montserrat': 'https://fonts.gstatic.com/s/montserrat/v26/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXpsog.woff2',
                        'montserrat-bold': 'https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw0aXpsog.woff2'
                    };
                    return fontMap[fontName.toLowerCase()] || null;
                };
                const fontUrl = getGoogleFontUrl(fontFamily);
                const boldFontUrl = getGoogleFontUrl(`${fontFamily}-bold`);
                if (fontUrl) {
                    // Fetch and embed the Google Font
                    const fontResponse = await fetch(fontUrl);
                    const fontBytes = await fontResponse.arrayBuffer();
                    primaryFont = await pdfDoc.embedFont(fontBytes);
                    console.log(`Successfully loaded Google Font: ${fontFamily}`);
                } else {
                    throw new Error(`Font ${fontFamily} not found in Google Fonts mapping`);
                }
                if (boldFontUrl) {
                    // Fetch and embed the bold variant
                    const boldFontResponse = await fetch(boldFontUrl);
                    const boldFontBytes = await boldFontResponse.arrayBuffer();
                    boldFont = await pdfDoc.embedFont(boldFontBytes);
                    console.log(`Successfully loaded Google Font bold variant: ${fontFamily}`);
                } else {
                    // If no bold variant, use the regular font for bold text
                    boldFont = primaryFont;
                    console.log(`No bold variant found for ${fontFamily}, using regular font for bold text`);
                }
            } catch (fontError) {
                console.warn(`Failed to load Google Font ${fontFamily}, falling back to Helvetica:`, fontError);
                primaryFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
                boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            }
        } else {
            // Default to Poppins Google Font
            try {
                console.log('Loading default Google Font: Poppins');
                const poppinsUrl = 'https://fonts.gstatic.com/s/poppins/v23/pxiEyp8kv8JHgFVrJJfecg.woff2';
                const poppinsBoldUrl = 'https://fonts.gstatic.com/s/poppins/v23/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2';
                const fontResponse = await fetch(poppinsUrl);
                const fontBytes = await fontResponse.arrayBuffer();
                primaryFont = await pdfDoc.embedFont(fontBytes);
                const boldFontResponse = await fetch(poppinsBoldUrl);
                const boldFontBytes = await boldFontResponse.arrayBuffer();
                boldFont = await pdfDoc.embedFont(boldFontBytes);
                console.log('Successfully loaded default Poppins font');
            } catch (poppinsError) {
                console.warn('Failed to load Poppins, falling back to Helvetica:', poppinsError);
                primaryFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
                boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            }
        }
        // Get page dimensions
        const { width, height } = page.getSize();
        // Add background image if provided
        if (templateImage) {
            try {
                console.log('Loading template image:', templateImage);
                const imageResponse = await fetch(templateImage);
                const imageBytes = await imageResponse.arrayBuffer();
                // Determine image type and embed accordingly
                let image;
                if (templateImage.toLowerCase().includes('.jpg') || templateImage.toLowerCase().includes('.jpeg')) {
                    image = await pdfDoc.embedJpg(imageBytes);
                } else if (templateImage.toLowerCase().includes('.png')) {
                    image = await pdfDoc.embedPng(imageBytes);
                } else {
                    // Try JPG first, then PNG
                    try {
                        image = await pdfDoc.embedJpg(imageBytes);
                    } catch  {
                        image = await pdfDoc.embedPng(imageBytes);
                    }
                }
                // Scale image to fit page
                const imageDims = image.scaleToFit(width, height);
                // Center the image on the page
                page.drawImage(image, {
                    x: (width - imageDims.width) / 2,
                    y: (height - imageDims.height) / 2,
                    width: imageDims.width,
                    height: imageDims.height
                });
                console.log('Template image added successfully');
            } catch (imageError) {
                console.warn('Failed to load template image, continuing without it:', imageError);
            }
        }
        // Add certificate content
        const centerX = width / 2;
        // Certificate title
        page.drawText('Certificate of Completion', {
            x: centerX - 120,
            y: height - 120,
            size: 24,
            font: boldFont,
            color: rgb(0, 0, 0)
        });
        // Student name
        page.drawText(studentName, {
            x: centerX - studentName.length * 8,
            y: height - 180,
            size: 20,
            font: boldFont,
            color: rgb(0, 0, 0)
        });
        // Course title
        page.drawText(courseTitle, {
            x: centerX - courseTitle.length * 6,
            y: height - 220,
            size: 16,
            font: primaryFont,
            color: rgb(0, 0, 0)
        });
        // Completion date
        page.drawText(`Completed on: ${completionDate}`, {
            x: centerX - 80,
            y: height - 260,
            size: 14,
            font: primaryFont,
            color: rgb(0, 0, 0)
        });
        // Certificate number
        page.drawText(`Certificate Number: ${certificateNumber}`, {
            x: centerX - 100,
            y: height - 300,
            size: 12,
            font: primaryFont,
            color: rgb(0.5, 0.5, 0.5)
        });
        // Author name (if provided)
        if (authorName) {
            page.drawText(`Author: ${authorName}`, {
                x: centerX - 60,
                y: height - 340,
                size: 14,
                font: primaryFont,
                color: rgb(0, 0, 0)
            });
        }
        // Set document metadata
        pdfDoc.setTitle(`Certificate of Completion - ${studentName}`);
        pdfDoc.setAuthor('LMS System');
        pdfDoc.setSubject(`Certificate for ${courseTitle}`);
        pdfDoc.setKeywords([
            'certificate',
            'completion',
            'course',
            'education'
        ]);
        pdfDoc.setCreationDate(new Date());
        console.log('PDF created successfully, generating blob...');
        // Generate PDF bytes
        const pdfBytes = await pdfDoc.save();
        console.log('PDF created successfully, size:', pdfBytes.length);
        // Return the Uint8Array directly - the calling code can convert to blob if needed
        return pdfBytes;
    } catch (error) {
        console.error('Error in createPDF:', error);
        console.error('Error type:', typeof error);
        console.error('Error constructor:', error?.constructor?.name);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        // Try to get more details about the error
        if (error && typeof error === 'object') {
            console.error('Error keys:', Object.keys(error));
            console.error('Error properties:', Object.getOwnPropertyNames(error));
        }
        throw error;
    }
};

//# sourceMappingURL=createPDF.js.map