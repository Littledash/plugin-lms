import type { SanitizedConfig } from 'payload'
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib'

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - @pdf-lib/fontkit doesn't have proper TypeScript definitions
import fontkit from '@pdf-lib/fontkit'

// Type for Payload rich text field (Lexical editor state)
type RichTextNode = {
  [k: string]: unknown
  children?: RichTextNode[]
  text?: string
  type: string
  version: number
}

type RichText = {
  [k: string]: unknown
  root: {
    children: RichTextNode[]
    direction: ('ltr' | 'rtl') | null
    format: '' | 'center' | 'end' | 'justify' | 'left' | 'right' | 'start'
    indent: number
    type: string
    version: number
  }
}

type Sharp = NonNullable<SanitizedConfig['sharp']>

type createPDFProps = {
  authorName?: string
  certificateNumber: string
  completionDate: string
  courseTitle: string
  description: RichText | string
  fontFamily: string
  /** Payload's `sharp`, used to shrink the template image. Without it the image is embedded as uploaded. */
  sharp?: Sharp
  studentName: string
  templateImage: string
}

// A4 landscape at about 200 dpi: sharp in print, small enough to download and store per student
const TEMPLATE_MAX_WIDTH = 2400
const TEMPLATE_MAX_HEIGHT = 1700
const TEMPLATE_JPEG_QUALITY = 85

/**
 * Templates are often uploaded as large PNGs (5 MB or more). pdf-lib embeds images byte for byte,
 * so every certificate would carry the full file. Resize to print resolution and re-encode as JPEG,
 * keeping the original when it is already smaller.
 */
export const shrinkTemplateImage = async (bytes: Uint8Array, sharp?: Sharp): Promise<Uint8Array> => {
  if (!sharp) {
    return bytes
  }
  try {
    const resized = await sharp(bytes)
      .rotate()
      .resize({ fit: 'inside', height: TEMPLATE_MAX_HEIGHT, width: TEMPLATE_MAX_WIDTH, withoutEnlargement: true })
      // Transparent areas would turn black in a JPEG; the page behind them is white
      .flatten({ background: '#ffffff' })
      .jpeg({ mozjpeg: true, quality: TEMPLATE_JPEG_QUALITY })
      .toBuffer()
    return resized.length < bytes.length ? new Uint8Array(resized) : bytes
  } catch {
    return bytes
  }
}

// Latin letters that have no decomposition to a base letter
const LETTER_FALLBACKS: Record<string, string> = { Đ: 'D', đ: 'd', Ħ: 'H', ħ: 'h', ı: 'i', Ł: 'L', ł: 'l' }

/**
 * Makes text drawable with a standard PDF font, which only covers WinAnsi and throws on anything
 * else. A student can type any character into their name, and a throw would mean they never get a
 * certificate. Invisible format characters (such as a left-to-right mark) are dropped, letters with
 * marks the font lacks lose the mark, and anything else becomes '?'.
 */
export const toDrawableText = (text: string, characterSet: ReadonlySet<number>): string => {
  let result = ''
  for (const char of text.replace(/\p{Cf}/gu, '')) {
    if (characterSet.has(char.codePointAt(0)!)) {
      result += char
      continue
    }
    if (/[\p{Cc}\p{Z}]/u.test(char)) {
      result += ' '
      continue
    }
    const fallback = LETTER_FALLBACKS[char]
    if (fallback) {
      result += fallback
      continue
    }
    const base = [...char.normalize('NFKD').replace(/\p{M}/gu, '')].filter((c) => characterSet.has(c.codePointAt(0)!))
    result += base.length ? base.join('') : '?'
  }
  return result
}

type DescriptionBlock = { bold: boolean; text: string }

const nodeText = (node: RichTextNode): string => {
  if (node.type === 'linebreak') {
    return '\n'
  }
  let text = typeof node.text === 'string' ? node.text : ''
  for (const child of Array.isArray(node.children) ? node.children : []) {
    text += nodeText(child)
  }
  return text
}

