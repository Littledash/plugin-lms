import { PDFDocument, StandardFonts, rgb, PDFFont, PDFImage, PDFPage } from 'pdf-lib'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - @pdf-lib/fontkit doesn't have proper TypeScript definitions
import fontkit from '@pdf-lib/fontkit'

// Type for Payload rich text field (Lexical editor state)
type RichTextNode = {
    type: string
    version: number
    text?: string
    children?: RichTextNode[]
    [k: string]: unknown
}

type RichText = {
    root: {
        type: string
        children: RichTextNode[]
        direction: ('ltr' | 'rtl') | null
        format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''
        indent: number
        version: number
    }
    [k: string]: unknown
}

type createPDFProps = {
    studentName: string;
    courseTitle: string;
    completionDate: string;
    certificateNumber: string;
    templateImage: string;
    description: string | RichText;
    fontFamily: string;
    authorName?: string;
}

/**
 * Extracts plain text from a Payload rich text field (Lexical editor state)
 * Recursively traverses the node structure to extract all text content
 */
const extractPlainTextFromRichText = (richText: string | RichText): string => {
    // If it's already a string, return it
    if (typeof richText === 'string') {
        return richText
    }

    // If it's not a valid rich text object, return empty string
    if (!richText || typeof richText !== 'object' || !richText.root) {
        return ''
    }

    const extractTextFromNode = (node: RichTextNode): string => {
        let text = ''

        // If the node has text property, add it
        if (node.text && typeof node.text === 'string') {
            text += node.text
        }

        // Recursively process children
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                text += extractTextFromNode(child)
            }
        }

        return text
    }

    // Extract text from root's children
    let result = ''
    if (richText.root.children && Array.isArray(richText.root.children)) {
        for (const child of richText.root.children) {
            result += extractTextFromNode(child)
        }
    }

    return result.trim()
}

