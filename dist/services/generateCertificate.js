import { createPDF } from '../utilities/createPDF.js';
import { asSlug, findDoc, getSlugs, LMSError, sameId, withTransaction } from './shared.js';
export const getCertificateFileName = ({ certificateId, courseId, userId })=>`certificate-${courseId}-${certificateId}-${userId}.pdf`;
/**
 * Returns the certificate PDF for a course, creating it on first request. The user must have
 * been awarded this certificate for this course.
 */ export const generateCertificate = ({ certificateId, courseId, req, userId })=>withTransaction(req, async ()=>{
        const slugs = getSlugs(req);
        const user = await findDoc(req, slugs.students, userId, 'User');
        const awarded = (Array.isArray(user.certificates) ? user.certificates : []).some((entry)=>sameId(entry.certificate, certificateId) && sameId(entry.course, courseId));
        if (!awarded) {
            throw new LMSError('This certificate has not been awarded for this course.', 403);
        }
        const fileName = getCertificateFileName({
            certificateId,
            courseId,
            userId: user.id
        });
        const { docs: existing } = await req.payload.find({
            collection: asSlug(slugs.media),
            depth: 0,
            limit: 1,
            req,
            where: {
                filename: {
                    equals: fileName
                }
            }
        });
        if (existing[0]) {
            return {
                media: existing[0],
                status: 'existing'
            };
        }
        const course = await findDoc(req, slugs.courses, courseId, 'Course');
        // depth 1 populates the template image and authors
        const certificate = await req.payload.findByID({
            id: certificateId,
            collection: asSlug(slugs.certificates),
            depth: 1,
            disableErrors: true,
            req
        });
        if (!certificate) {
            throw new LMSError('Certificate not found.', 404);
        }
        if (!user.firstName || !user.lastName) {
            throw new LMSError('User name is incomplete.', 400);
        }
        if (!course.title) {
            throw new LMSError('Course title is missing.', 400);
        }
        const author = Array.isArray(certificate.authors) ? certificate.authors[0] : undefined;
        const pdf = await createPDF({
            authorName: author && typeof author === 'object' ? `${author.firstName || ''} ${author.lastName || ''}`.trim() : undefined,
            certificateNumber: `CERT-${course.id}-${certificate.id}-${user.id}`,
            courseTitle: course.title,
            studentName: `${user.firstName} ${user.lastName}`,
            // e.g. "26 November 2025"
            completionDate: new Date().toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }),
            description: certificate.description || 'Certificate of Completion',
            fontFamily: 'Poppins',
            templateImage: certificate.template?.url || ''
        });
        const buffer = Buffer.from(pdf);
        const media = await req.payload.create({
            collection: asSlug(slugs.media),
            data: {
                title: `Certificate - ${course.title} - ${user.firstName} ${user.lastName}`
            },
            file: {
                name: fileName,
                data: buffer,
                mimetype: 'application/pdf',
                size: buffer.length
            },
            req
        });
        req.payload.logger.info(`Created certificate ${media.id} for user ${user.id} for course ${course.id}`);
        return {
            media,
            status: 'created'
        };
    });

//# sourceMappingURL=generateCertificate.js.map