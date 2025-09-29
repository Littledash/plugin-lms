import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
// This component is no longer used with pdf-lib approach
// Keeping it for backward compatibility but it won't be rendered
export const CertificateDocument = ({ studentName, courseTitle, completionDate, certificateNumber, templateImage, fontFamily, authorName })=>{
    // This component is deprecated - PDF generation now uses pdf-lib directly
    return /*#__PURE__*/ _jsxs("div", {
        children: [
            /*#__PURE__*/ _jsx("h1", {
                children: "Certificate of Completion"
            }),
            /*#__PURE__*/ _jsxs("p", {
                children: [
                    "Student: ",
                    studentName
                ]
            }),
            /*#__PURE__*/ _jsxs("p", {
                children: [
                    "Course: ",
                    courseTitle
                ]
            }),
            /*#__PURE__*/ _jsxs("p", {
                children: [
                    "Date: ",
                    completionDate
                ]
            }),
            /*#__PURE__*/ _jsxs("p", {
                children: [
                    "Certificate Number: ",
                    certificateNumber
                ]
            }),
            authorName && /*#__PURE__*/ _jsxs("p", {
                children: [
                    "Author: ",
                    authorName
                ]
            })
        ]
    });
};

//# sourceMappingURL=index.js.map