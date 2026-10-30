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

Upload the certificate background as the certificate's **Template** image. The PDF writes the
student's name, the course title, the completion date, a certificate number and the first author on
top of it. If the template is missing or cannot be loaded, the PDF is generated on a plain page.