export const createPDF = async ({
    studentName,
    courseTitle,
    completionDate,
    certificateNumber,
    templateImage,
    description,
    fontFamily,
    authorName,
}: createPDFProps): Promise<Uint8Array> => {
    console.log('createPDF called with data:', {
        studentName,
        courseTitle,
        completionDate,
        certificateNumber,
        templateImage,
        description,
        fontFamily,
        authorName
    })

    // Validate inputs
    if (!studentName || !courseTitle) {
        throw new Error('Missing required fields: studentName and courseTitle are required')
    }

    try {
        console.log('Creating PDF with pdf-lib...')
        
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create()
        
        // Register fontkit for custom font support
        pdfDoc.registerFontkit(fontkit)
        
        // Add a page (A4 size in landscape orientation)
        const page: PDFPage = pdfDoc.addPage([842, 595]) // A4 landscape dimensions
        
        // Embed fonts - use sans-serif fonts to match certificate template
        // Using Helvetica (sans-serif) to match the certificate design
        let primaryFont: PDFFont
        let boldFont: PDFFont
        
        // Use Helvetica sans-serif font to match the certificate design
        primaryFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
        boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        console.log('Using Helvetica sans-serif fonts for certificate')
        
        // Get page dimensions
        const { width, height } = page.getSize()
        
        // Add background image if provided
        if (templateImage) {
            try {
                console.log('Loading template image:', templateImage)
                const imageResponse = await fetch(templateImage)
                const imageBytes = await imageResponse.arrayBuffer()
                
                // Determine image type and embed accordingly
                let image: PDFImage
                if (templateImage.toLowerCase().includes('.jpg') || templateImage.toLowerCase().includes('.jpeg')) {
                    image = await pdfDoc.embedJpg(imageBytes)
                } else if (templateImage.toLowerCase().includes('.png')) {
                    image = await pdfDoc.embedPng(imageBytes)
                } else {
                    // Try JPG first, then PNG
                    try {
                        image = await pdfDoc.embedJpg(imageBytes)
                    } catch {
                        image = await pdfDoc.embedPng(imageBytes)
                    }
                }
                
                // Scale image to fit page
                const imageDims = image.scaleToFit(width, height)
                
                // Center the image on the page
                page.drawImage(image, {
                    x: (width - imageDims.width) / 2,
                    y: (height - imageDims.height) / 2,
                    width: imageDims.width,
                    height: imageDims.height,
                })
                
                console.log('Template image added successfully')
            } catch (imageError) {
                console.warn('Failed to load template image, continuing without it:', imageError)
            }
        }
        
        // Add certificate content - Updated template layout
        const centerX = width / 2
        
        // Helper function to center text horizontally
        const getCenteredX = (text: string, fontSize: number, font: PDFFont): number => {
            try {
                // pdf-lib fonts have widthOfTextAtSize method
                const textWidth = font.widthOfTextAtSize(text, fontSize)
                return centerX - (textWidth / 2)
            } catch {
                // Fallback: estimate based on character count (approximate)
                const estimatedWidth = text.length * (fontSize * 0.6)
                return centerX - (estimatedWidth / 2)
            }
        }

        // Helper function to wrap text to multiple lines
        const wrapText = (text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] => {
            const words = text.split(' ')
            const lines: string[] = []
            let currentLine = ''

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word
                const testWidth = font.widthOfTextAtSize(testLine, fontSize)

                if (testWidth > maxWidth && currentLine) {
                    lines.push(currentLine)
                    currentLine = word
                } else {
                    currentLine = testLine
                }
            }

            if (currentLine) {
                lines.push(currentLine)
            }

            return lines.length > 0 ? lines : [text]
        }
        
        // Starting Y position - "This certifies that" should be just below the "CERTIFICATE OF COMPLETION" heading
        // Position text higher on the page, just below the heading
        let currentY = height - 190
        
        // "This certifies that" - static text, 20pt, positioned below the certificate heading
        const certifiesText = "this certifies that"
        page.drawText(certifiesText, {
            x: getCenteredX(certifiesText, 20, primaryFont),
            y: currentY,
            size: 20,
            font: primaryFont,
            color: rgb(0, 0, 0),
        })
        
        // Student name - ensure there's a space between first and last name
        // Trim and normalize spaces in studentName
        const normalizedStudentName = studentName.trim().replace(/\s+/g, ' ')
        currentY -= 50
        page.drawText(normalizedStudentName, {
            x: getCenteredX(normalizedStudentName, 22, boldFont),
            y: currentY,
            size: 22,
            font: boldFont,
            color: rgb(0.8, 0.2, 0.4), // Pink color to match template
        })
        
        // Description text - "has completed a 1 hour online Masterclass on the topic of" - 20pt
        currentY -= 50
        const descriptionText = description 
            ? extractPlainTextFromRichText(description) || "has completed a 1 hour online Masterclass on the topic of"
            : "has completed a 1 hour online Masterclass on the topic of"
        page.drawText(descriptionText, {
            x: getCenteredX(descriptionText, 20, primaryFont),
            y: currentY,
            size: 20,
            font: primaryFont,
            color: rgb(0, 0, 0),
        })
        
        // Course title - wrap text if needed, 24pt, dark blue, bold
        currentY -= 50
        const maxCourseTitleWidth = width * 0.7 // 70% of page width for wrapping
        const courseTitleLines = wrapText(courseTitle, maxCourseTitleWidth, 24, boldFont)
        const lineHeight = 30 // Space between lines
        courseTitleLines.forEach((line, index) => {
            page.drawText(line, {
                x: getCenteredX(line, 24, boldFont),
                y: currentY - (index * lineHeight),
                size: 24,
                font: boldFont,
                color: rgb(64 / 255, 84 / 255, 165 / 255), // Dark blue color
            })
        })
        // Adjust currentY based on number of lines
        currentY -= (courseTitleLines.length - 1) * lineHeight
        
        // "presented by" - 20pt, above author name
        if (authorName) {
            currentY -= 50
            const presentedByText = "presented by"
            page.drawText(presentedByText, {
                x: getCenteredX(presentedByText, 20, primaryFont),
                y: currentY,
                size: 20,
                font: primaryFont,
                color: rgb(0, 0, 0),
            })
            
            // Author name - below "presented by", closer spacing
            currentY -= 25
            page.drawText(authorName, {
                x: getCenteredX(authorName, 20, primaryFont),
                y: currentY,
                size: 20,
                font: primaryFont,
                color: rgb(0, 0, 0),
            })
        }
        
        // Completion date - positioned above "DATE" line in bottom right
        // The "DATE" label is in the bottom right, date should be above that line, moved left and higher
        const dateTextWidth = primaryFont.widthOfTextAtSize(completionDate, 12)
        const dateX = width - 150 - dateTextWidth // Right-aligned, 150px from right edge (moved left)
        page.drawText(completionDate, {
            x: dateX,
            y: 100, // Position higher above the "DATE" label line
            size: 12,
            font: primaryFont,
            color: rgb(0, 0, 0),
        })
        
        // Set document metadata
        pdfDoc.setTitle(`Certificate of Completion - ${studentName}`)
        pdfDoc.setAuthor(authorName || 'LMS System')
        pdfDoc.setSubject(`Certificate for ${courseTitle}`)
        pdfDoc.setKeywords(['certificate', 'completion', 'course', 'education'])
        pdfDoc.setCreationDate(new Date())
        
        console.log('PDF created successfully, generating blob...')
        
        // Generate PDF bytes
        const pdfBytes = await pdfDoc.save()
        
        console.log('PDF created successfully, size:', pdfBytes.length)
        
        // Return the Uint8Array directly - the calling code can convert to blob if needed
        return pdfBytes
        
    } catch (error) {
        console.error('Error in createPDF:', error)
        console.error('Error type:', typeof error)
        console.error('Error constructor:', error?.constructor?.name)
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
        console.error('Error message:', error instanceof Error ? error.message : String(error))
        
        // Try to get more details about the error
        if (error && typeof error === 'object') {
            console.error('Error keys:', Object.keys(error))
            console.error('Error properties:', Object.getOwnPropertyNames(error))
        }
        
        throw error
    }
}