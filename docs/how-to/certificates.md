# How to award and generate certificates

## How a certificate is awarded

1. An admin sets **Awards → Certificate** on the course.
2. The student completes the last required lesson (`complete-lesson`), or calls `complete-course`
   once every required lesson is done.
3. In one transaction, the plugin:
   - moves the student from `enrolledStudents` to `courseCompletedStudents`
   - marks the course complete in the student's `coursesProgress`
   - adds `{ certificate, course, completedDate }` to the student's `certificates`

The student's `certificates` array is the record that they earned it. Nothing else can award one:
students cannot write that field, and `generate-certificate` refuses certificates that are not in it.

## Where certificates are stored

Certificate PDFs live in the plugin's private **documents** collection, not in your public media
collection. Each PDF is owned by the student: only they, admins and authors can read it or download
the file, and nobody else can list it. The award links to it in `certificates[].document`.

If your site stores uploads in S3 or another storage adapter, add the documents collection to it
(for example `s3Storage({ collections: { media: true, documents: true } })`) and keep
`disablePayloadAccessControl` off, so downloads go through the access check.

## Generate the PDF

From the browser, as the student:

```typescript
const response = await fetch('/api/lms/generate-certificate', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ courseId, certificateId }),
})
const { certificate } = await response.json()
// certificate is the private document: certificate.url only works for this logged-in student
```

On the server (a hook, a job, a Server Component):

```typescript
import { generateCertificate } from '@littledash/plugin-lms/services'

const { document, status } = await generateCertificate({ req, userId, courseId, certificateId })
// status is 'created' the first time and 'existing' afterwards
```

The PDF is stored once per award, under a random file name, and dated with the award's completion
date. Read it from `certificates[].document`; do not build file names.

### Certificates from older versions

Before private documents, PDFs were stored in the public media collection, either linked from
`certificates[].file` or named `certificate-<courseId>-<certificateId>-<userId>.pdf`. The first
request for such a certificate creates the private PDF, **deletes the public copies**, and clears
`certificates[].file`. Links to those public copies, for example in emails already sent, stop
working; students can still download the certificate from their account.

## Email the certificate when it is awarded

Attach the PDF instead of linking to it. A link to a private document only opens for the logged-in
student, so it fails in most mail apps, and a public link could be opened by anyone the email is
forwarded to. `renderCertificatePDF` returns the PDF bytes without storing anything.

Add an `afterChange` hook to your students collection that reacts to new entries in `certificates`.
Because the plugin awards the certificate and saves the user in one update, the hook sees it once.

```typescript
import type { CollectionAfterChangeHook } from 'payload'
import { renderCertificatePDF } from '@littledash/plugin-lms/services'

const id = (value: unknown) => (typeof value === 'object' && value ? (value as { id: string }).id : value)
const key = (entry: { certificate: unknown; course: unknown }) => `${id(entry.certificate)}-${id(entry.course)}`

export const emailNewCertificates: CollectionAfterChangeHook = async ({ context, doc, previousDoc, req }) => {
  // Linking the stored PDF to an award is not a new award
  if (context.lmsCertificateFile) return
  const before = new Set((previousDoc?.certificates ?? []).map(key))
  const added = (doc.certificates ?? []).filter((entry: { certificate: unknown; course: unknown }) => !before.has(key(entry)))

  for (const entry of added) {
    const pdf = await renderCertificatePDF({
      req,
      userId: doc.id,
      courseId: id(entry.course) as string,
      certificateId: id(entry.certificate) as string,
    })
    await req.payload.sendEmail({
      to: doc.email,
      subject: 'Your certificate',
      html: `<p>Congratulations! Your certificate is attached. You can also download it from your account.</p>`,
      attachments: [{ content: pdf.data, contentType: pdf.mimeType, filename: pdf.filename }],
    })
  }
}
```

`attachments` follows the Nodemailer format, which `@payloadcms/email-nodemailer` passes through.

## Backfill missing certificates

If a course gained a certificate after students finished it, or 1.x missed some, run
`completeCourse` for each completed student. On an already completed course it only awards a
certificate that is missing, and returns `certificateAwarded`.

```typescript
import type { PayloadRequest } from 'payload'
import { completeCourse } from '@littledash/plugin-lms/services'

const course = await payload.findByID({ collection: 'courses', id: courseId, depth: 0 })
for (const userId of course.courseCompletedStudents ?? []) {
  const { certificateAwarded } = await completeCourse({
    req: { payload } as PayloadRequest,
    userId,
    courseId,
  })
  if (certificateAwarded) payload.logger.info(`Awarded certificate to ${userId}`)
}
```

## Template

Upload the certificate background as the certificate's **Template** image. If the template is
missing or cannot be loaded, the PDF is generated on a plain page.

The PDF prints, centred, on top of the template:

1. "this certifies that" and the student's first and last name
2. the certificate's **Description**, one line per heading, paragraph, list item or line break,
   with headings in bold
3. the course title
4. "presented by" and the certificate's **Presenter name**, or the first author's first and last
   name when it is empty (nothing when there is neither)

