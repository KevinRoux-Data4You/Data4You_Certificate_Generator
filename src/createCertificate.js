import { addWeeks } from './addWeeks.js';
import { cleanCertificateType } from './cleanCertificateType.js';
import { formatDate } from './formatDate.js';
import { isValidNumber } from './isValidNumber.js';

export async function createCertificate(student, pdfTemplateBytes, boldFontBytes, semiBoldFontBytes, lightFontBytes, graduationDate, startDay, lastDay, season, year, isDS) {

    // Import necessary modules from PDFLib
    const { PDFDocument, rgb } = PDFLib;
    const fontkit = window.fontkit;

    // Load the PDF document and register the fontkit
    const pdfDoc = await PDFDocument.load(pdfTemplateBytes);
    pdfDoc.registerFontkit(fontkit);

    // Embed the fonts in the PDF document
    const [boldFont, semiBoldFont, lightFont] = await Promise.all([
        pdfDoc.embedFont(boldFontBytes),
        pdfDoc.embedFont(semiBoldFontBytes),
        pdfDoc.embedFont(lightFontBytes)
    ]);

    // Get the first page of the PDF document
    const pages = pdfDoc.getPages();
    const startPage = pages[0];

    // Define the size and color for the text
    const { width, height } = startPage.getSize();
    const fontSize = 31.5;
    const color = rgb(0, 0, 0);

    // Draw the student's name in the center of the page
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

    // Handle attendance data for Data Science students
    const attendanceTotal1 = student['Attendance Total (%)'];
    const attendanceTotal2 = student['Attendance Total (%) 1'];

    if (isDS) {
        
        let attendanceText1 = null;
        let attendanceText2 = null;

        // Check if the attendance values are valid and format them
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
    
        const attendanceX = 260;
        const attendanceY1 = height / 2 - 90;
        let attendanceY2;
    
        // Determine the Y coordinate
        if (attendanceText1) {
            attendanceY2 = attendanceY1 - 26;
        } else {
            attendanceY2 = attendanceY1;
        }
    
        const attendanceFontSize = 16;
    
        // Draw the first line of attendance text if it exists
        if (attendanceText1) {
            startPage.drawText(attendanceText1, {
                x: attendanceX,
                y: attendanceY1,
                size: attendanceFontSize,
                font: boldFont,
                color: color,
            });
        }
    
        // Draw the second line of attendance text if it exists
        if (attendanceText2) {
            startPage.drawText(attendanceText2, {
                x: attendanceX,
                y: attendanceY2,
                size: attendanceFontSize,
                font: boldFont,
                color: color,
            });
        }
        
        // Handle in-person and online attendance percentages
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
            const attendanceDetailsX = attendanceX;
            const attendanceDetailsY = attendanceY2 - 18;
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
        // Handle attendance and score data for non-DS students
        let certificateType = student['Certificate Type'] || '';

        // Set the title text based on certificate type
        let titleText = "";
        if (certificateType.toLowerCase().includes('online')) {
            titleText = "ONLINE CERTIFICATE OF COMPLETION";
        } else {
            titleText = "CERTIFICATE OF COMPLETION";
        }
        if (certificateType.toLowerCase().includes('attendance') || certificateType.toLowerCase().includes('none')) {
            titleText = "CERTIFICATE OF ATTENDANCE";
        }

        const titleX = (width - semiBoldFont.widthOfTextAtSize(titleText, fontSize)) / 2;
        const titleY = height / 2 + 160;

        startPage.drawText(titleText, {
            x: titleX,
            y: titleY,
            size: fontSize,
            font: semiBoldFont,
            color: color,
        });

        let score = student['% out of Total Score'] || 'N/A';
        if (score !== 'N/A') {
            score = score.replace(',', '.');
            score = Math.round(parseFloat(score));
        }

        let attendance = student['Attendance Total (%)'] || 'N/A';
        if (attendance !== 'N/A') {
            attendance = attendance.replace(',', '.');
            attendance = Math.round(parseFloat(attendance));
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

        certificateType = cleanCertificateType(certificateType);

        const gradeText = `${score}% ${certificateType}`;
        const gradeFontSize = 16;
        const gradeX = 215;
        const gradeY = height / 2 - 85;

        startPage.drawText(gradeText, {
            x: gradeX,
            y: gradeY,
            size: gradeFontSize,
            font: boldFont,
            color: color,
        });

        if (attendance !== 'N/A') {
            const attendanceText = `${attendance}%`;
            const attendanceX = 260;
            const attendanceY = gradeY - 26;

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

    // Draw the graduation date if it exists
    if (graduationDate) {
        
        let dateX = 240;
        let dateY = height / 2 - 159;
        
        if (isDS) {
            dateX = 240;
            dateY = height / 2 - 170;
        }
        
        const dateFontSize = 16;

        startPage.drawText(formatDate(graduationDate), {
            x: dateX,
            y: dateY,
            size: dateFontSize,
            font: boldFont,
            color: color,
        });
    }

    // Define custom text lines for DS and non-DS students
    let customTextLines = []

    if(isDS) {
        customTextLines = [
            `For successfully completing the Data Science Bootcamp at Coding Bootcamp Praha,`, 
            `${season} Batch ${year}. The 8-week programme took place between ${formatDate(startDay)} and `,
            `${formatDate(lastDay)} in Prague, Czech Republic and consisted of 4-week part-time studies (W1-W4)`,
            `and 4-week full-time studies (W5-W8). Course details can be found on www.codingbootcamp.cz.`, 
            `Coding Bootcamp Praha is organised by Data4You.`,
        ];
        if(student['Column2'] !== "2 month") {
            if(isValidNumber(attendanceTotal1)) {
                lastDay = addWeeks(startDay, 4);
            } else {
                startDay = addWeeks(startDay, 4);
            }

            customTextLines = [
                `For successfully completing the Data Science Bootcamp at Coding Bootcamp Praha,`,
                `${season} Batch ${year}. The 4-week full-time programme took place between ${formatDate(startDay)} and`,
                `${formatDate(lastDay)} in Prague, Czech Republic. Course details can be found on www.codingbootcamp.cz.`,
                `Coding Bootcamp Praha is organised by Data4You.`,
            ];
        }
    } else {
        customTextLines = [
            `For successfully completing the Coding Bootcamp Praha, ${season} Batch ${year}. The 12-week,`,
            `fulltime Fullstack Web Development programme took place between ${formatDate(startDay)} and`,
            `${formatDate(lastDay)} in Prague, Czech Republic. The student has completed the requirements for`,
            `graduation as prescribed by Data4You z.s. on www.codingbootcamp.cz`,
        ];
    }
    
    // Draw the custom text lines
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

    // Return the final PDF document
    return pdfDoc.save();
}
