import { createPDF } from './src/utilities/createPDF.tsx'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function testCertificateGeneration() {
  console.log('Starting certificate generation test...')
  
  const testData = {
    studentName: 'Christopher Nowlan',
    courseTitle: 'Relationships and Attachment in Early Childhood – What Children Need and Why You Matter',
    completionDate: new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
    certificateNumber: 'CERT-TEST-001',
    templateImage: 'https://drkaylenehenderson.vercel.app/api/media/file/masterclass-completion-certificates.jpg',
    description: 'has completed a 1 hour online Masterclass on the topic of',
    fontFamily: 'Helvetica',
    authorName: 'Dr Kaylene Henderson (MBBS FRANZCP Cert C&A Psych)'
  }

  try {
    console.log('Generating PDF with data:', testData)
    const pdfBytes = await createPDF(testData)
    
    const outputPath = join(__dirname, 'test-certificate.pdf')
    writeFileSync(outputPath, pdfBytes)
    
    console.log(`✅ Certificate generated successfully!`)
    console.log(`📄 Saved to: ${outputPath}`)
    console.log(`📊 PDF size: ${pdfBytes.length} bytes`)
  } catch (error) {
    console.error('❌ Error generating certificate:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack
    })
    process.exit(1)
  }
}

testCertificateGeneration()

