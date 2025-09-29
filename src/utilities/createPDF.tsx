import React from 'react'
import { pdf } from '@react-pdf/renderer'
import { CertificateDocument } from '../ui/Certificate/index.js'

type createPDFProps = {
    studentName: string;
    courseTitle: string;
    completionDate: string;
    certificateNumber: string;
    templateImage: string;
    fontFamily: string;
    authorName?: string;
}

export const createPDF = async ({
    studentName,
    courseTitle,
    completionDate,
    certificateNumber,
    templateImage,
    fontFamily,
    authorName,
}: createPDFProps) => {
	const PDF = pdf(
		<CertificateDocument
			studentName={studentName}
			courseTitle={courseTitle}
			completionDate={completionDate}
			certificateNumber={certificateNumber}
			templateImage={templateImage}
			fontFamily={fontFamily}
			authorName={authorName}
		/>
	)

	return await PDF.toBlob()
}