const toBlocks = (text: string, bold: boolean): DescriptionBlock[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((line) => ({ bold, text: line }))

/**
 * Splits a certificate description into the lines it should print as. Each Lexical block (heading,
 * paragraph, list item) and each soft line break starts a new line. Joining them would run the text
 * together on one line that falls off the page. Headings are printed bold.
 */
export const descriptionBlocks = (richText: RichText | string | undefined): DescriptionBlock[] => {
  if (typeof richText === 'string') {
    return toBlocks(richText, false)
  }
  if (!richText || typeof richText !== 'object' || !Array.isArray(richText.root?.children)) {
    return []
  }
  return richText.root.children.flatMap((block) => {
    const items = block.type === 'list' && Array.isArray(block.children) ? block.children : [block]
    return items.flatMap((item) => toBlocks(nodeText(item), block.type === 'heading'))
  })
}

const wrapText = (text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] => {
  const lines: string[] = []
  let currentLine = ''

  for (const word of text.split(' ')) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (font.widthOfTextAtSize(testLine, fontSize) > maxWidth && currentLine) {
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

type BodyLine = { bold: boolean; color: 'black' | 'blue'; size: number; text: string; y: number }

type BodySection = {
  bold: boolean
  color: BodyLine['color']
  /** Baseline distance from the previous section's last line */
  gap: number
  /** Baseline distance between wrapped lines, as a multiple of `size` */
  leading: number
  size: number
  texts: string[]
}

/** The lowest baseline the body may use, clear of the logo and signature area on the template */
export const BODY_BOTTOM = 165
const MIN_BODY_SCALE = 0.5
const BODY_SCALE_STEP = 0.05

/**
 * Lays out the description, course title and presenter below the student name. Sizes and gaps
 * start at the template's design (20pt description, 24pt title, 16pt "presented by", 18pt
 * presenter) and shrink together in 5% steps, down to half size, until the last line sits at or
 * above `bottom`, so a long title or presenter cannot run into the logo. At half size the lines
 * are returned even if they do not fit.
 */
export const layoutCertificateBody = ({
  blocks,
  boldFont,
  bottom = BODY_BOTTOM,
  courseTitle,
  font,
  maxWidth,
  presenter,
  top,
}: {
  blocks: DescriptionBlock[]
  boldFont: PDFFont
  bottom?: number
  courseTitle: string
  font: PDFFont
  maxWidth: number
  presenter?: string
  /** Baseline of the student name */
  top: number
}): BodyLine[] => {
  const sections: BodySection[] = [
    ...blocks.map((block, index) => ({
      bold: block.bold,
      color: 'black' as const,
      gap: index === 0 ? 50 : 26,
      leading: 1.3,
      size: 20,
      texts: [block.text],
    })),
    { bold: true, color: 'blue', gap: 50, leading: 1.25, size: 24, texts: [courseTitle] },
    ...(presenter
      ? [
          { bold: false, color: 'black' as const, gap: 44, leading: 1.25, size: 16, texts: ['presented by'] },
          { bold: false, color: 'black' as const, gap: 22, leading: 1.25, size: 18, texts: [presenter] },
        ]
      : []),
  ]

  for (let scale = 1; ; scale -= BODY_SCALE_STEP) {
    const lines: BodyLine[] = []
    let y = top
    for (const section of sections) {
      const size = section.size * scale
      const wrapped = section.texts.flatMap((text) => wrapText(text, maxWidth, size, section.bold ? boldFont : font))
      wrapped.forEach((text, index) => {
        y -= index === 0 ? section.gap * scale : size * section.leading
        lines.push({ bold: section.bold, color: section.color, size, text, y })
      })
    }
    if (y >= bottom || scale - BODY_SCALE_STEP < MIN_BODY_SCALE - 1e-9) {
      return lines
    }
  }
}

export const createPDF = async ({
  authorName: rawAuthorName,
  completionDate: rawCompletionDate,
  courseTitle: rawCourseTitle,
  description,
  sharp,
  studentName: rawStudentName,
  templateImage,
}: createPDFProps): Promise<Uint8Array> => {
  // Validate inputs
  if (!rawStudentName || !rawCourseTitle) {
    throw new Error('Missing required fields: studentName and courseTitle are required')
  }

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()

  // Register fontkit for custom font support
  pdfDoc.registerFontkit(fontkit)

  // Add a page (A4 size in landscape orientation)
  const page: PDFPage = pdfDoc.addPage([842, 595]) // A4 landscape dimensions

  // Helvetica matches the sans-serif certificate template
  const primaryFont: PDFFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont: PDFFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Helvetica and Helvetica Bold share the WinAnsi character set
  const characterSet = new Set(primaryFont.getCharacterSet())
  const drawable = (text: string) => toDrawableText(text, characterSet)
  const authorName = rawAuthorName ? drawable(rawAuthorName).trim() : undefined
  const completionDate = drawable(rawCompletionDate)
  const courseTitle = drawable(rawCourseTitle)
  const studentName = drawable(rawStudentName)

  // Get page dimensions
  const { height, width } = page.getSize()

  // Add background image if provided
  if (templateImage) {
    try {
      const imageResponse = await fetch(templateImage)
      const imageBytes = await shrinkTemplateImage(new Uint8Array(await imageResponse.arrayBuffer()), sharp)

      // Embed by content rather than URL: a shrunk PNG template is now a JPEG
      let image: PDFImage
      try {
        image = await pdfDoc.embedJpg(imageBytes)
      } catch {
        image = await pdfDoc.embedPng(imageBytes)
      }

      // Scale image to fit page
      const imageDims = image.scaleToFit(width, height)

      // Center the image on the page
      page.drawImage(image, {
        height: imageDims.height,
        width: imageDims.width,
        x: (width - imageDims.width) / 2,
        y: (height - imageDims.height) / 2,
      })
    } catch {
      // No details: the template URL is not useful to users and the PDF still renders
      // eslint-disable-next-line no-console
      console.warn('Certificate template image could not be loaded; generating without it')
    }
  }

  // Add certificate content - Updated template layout
  const centerX = width / 2

  // Helper function to center text horizontally
  const getCenteredX = (text: string, fontSize: number, font: PDFFont): number => {
    try {
      // pdf-lib fonts have widthOfTextAtSize method
      const textWidth = font.widthOfTextAtSize(text, fontSize)
      return centerX - textWidth / 2
    } catch {
      // Fallback: estimate based on character count (approximate)
      const estimatedWidth = text.length * (fontSize * 0.6)
      return centerX - estimatedWidth / 2
    }
  }

  // Starting Y position - "This certifies that" should be just below the "CERTIFICATE OF COMPLETION" heading
  // Position text higher on the page, just below the heading
  let currentY = height - 190

  // "This certifies that" - static text, 20pt, positioned below the certificate heading
  const certifiesText = 'this certifies that'
  page.drawText(certifiesText, {
    color: rgb(0, 0, 0),
    font: primaryFont,
    size: 20,
    x: getCenteredX(certifiesText, 20, primaryFont),
    y: currentY,
  })

  // Student name - ensure there's a space between first and last name
  // Trim and normalize spaces in studentName
  const normalizedStudentName = studentName.trim().replace(/\s+/g, ' ')
  currentY -= 50
  page.drawText(normalizedStudentName, {
    color: rgb(0.8, 0.2, 0.4), // Pink color to match template
    font: boldFont,
    size: 22,
    x: getCenteredX(normalizedStudentName, 22, boldFont),
    y: currentY,
  })

  const blocks = descriptionBlocks(description)
    .map((block) => ({ ...block, text: drawable(block.text).trim() }))
    .filter((block) => block.text)
  const colors = { black: rgb(0, 0, 0), blue: rgb(64 / 255, 84 / 255, 165 / 255) }
  const bodyLines = layoutCertificateBody({
    blocks: blocks.length ? blocks : [{ bold: false, text: 'has completed a 1 hour online Masterclass on the topic of' }],
    boldFont,
    courseTitle,
    font: primaryFont,
    maxWidth: width * 0.7,
    presenter: authorName || undefined,
    top: currentY,
  })
  for (const line of bodyLines) {
    const font = line.bold ? boldFont : primaryFont
    page.drawText(line.text, {
      color: colors[line.color],
      font,
      size: line.size,
      x: getCenteredX(line.text, line.size, font),
      y: line.y,
    })
  }

  // Completion date - positioned above "DATE" line in bottom right
  // The "DATE" label is in the bottom right, date should be above that line, moved left and higher
  const dateTextWidth = primaryFont.widthOfTextAtSize(completionDate, 12)
  const dateX = width - 150 - dateTextWidth // Right-aligned, 150px from right edge (moved left)
  page.drawText(completionDate, {
    color: rgb(0, 0, 0),
    font: primaryFont,
    size: 12,
    x: dateX,
    y: 100, // Position higher above the "DATE" label line
  })

  // Set document metadata
  pdfDoc.setTitle(`Certificate of Completion - ${studentName}`)
  pdfDoc.setAuthor(authorName || 'LMS System')
  pdfDoc.setSubject(`Certificate for ${courseTitle}`)
  pdfDoc.setKeywords(['certificate', 'completion', 'course', 'education'])
  pdfDoc.setCreationDate(new Date())

  // Generate PDF bytes
  const pdfBytes = await pdfDoc.save()

  // Return the Uint8Array directly - the calling code can convert to blob if needed
  return pdfBytes
}
