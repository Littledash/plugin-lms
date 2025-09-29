import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@alexandernanberg/react-pdf-renderer';


// Define TypeScript types for props
export type CertificateData = {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  certificateNumber: string;
  templateImage: string;
  fontFamily: string;
  authorName?: string;
}

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  pageBackground: {
    position: 'absolute',
    minWidth: '100%',
    minHeight: '100%',
    height: '100%',
    width: '100%',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  studentName: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 20,
  },
  courseTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  completionDate: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  certificateNumber: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
  },
  instructorName: {
    fontSize: 14,
    textAlign: 'center',
  }
});

// Create Document Component
export const CertificateDocument: React.FC<CertificateData> = ({
  studentName,
  courseTitle,
  completionDate,
  certificateNumber,
  templateImage,
  fontFamily,
  authorName,
}) => {
  // Register font
  if (fontFamily) {
    Font.register({
      family: fontFamily,
      fonts: [
        { src: `https://fonts.gstatic.com/s/poppins/v23/pxiGyp8kv8JHgFVrJJLucXtAOvWDSHFF.woff2` }, // Example font URL
      ],
    });
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {templateImage && <Image style={styles.pageBackground} src={templateImage} />}
        <View style={styles.section}>
          <Text style={{ ...styles.header, fontFamily }}>Certificate of Completion</Text>
          <Text style={{ ...styles.studentName, fontFamily }}>{studentName}</Text>
          <Text style={{ ...styles.courseTitle, fontFamily }}>{courseTitle}</Text>
          <Text style={{ ...styles.completionDate, fontFamily }}>{completionDate}</Text>
          <Text style={{ ...styles.certificateNumber, fontFamily }}>Certificate Number: {certificateNumber}</Text>
          {authorName && <Text style={{...styles.instructorName, fontFamily}}>Author: {authorName}</Text>}
        </View>
      </Page>
    </Document>
  );
};
