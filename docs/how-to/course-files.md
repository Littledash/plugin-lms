# How to protect lesson files

Workbooks, handouts and other downloads that come with a lesson are paid content. The plugin keeps
them in a protected **course files** collection (`course-files`), not in your public media
collection.

## Who can open a file

A file can be read, listed and downloaded by:

- admins and authors
- a student who can open a lesson that offers the file right now: enrolled in a course containing
  the lesson (directly or through a group), access not expired, the lesson released, and in linear
  courses the earlier lessons completed

So a file unlocks exactly when its lesson does, and locks again when access expires. Anonymous
visitors and students without access get nothing, not even the file list. Only admins and authors
can upload, edit or delete files.

## Add files to a lesson

1. In the admin panel, open the lesson and go to **Lesson Settings → Downloadable Files**.
2. Upload the file there, or choose one already in Course Files.

Keep public assets, such as course images and video posters, in your media collection.

## Show files to students

Read the lesson as the student, so access is checked, and link to each file's `url`:

```tsx
const files = lesson.lessonSettings?.downloadableFiles ?? []

return files.map((file) =>
  typeof file === 'object' ? (
    <a href={file.url} key={file.id}>
      {file.title || file.filename}
    </a>
  ) : null,
)
```

The link opens for the logged-in student and is refused for anyone else, so do not put it in emails
or public pages.

## Storage adapters

With S3 or another storage adapter, add the collection and keep Payload's access control on, so
downloads go through the check:

```typescript
s3Storage({
  collections: {
    media: true,
    'course-files': true,
  },
  // ...
})
```

Do not set `disablePayloadAccessControl` for `course-files`, and keep the bucket private.

## Moving existing files out of media

Before 2.0, `downloadableFiles` pointed at the media collection, where anyone could list and
download the files. After upgrading, lessons still hold those media IDs, which no longer resolve.
Move them with a one-off script:

1. Back up the database and the storage bucket.
2. For each lesson, read the raw `lessonSettings.downloadableFiles` IDs (with
   `payload.db.findOne`, so they are not resolved against the new collection).
3. For each media file: download its bytes, create a `course-files` document with the same file
   name and title, and remember the new ID.
4. Write the new IDs to the lesson **without saving it through Payload**. Lessons have drafts, and
   `payload.update` builds from the newest version, so it can publish a pending draft. Use
   `payload.db.updateOne` for the lesson and update every saved version as well (for example with
   `payload.db.updateVersion`), so restoring an old version cannot bring the media IDs back.
5. Read each lesson back at depth 1 and check its downloads resolve.
6. Make it safe to re-run: reuse an existing course file with the same file name, and move a media
   file shared by several lessons (or used elsewhere, such as by a product) only once.
7. Once every lesson is moved and checked, delete the old media files that nothing else uses, so
   they are no longer public.

Run it straight after deploying: until it finishes, lessons show no downloadable files.

## Turning it off

`lmsPlugin({ courseFiles: false })` removes the collection and points `downloadableFiles` back at
the media collection. Only do this if your media collection is not publicly readable.
