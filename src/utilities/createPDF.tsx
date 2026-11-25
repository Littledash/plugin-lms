import type { SanitizedConfig } from 'payload'
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib'

import { PDFDocument, rgb } from 'pdf-lib'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - @pdf-lib/fontkit doesn't have proper TypeScript definitions
import fontkit from '@pdf-lib/fontkit'

import type { CertificateFont } from '../types.js'

import {
  colorChannels,
  DEFAULT_CERTIFICATE_LAYOUT,
  type ResolvedCertificateLayout,
} from '../certificates/layout.js'

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
  description?: RichText | string
  layout?: ResolvedCertificateLayout
  /** Payload's `sharp`, used to shrink the template image. Without it the image is embedded as uploaded. */
  sharp?: Sharp
  studentName: string
  templateImage: string
}

type BodySizes = ResolvedCertificateLayout['body']['sizes']

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

type BodyLine = { bold: boolean; color: 'courseTitle' | 'text'; size: number; text: string; y: number }

type BodySection = {
  bold: boolean
  color: BodyLine['color']
  /** Baseline distance from the previous section's last line, as a multiple of `size` */
  gap: number
  /** Baseline distance between wrapped lines, as a multiple of `size` */
  leading: number
  size: number
  texts: string[]
}

/** The lowest baseline the body may use by default, clear of the logo and signature area on the template */
export const BODY_BOTTOM = DEFAULT_CERTIFICATE_LAYOUT.body.bottom
const MIN_BODY_SCALE = 0.5
const BODY_SCALE_STEP = 0.05

/**
 * Lays out the description, course title and presenter below the student name. Sizes and gaps
 * start at `sizes` (by default 20pt description, 24pt title, 16pt "presented by", 18pt presenter)
 * and shrink together in 5% steps, down to half size, until the last line sits at or above
 * `bottom`, so a long title or presenter cannot run into the logo. At half size the lines are
 * returned even if they do not fit. Gaps are proportional to the sizes so that larger text in a
 * site's layout does not overlap.
 */
export const layoutCertificateBody = ({
  blocks,
  boldFont,
  bottom = BODY_BOTTOM,
  courseTitle,
  font,
  maxWidth,
  presentedBy = DEFAULT_CERTIFICATE_LAYOUT.text.presentedBy,
  presenter,
  sizes = DEFAULT_CERTIFICATE_LAYOUT.body.sizes,
  top,
}: {
  blocks: DescriptionBlock[]
  boldFont: PDFFont
  bottom?: number
  courseTitle: string
  font: PDFFont
  maxWidth: number
  /** Label above the presenter; empty leaves it out */
  presentedBy?: string
  presenter?: string
  sizes?: BodySizes
  /** Baseline of the student name */
  top: number
}): BodyLine[] => {
  const sections: BodySection[] = [
    ...blocks.map((block, index) => ({
      bold: block.bold,
      color: 'text' as const,
      gap: index === 0 ? 50 / 20 : 26 / 20,
      leading: 1.3,
      size: sizes.description,
      texts: [block.text],
    })),
    { bold: true, color: 'courseTitle', gap: 50 / 24, leading: 1.25, size: sizes.courseTitle, texts: [courseTitle] },
    ...(presenter && presentedBy
      ? [{ bold: false, color: 'text' as const, gap: 44 / 16, leading: 1.25, size: sizes.presentedBy, texts: [presentedBy] }]
      : []),
    ...(presenter
      ? [
          {
            bold: false,
            color: 'text' as const,
            gap: (presentedBy ? 22 : 44) / 18,
            leading: 1.25,
            size: sizes.presenter,
            texts: [presenter],
          },
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
        y -= index === 0 ? section.gap * size : size * section.leading
        lines.push({ bold: section.bold, color: section.color, size, text, y })
      })
    }
    if (y >= bottom || scale - BODY_SCALE_STEP < MIN_BODY_SCALE - 1e-9) {
      return lines
    }
  }
}

const embedFont = (pdfDoc: PDFDocument, font: CertificateFont): Promise<PDFFont> =>
  typeof font === 'string' ? pdfDoc.embedFont(font) : pdfDoc.embedFont(font, { subset: true })

