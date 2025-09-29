import React from 'react'
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { CertificateDocument } from '../ui/Certificate/index.js'

// Workaround for React 19 compatibility
const ReactPDF = React

// Additional React 19 compatibility workaround
if (typeof window !== 'undefined') {
  // Ensure React 19 compatibility in browser environment
  (window as any).React = React
}

// Create a React 19 compatible render function
const renderToReactPDF = (element: React.ReactElement) => {
  // Use React.createElement to avoid JSX issues with React 19
  const props = element.props as any
  return React.createElement(element.type, props, ...(props.children || []))
}

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
    console.log('createPDF called with data:', {
        studentName,
        courseTitle,
        completionDate,
        certificateNumber,
        templateImage,
        fontFamily,
        authorName
    })

    // Validate inputs
    if (!studentName || !courseTitle) {
        throw new Error('Missing required fields: studentName and courseTitle are required')
    }

    // Check if CertificateDocument is available
    console.log('CertificateDocument type:', typeof CertificateDocument)
    console.log('CertificateDocument:', CertificateDocument)
    if (!CertificateDocument) {
        throw new Error('CertificateDocument component is not available')
    }
    
    // Check if pdf function is available
    console.log('pdf function type:', typeof pdf)
    if (!pdf) {
        throw new Error('pdf function is not available')
    }

    try {
        // Create the certificate document using React.createElement for React 19 compatibility
        console.log('Creating certificate PDF with React 19 compatibility...')
        
        // Try multiple approaches for React 19 compatibility
        let PDF
        
        try {
            // Approach 1: Direct JSX (might work in some cases)
            console.log('Trying approach 1: Direct JSX...')
            PDF = pdf(
                React.createElement(CertificateDocument, {
                    studentName,
                    courseTitle,
                    completionDate,
                    certificateNumber,
                    templateImage,
                    fontFamily,
                    authorName
                }) as any
            )
        } catch (jsxError) {
            console.log('Approach 1 failed, trying approach 2...', jsxError)
            
            // Approach 2: Create a simple document structure
            console.log('Trying approach 2: Simple document structure...')
            const simpleDocument = React.createElement(Document, null,
                React.createElement(Page, { size: "A4", orientation: "landscape" },
                    React.createElement(View, { style: { padding: 40, textAlign: 'center' } },
                        React.createElement(Text, { style: { fontSize: 24, marginBottom: 20 } }, "Certificate of Completion"),
                        React.createElement(Text, { style: { fontSize: 32, marginBottom: 20 } }, studentName),
                        React.createElement(Text, { style: { fontSize: 20, marginBottom: 10 } }, courseTitle),
                        React.createElement(Text, { style: { fontSize: 16, marginBottom: 10 } }, completionDate),
                        React.createElement(Text, { style: { fontSize: 12, marginBottom: 40 } }, `Certificate Number: ${certificateNumber}`),
                        authorName && React.createElement(Text, { style: { fontSize: 14 } }, `Author: ${authorName}`)
                    )
                )
            )
            PDF = pdf(simpleDocument)
        }
        
        console.log('PDF object created, calling toBlob()...')
        const blob = await PDF.toBlob()
        console.log('PDF blob created successfully, size:', blob.size)
        return blob
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
        
        // Try fallback approach for React 19 compatibility
        console.log('Attempting fallback approach for React 19 compatibility...')
        try {
            // Create a simple document without the custom component
            const fallbackDocument = React.createElement(Document, null,
                React.createElement(Page, { size: "A4", orientation: "landscape" },
                    React.createElement(View, { style: { padding: 40, textAlign: 'center' } },
                        React.createElement(Text, { style: { fontSize: 24, marginBottom: 20 } }, "Certificate of Completion"),
                        React.createElement(Text, { style: { fontSize: 32, marginBottom: 20 } }, studentName),
                        React.createElement(Text, { style: { fontSize: 20, marginBottom: 10 } }, courseTitle),
                        React.createElement(Text, { style: { fontSize: 16, marginBottom: 10 } }, completionDate),
                        React.createElement(Text, { style: { fontSize: 12, marginBottom: 40 } }, `Certificate Number: ${certificateNumber}`),
                        authorName && React.createElement(Text, { style: { fontSize: 14 } }, `Author: ${authorName}`)
                    )
                )
            )
            
            const fallbackPDF = pdf(fallbackDocument)
            const fallbackBlob = await fallbackPDF.toBlob()
            console.log('Fallback PDF created successfully, size:', fallbackBlob.size)
            return fallbackBlob
        } catch (fallbackError) {
            console.error('Fallback approach also failed:', fallbackError)
            throw error // Throw the original error
        }
    }
}