and the completion date in the bottom right. The description and the lines below it wrap to 70% of
the page width and shrink together, down to half size, so the presenter stays clear of the logo
area at the bottom of the template even with a long course title. Keep the description to what the
layout does not already print, for example "has completed a 1-hour online masterclass on the topic
of"; do not repeat the student, course or presenter in it. A certificate without a description
prints "Certificate of Completion".

This is the default layout. Each site can change it; see [Change the layout](#change-the-layout).

Characters the PDF font cannot draw are replaced rather than failing the certificate: invisible
formatting characters are removed, accented letters the font lacks lose the accent, and anything
else (emoji, non-Latin scripts) prints as `?`. The default fonts cover Latin text only; give the
layout a font file to print other scripts.

The template is resized to fit A4 landscape at about 200 dpi (2400 × 1700 pixels at most) and
embedded as a JPEG, with transparent areas filled white, so each PDF stays under about 1 MB however
large the upload is. This uses the `sharp` set in your Payload config. Without it, the image is
embedded as uploaded. PDFs that were already stored keep their size until they are regenerated.

## Change the layout

The default layout was designed for one A4 landscape template. Set `certificates.layout` in the
plugin config to fit your own template. Every property is optional; anything you leave out keeps
its default. Positions and sizes are in PDF points (1/72 inch), measured from the bottom left of the
page. A4 landscape is 842 × 595.

```typescript
import { readFileSync } from 'node:fs'

lmsPlugin({
  certificates: {
    layout: {
      pageSize: [842, 595], // A4 landscape; [595, 842] for portrait
      fonts: {
        // A standard PDF font name, or the bytes of a .ttf / .otf file
        regular: readFileSync('src/fonts/Poppins-Regular.ttf'),
        bold: readFileSync('src/fonts/Poppins-Bold.ttf'),
      },
      colors: { text: '#222222', studentName: '#0b6e4f', courseTitle: '#0b6e4f' },
      text: {
        intro: 'This is to certify that', // '' leaves the line out
        presentedBy: 'with', // '' prints the presenter without a label
        defaultDescription: 'has successfully completed', // when the certificate has no description
      },
      body: {
        top: 210, // intro baseline, measured down from the top of the page
        bottom: 140, // lowest baseline, above logos and signatures
        center: 0.5, // horizontal centre, as a fraction of the page width
        maxWidth: 0.6, // wrap width, as a fraction of the page width
        sizes: { intro: 18, studentName: 32, description: 16, courseTitle: 22, presentedBy: 14, presenter: 16 },
      },
      date: {
        locale: 'en-AU', // "26 November 2025"
        // or format: (date) => date.toISOString().slice(0, 10),
        right: 120, // right edge of the date, from the right edge of the page
        y: 80,
        size: 12,
      },
      // date: false leaves the date out
    },
  },
})
```

The gaps between lines scale with the font sizes, so larger text does not overlap. A fixed layout
is checked when Payload starts: a colour that is not `#rrggbb`, a negative position or a fraction
above 1 stops the app with a message naming the property.

### A different layout per certificate

Pass a function to choose the layout for each certificate. It receives the certificate (at depth
1), the course and the student, so it can read fields you add to the certificates collection:

```typescript
lmsPlugin({
  certificates: {
    certificatesCollection: {
      fields: ({ defaultFields }) => [
        ...defaultFields,
        { name: 'orientation', type: 'select', defaultValue: 'landscape', options: ['landscape', 'portrait'] },
      ],
    },
    layout: ({ certificate }) =>
      certificate.orientation === 'portrait'
        ? { pageSize: [595, 842], body: { top: 260, bottom: 200 } }
        : {},
  },
})
```

A function's layout is checked when each certificate is generated, and an invalid one fails that
request with a 500.

### Replace the PDF entirely

When the layout options are not enough, `certificates.render` replaces the built-in PDF. It
receives the certificate, course and student documents, the text to print (`studentName`,
`courseTitle`, `completionDate` formatted by the layout, `completedDate` as a `Date`,
`presenterName`, `description`, `templateImage`) and the resolved `layout`, and returns the PDF
bytes. Build them with pdf-lib, a headless browser or a PDF service.

```typescript
import { PDFDocument, StandardFonts } from 'pdf-lib'

lmsPlugin({
  certificates: {
    render: async ({ studentName, courseTitle, completionDate }) => {
      const pdf = await PDFDocument.create()
      const page = pdf.addPage([842, 595])
      const font = await pdf.embedFont(StandardFonts.TimesRoman)
      page.drawText(`${studentName} completed ${courseTitle} on ${completionDate}`, { x: 60, y: 300, size: 20, font })
      return pdf.save()
    },
  },
})
```

`renderDefault(layout?)` renders the built-in certificate with extra layout changes, so a render
function can adjust the layout per student or add pages to the default certificate:

```typescript
render: async ({ renderDefault, student }) => {
  const pdf = await PDFDocument.load(await renderDefault())
  // ... add a transcript page
  return pdf.save()
}
```

The plugin still checks the award, stores the result in the private documents collection and
returns it from `generate-certificate` and `renderCertificatePDF` as before. A render function
that does not return bytes fails the request, and nothing is stored. Print only the data you are
given: the PDF is readable by the student, and by anyone they share it with.

Certificates already stored keep the old layout. A stored PDF is regenerated only when it is
missing, so to reissue one, clear `certificates[].document` on the student (as an admin) and
request it again.
