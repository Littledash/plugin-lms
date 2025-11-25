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
        
        // Embed fonts - use Google Fonts or fallback to standard fonts
        let primaryFont: PDFFont
        let boldFont: PDFFont
        
        if (fontFamily && fontFamily.toLowerCase() !== 'poppins') {
            try {
                console.log(`Loading Google Font: ${fontFamily}`)
                
                // Map font family to Google Fonts URL - Updated with more reliable URLs
                const getGoogleFontUrl = (fontName: string) => {
                    const fontMap: { [key: string]: string } = {
                        'poppins': 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2',
                        'poppins-bold': 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2',
                        'roboto': 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
                        'roboto-bold': 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2',
                        'opensans': 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVIGxA.woff2',
                        'opensans-bold': 'https://fonts.gstatic.com/s/opensans/v34/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0Rk8ZkWVAewA.woff2',
                        'lato': 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.woff2',
                        'lato-bold': 'https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.woff2',
                        'montserrat': 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXpsog.woff2',
                        'montserrat-bold': 'https://fonts.gstatic.com/s/montserrat/v25/JTUSjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw0aXpsog.woff2',
                    }
                    return fontMap[fontName.toLowerCase()] || null
                }
                
                const fontUrl = getGoogleFontUrl(fontFamily)
                const boldFontUrl = getGoogleFontUrl(`${fontFamily}-bold`)
                
                if (fontUrl) {
                    // Fetch and embed the Google Font
                    console.log(`Fetching ${fontFamily} regular font from:`, fontUrl)
                    const fontResponse = await fetch(fontUrl)
                    if (!fontResponse.ok) {
                        throw new Error(`Failed to fetch ${fontFamily} regular font: ${fontResponse.status} ${fontResponse.statusText}`)
                    }
                    const fontBytes = await fontResponse.arrayBuffer()
                    primaryFont = await pdfDoc.embedFont(fontBytes)
                    console.log(`Successfully loaded Google Font: ${fontFamily}`)
                } else {
                    throw new Error(`Font ${fontFamily} not found in Google Fonts mapping`)
                }
                
                if (boldFontUrl) {
                    // Fetch and embed the bold variant
                    console.log(`Fetching ${fontFamily} bold font from:`, boldFontUrl)
                    const boldFontResponse = await fetch(boldFontUrl)
                    if (!boldFontResponse.ok) {
                        throw new Error(`Failed to fetch ${fontFamily} bold font: ${boldFontResponse.status} ${boldFontResponse.statusText}`)
                    }
                    const boldFontBytes = await boldFontResponse.arrayBuffer()
                    boldFont = await pdfDoc.embedFont(boldFontBytes)
                    console.log(`Successfully loaded Google Font bold variant: ${fontFamily}`)
                } else {
                    // If no bold variant, use the regular font for bold text
                    boldFont = primaryFont
                    console.log(`No bold variant found for ${fontFamily}, using regular font for bold text`)
                }
                
            } catch (fontError) {
                console.warn(`Failed to load Google Font ${fontFamily}, falling back to Helvetica:`, fontError)
                primaryFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
                boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
            }
        } else {
            // Default to Poppins Google Font with improved error handling
            try {
                console.log('Loading default Google Font: Poppins')
                const poppinsUrl = 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2'
                const poppinsBoldUrl = 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2'
                
                console.log('Fetching Poppins regular font from:', poppinsUrl)
                const fontResponse = await fetch(poppinsUrl)
                if (!fontResponse.ok) {
                    throw new Error(`Failed to fetch Poppins regular font: ${fontResponse.status} ${fontResponse.statusText}`)
                }
                const fontBytes = await fontResponse.arrayBuffer()
                primaryFont = await pdfDoc.embedFont(fontBytes)
                console.log('Successfully embedded Poppins regular font')
                
                console.log('Fetching Poppins bold font from:', poppinsBoldUrl)
                const boldFontResponse = await fetch(poppinsBoldUrl)
                if (!boldFontResponse.ok) {
                    throw new Error(`Failed to fetch Poppins bold font: ${boldFontResponse.status} ${boldFontResponse.statusText}`)
                }
                const boldFontBytes = await boldFontResponse.arrayBuffer()
                boldFont = await pdfDoc.embedFont(boldFontBytes)
                console.log('Successfully embedded Poppins bold font')
                
                console.log('Successfully loaded default Poppins font family')
            } catch (poppinsError) {
                console.warn('Failed to load Poppins, falling back to Helvetica:', poppinsError)
                console.warn('Poppins error details:', {
                    message: poppinsError instanceof Error ? poppinsError.message : String(poppinsError),
                    stack: poppinsError instanceof Error ? poppinsError.stack : undefined
                })
                primaryFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
                boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
                console.log('Fallback to Helvetica fonts completed')
            }
        }
        
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
        
        // Starting Y position (adjust based on template image)
        let currentY = height - 200
        
        // "This certifies that" - static text, 20pt, above student name
        const certifiesText = "This certifies that"
        page.drawText(certifiesText, {
            x: getCenteredX(certifiesText, 20, primaryFont),
            y: currentY,
            size: 20,
            font: primaryFont,
            color: rgb(0, 0, 0),
        })
        
        // Student name - 22pt, pink color
        currentY -= 50
        page.drawText(studentName, {
            x: getCenteredX(studentName, 22, boldFont),
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
        
        // Course title - 24pt, dark blue
        currentY -= 50
        page.drawText(courseTitle, {
            x: getCenteredX(courseTitle, 24, primaryFont),
            y: currentY,
            size: 24,
            font: primaryFont,
            color: rgb(64 / 255, 84 / 255, 165 / 255), // Dark blue color
        })
        
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
            
            // Author name - below "presented by"
            currentY -= 40
            page.drawText(authorName, {
                x: getCenteredX(authorName, 20, primaryFont),
                y: currentY,
                size: 20,
                font: primaryFont,
                color: rgb(0, 0, 0),
            })
        }
        
        // Completion date - positioned at bottom right
        page.drawText(completionDate, {
            x: centerX - 40,
            y: height - 450,
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