export const createPDF = async ({
  authorName: rawAuthorName,
  completionDate: rawCompletionDate,
  courseTitle: rawCourseTitle,
  description,
  layout = DEFAULT_CERTIFICATE_LAYOUT,
  sharp,
  studentName: rawStudentName,
  templateImage,
}: createPDFProps): Promise<Uint8Array> => {
  if (!rawStudentName || !rawCourseTitle) {
    throw new Error('Missing required fields: studentName and courseTitle are required')
  }

  const pdfDoc = await PDFDocument.create()
  // Needed to embed font files
  pdfDoc.registerFontkit(fontkit)

  const page: PDFPage = pdfDoc.addPage(layout.pageSize)
  const primaryFont = await embedFont(pdfDoc, layout.fonts.regular)
  const boldFont = await embedFont(pdfDoc, layout.fonts.bold)

  // A line can use either font, so only characters both can draw are safe
  const boldCharacters = new Set(boldFont.getCharacterSet())
  const characterSet = new Set(primaryFont.getCharacterSet().filter((code) => boldCharacters.has(code)))
  const drawable = (text: string) => toDrawableText(text, characterSet)
  const authorName = rawAuthorName ? drawable(rawAuthorName).trim() : undefined
  const completionDate = drawable(rawCompletionDate)
  const courseTitle = drawable(rawCourseTitle)
  const studentName = drawable(rawStudentName)
  const text = {
    defaultDescription: drawable(layout.text.defaultDescription).trim(),
    intro: drawable(layout.text.intro).trim(),
    presentedBy: drawable(layout.text.presentedBy).trim(),
  }
  const colors = {
    courseTitle: rgb(...colorChannels(layout.colors.courseTitle)),
    studentName: rgb(...colorChannels(layout.colors.studentName)),
    text: rgb(...colorChannels(layout.colors.text)),
  }

  const { height, width } = page.getSize()

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

      const imageDims = image.scaleToFit(width, height)
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

  const { sizes } = layout.body
  const centerX = width * layout.body.center
  const getCenteredX = (line: string, fontSize: number, font: PDFFont): number =>
    centerX - font.widthOfTextAtSize(line, fontSize) / 2

  // The default top puts the intro just below the template's "CERTIFICATE OF COMPLETION" heading
  let currentY = height - layout.body.top

  if (text.intro) {
    page.drawText(text.intro, {
      color: colors.text,
      font: primaryFont,
      size: sizes.intro,
      x: getCenteredX(text.intro, sizes.intro, primaryFont),
      y: currentY,
    })
    currentY -= (50 / 22) * sizes.studentName
  }

  const normalizedStudentName = studentName.trim().replace(/\s+/g, ' ')
  page.drawText(normalizedStudentName, {
    color: colors.studentName,
    font: boldFont,
    size: sizes.studentName,
    x: getCenteredX(normalizedStudentName, sizes.studentName, boldFont),
    y: currentY,
  })

  const blocks = descriptionBlocks(description)
    .map((block) => ({ ...block, text: drawable(block.text).trim() }))
    .filter((block) => block.text)
  const bodyLines = layoutCertificateBody({
    blocks: blocks.length ? blocks : text.defaultDescription ? [{ bold: false, text: text.defaultDescription }] : [],
    boldFont,
    bottom: layout.body.bottom,
    courseTitle,
    font: primaryFont,
    maxWidth: width * layout.body.maxWidth,
    presentedBy: text.presentedBy,
    presenter: authorName || undefined,
    sizes,
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

  // By default above the "DATE" line in the template's bottom right
  if (layout.date && completionDate) {
    const { right, size, y } = layout.date
    page.drawText(completionDate, {
      color: colors.text,
      font: primaryFont,
      size,
      x: width - right - primaryFont.widthOfTextAtSize(completionDate, size),
      y,
    })
  }

  pdfDoc.setTitle(`Certificate of Completion - ${studentName}`)
  pdfDoc.setAuthor(authorName || 'LMS System')
  pdfDoc.setSubject(`Certificate for ${courseTitle}`)
  pdfDoc.setKeywords(['certificate', 'completion', 'course', 'education'])
  pdfDoc.setCreationDate(new Date())

  return pdfDoc.save()
}
