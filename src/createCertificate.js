import { addWeeks } from './addWeeks.js';
import { cleanCertificateType } from './cleanCertificateType.js';
import { formatDate } from './formatDate.js';
import { isValidNumber } from './isValidNumber.js';

export async function createCertificate(student, pdfTemplateBytes, boldFontBytes, semiBoldFontBytes, lightFontBytes, graduationDate, startDay, lastDay, season, year, isDS, titleText, awardText, customTextLines, certificateType) {
    const { PDFDocument, rgb } = PDFLib;
    const fontkit = window.fontkit;

    const pdfDoc = await PDFDocument.load(pdfTemplateBytes);
    pdfDoc.registerFontkit(fontkit);

    const [boldFont, semiBoldFont, lightFont] = await Promise.all([
        pdfDoc.embedFont(boldFontBytes),
        pdfDoc.embedFont(semiBoldFontBytes),
        pdfDoc.embedFont(lightFontBytes)
    ]);

    const pages = pdfDoc.getPages();
    const startPage = pages[0];

    const { width, height } = startPage.getSize();
    const fontSize = 31.5;
    const fontSize16 = 16;
    const color = rgb(0, 0, 0);

    const titleX = (width - semiBoldFont.widthOfTextAtSize(titleText, fontSize)) / 2;
    const titleY = height / 2 + 160;

    startPage.drawText(titleText, {
        x: titleX,
        y: titleY,
        size: fontSize,
        font: semiBoldFont,
        color: color,
    });


    const awardX = (width - lightFont.widthOfTextAtSize(awardText, fontSize16)) / 2;
    const awardY = height / 2 + 120;

    startPage.drawText(awardText, {
        x: awardX,
        y: awardY,
        size: fontSize16,
        font: lightFont,
        color: color,
    });

    const studentName = `${student.Name} ${student.Surname}`;
    const nameX = (width - boldFont.widthOfTextAtSize(studentName, fontSize)) / 2;
    const nameY = height / 2 + 70;

    startPage.drawText(studentName, {
        x: nameX,
        y: nameY,
        size: fontSize,
        font: boldFont,
        color: color,
    });

    const attendanceTotal1 = student['Attendance Total (%)'];
    const attendanceTotal2 = student['Attendance Total (%) 1'];

    if (isDS) {
        let attendanceText = "Attendance:";
        const attendanceX = 150;
        const attendanceY = height / 2 - 90;

        startPage.drawText(attendanceText, {
            x: attendanceX,
            y: attendanceY,
            size: fontSize16,
            font: lightFont,
            color: color,
        });

        let attendanceText1 = null;
        let attendanceText2 = null;

        if (isValidNumber(attendanceTotal1)) {
            attendanceText1 = Math.round(parseFloat(attendanceTotal1)) + '% (W1-W4)';
        }

        if (isValidNumber(attendanceTotal2)) {
            if (isValidNumber(attendanceTotal1)) {
                attendanceText2 = Math.round(parseFloat(attendanceTotal2)) + '% (W4-W8)';
            } else {
                attendanceText2 = Math.round(parseFloat(attendanceTotal2)) + '%';
            }
        }

        const attendanceTextX = 260;
        const attendanceTextY1 = height / 2 - 90;
        let attendanceTextY2;

        if (attendanceText1) {
            attendanceTextY2 = attendanceTextY1 - 26;
        } else {
            attendanceTextY2 = attendanceTextY1;
        }

        const attendanceFontSize = 16;

        if (attendanceText1) {
            startPage.drawText(attendanceText1, {
                x: attendanceTextX,
                y: attendanceTextY1,
                size: attendanceFontSize,
                font: boldFont,
                color: color,
            });
        }

        if (attendanceText2) {
            startPage.drawText(attendanceText2, {
                x: attendanceTextX,
                y: attendanceTextY2,
                size: attendanceFontSize,
                font: boldFont,
                color: color,
            });
        }

        let attendanceInPerson = student['Attendance In Person (%)'] || 'N/A';
        if (attendanceInPerson !== 'N/A') {
            attendanceInPerson = attendanceInPerson.replace(',', '.');
            attendanceInPerson = Math.round(parseFloat(attendanceInPerson));
        }

        let attendanceOnline = student['Attendance Online (%)'] || 'N/A';
        if (attendanceOnline !== 'N/A') {
            attendanceOnline = attendanceOnline.replace(',', '.');
            attendanceOnline = Math.round(parseFloat(attendanceOnline));
        }

        if (attendanceInPerson !== 'N/A' && attendanceOnline !== 'N/A') {
            const attendanceDetails = `(${attendanceInPerson}% in-person, ${attendanceOnline}% online)`;
            const attendanceDetailsX = attendanceTextX;
            const attendanceDetailsY = attendanceTextY2 - 18;
            const attendanceDetailsFontSize = 12;

            startPage.drawText(attendanceDetails, {
                x: attendanceDetailsX,
                y: attendanceDetailsY,
                size: attendanceDetailsFontSize,
                font: lightFont,
                color: color,
            });
        }

    } else {
        let scoretitle = "Grade:";
        const scoretitleX = 150;
        const gradeY = height / 2 - 85;

        startPage.drawText(scoretitle, {
            x: scoretitleX,
            y: gradeY,
            size: fontSize16,
            font: lightFont,
            color: color,
        });

        let scorevalue = student['% out of Total Score'] || 'N/A';
        if (scorevalue !== 'N/A') {
            scorevalue = scorevalue.replace(',', '.');
            scorevalue = Math.round(parseFloat(scorevalue));
        }

        const gradeText = `${scorevalue}% ${certificateType}`;
        const gradeFontSize = 16;
        const gradeX = 215;

        startPage.drawText(gradeText, {
            x: gradeX,
            y: gradeY,
            size: gradeFontSize,
            font: boldFont,
            color: color,
        });

        let attendancetitle = "Attendance:";
        const attendancetitleX = 150;
        const attendanceY = gradeY - 26;

        startPage.drawText(attendancetitle, {
            x: scoretitleX,
            y: attendanceY,
            size: fontSize16,
            font: lightFont,
            color: color,
        });

        let attendancevalue = student['Attendance Total (%)'] || 'N/A';
        if (attendancevalue !== 'N/A') {
            attendancevalue = attendancevalue.replace(',', '.');
            attendancevalue = Math.round(parseFloat(attendancevalue));
        }

        let attendanceInPerson = student['Attendance In Person (%)'] || 'N/A';
        if (attendanceInPerson !== 'N/A') {
            attendanceInPerson = attendanceInPerson.replace(',', '.');
            attendanceInPerson = Math.round(parseFloat(attendanceInPerson));
        }

        let attendanceOnline = student['Attendance Online (%)'] || 'N/A';
        if (attendanceOnline !== 'N/A') {
            attendanceOnline = attendanceOnline.replace(',', '.');
            attendanceOnline = Math.round(parseFloat(attendanceOnline));
        }

        if (attendancevalue !== 'N/A') {
            const attendanceText = `${attendancevalue}%`;
            const attendanceX = 260;

            startPage.drawText(attendanceText, {
                x: attendanceX,
                y: attendanceY,
                size: gradeFontSize,
                font: boldFont,
                color: color,
            });

            if (attendanceInPerson !== 'N/A' && attendanceOnline !== 'N/A') {
                const attendanceDetails = `(${attendanceInPerson}% in-person, ${attendanceOnline}% online)`;
                const attendanceDetailsX = attendanceX;
                const attendanceDetailsY = attendanceY - 18;
                const attendanceDetailsFontSize = 12;

                startPage.drawText(attendanceDetails, {
                    x: attendanceDetailsX,
                    y: attendanceDetailsY,
                    size: attendanceDetailsFontSize,
                    font: lightFont,
                    color: color,
                });
            }
        }
    }

    const customTextX = width / 2 - 280;
    let customTextY = height / 2 + 21;
    const customTextFontSize = 12;

    for (const line of customTextLines) {
        startPage.drawText(line, {
            x: customTextX,
            y: customTextY,
            size: customTextFontSize,
            font: lightFont,
            color: color,
        });
        customTextY -= 15;
    }

    if (graduationDate) {
        let datetitle = "Issued on:";
        const datetitleX = 150;

        let datevalueX = 240;
        let dateY = height / 2 - 158;

        if (isDS) {
            datevalueX = 240;
            dateY = height / 2 - 170;
        }

        const datevalueFontSize = 16;

        startPage.drawText(datetitle, {
            x: datetitleX,
            y: dateY,
            size: fontSize16,
            font: lightFont,
            color: color,
        });

        startPage.drawText(formatDate(graduationDate), {
            x: datevalueX,
            y: dateY,
            size: datevalueFontSize,
            font: boldFont,
            color: color,
        });
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
