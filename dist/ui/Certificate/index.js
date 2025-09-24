import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF'
    },
    pageBackground: {
        position: 'absolute',
        minWidth: '100%',
        minHeight: '100%',
        height: '100%',
        width: '100%'
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1
    },
    header: {
        fontSize: 24,
        textAlign: 'center',
        marginBottom: 20
    },
    studentName: {
        fontSize: 32,
        textAlign: 'center',
        marginBottom: 20
    },
    courseTitle: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 10
    },
    completionDate: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10
    },
    certificateNumber: {
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 40
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 12
    },
    instructorName: {
        fontSize: 14,
        textAlign: 'center'
    }
});
// Create Document Component
export const CertificateDocument = ({ studentName, courseTitle, completionDate, certificateNumber, templateImage, fontFamily, authorName })=>{
    // Register font
    if (fontFamily) {
        Font.register({
            family: fontFamily,
            fonts: [
                {
                    src: `https://fonts.gstatic.com/s/poppins/v23/pxiGyp8kv8JHgFVrJJLucXtAOvWDSHFF.woff2`
                }
            ]
        });
    }
    return /*#__PURE__*/ _jsx(Document, {
        children: /*#__PURE__*/ _jsxs(Page, {
            size: "A4",
            orientation: "landscape",
            style: styles.page,
            children: [
                templateImage && /*#__PURE__*/ _jsx(Image, {
                    style: styles.pageBackground,
                    src: templateImage
                }),
                /*#__PURE__*/ _jsxs(View, {
                    style: styles.section,
                    children: [
                        /*#__PURE__*/ _jsx(Text, {
                            style: {
                                ...styles.header,
                                fontFamily
                            },
                            children: "Certificate of Completion"
                        }),
                        /*#__PURE__*/ _jsx(Text, {
                            style: {
                                ...styles.studentName,
                                fontFamily
                            },
                            children: studentName
                        }),
                        /*#__PURE__*/ _jsx(Text, {
                            style: {
                                ...styles.courseTitle,
                                fontFamily
                            },
                            children: courseTitle
                        }),
                        /*#__PURE__*/ _jsx(Text, {
                            style: {
                                ...styles.completionDate,
                                fontFamily
                            },
                            children: completionDate
                        }),
                        /*#__PURE__*/ _jsxs(Text, {
                            style: {
                                ...styles.certificateNumber,
                                fontFamily
                            },
                            children: [
                                "Certificate Number: ",
                                certificateNumber
                            ]
                        }),
                        authorName && /*#__PURE__*/ _jsxs(Text, {
                            style: {
                                ...styles.instructorName,
                                fontFamily
                            },
                            children: [
                                "Author: ",
                                authorName
                            ]
                        })
                    ]
                })
            ]
        })
    });
};

//# sourceMappingURL=index.js.map