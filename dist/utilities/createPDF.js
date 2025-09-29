import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { pdf, Document, Page, Text, View } from '@react-pdf/renderer';
import { CertificateDocument } from '../ui/Certificate/index.js';
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
    // Check if CertificateDocument is available
    console.log('CertificateDocument type:', typeof CertificateDocument);
    if (!CertificateDocument) {
        throw new Error('CertificateDocument component is not available');
    }
    try {
        // First try with a simple test document to isolate the issue
        console.log('Creating simple test PDF first...');
        const testPDF = pdf(/*#__PURE__*/ _jsx(Document, {
            children: /*#__PURE__*/ _jsx(Page, {
                size: "A4",
                children: /*#__PURE__*/ _jsxs(View, {
                    children: [
                        /*#__PURE__*/ _jsx(Text, {
                            children: "Test Certificate"
                        }),
                        /*#__PURE__*/ _jsxs(Text, {
                            children: [
                                "Student: ",
                                studentName
                            ]
                        }),
                        /*#__PURE__*/ _jsxs(Text, {
                            children: [
                                "Course: ",
                                courseTitle
                            ]
                        })
                    ]
                })
            })
        }));
        console.log('Test PDF object created, calling toBlob()...');
        const testBlob = await testPDF.toBlob();
        console.log('Test PDF created successfully, size:', testBlob.size);
        // If test works, try with the full certificate
        console.log('Test PDF successful, now creating full certificate...');
        const PDF = pdf(/*#__PURE__*/ _jsx(CertificateDocument, {
            studentName: studentName,
            courseTitle: courseTitle,
            completionDate: completionDate,
            certificateNumber: certificateNumber,
            templateImage: templateImage,
            fontFamily: fontFamily,
            authorName: authorName
        }));
        console.log('Full PDF object created, calling toBlob()');
        const blob = await PDF.toBlob();
        console.log('Full PDF blob created successfully, size:', blob.size);
        return blob;
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