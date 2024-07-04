async function generateCertificate() {
     // Get the CSV file input, graduation date, start day, and last day from the web interface
    const csvFile = document.getElementById('csvFile').files[0];
    const graduationDate = document.getElementById('graduationDate').value;
    const startDay = document.getElementById('startDay').value;
    const lastDay = document.getElementById('lastDay').value;
    // Progress bar
    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    // Check if the CSV file is uploaded
    if (!csvFile) {
        alert("Please upload a CSV file.");
        return;
    }
    
    // Check if graduation date, start day, and last day are selected
    if (!graduationDate || !startDay || !lastDay) {
        alert("Please select graduation, start day, and last day.");
        return;
    }

    // Read the CSV file content as text
    const csvText = await csvFile.text();
    const fileName = csvFile.name;
    const isDS = fileName.includes('DS'); // Check if the file is for Data Science
    const students = parseCSV(csvText, isDS); // Parse the CSV content

    // Check if student data is found in the CSV
    if (students.length === 0) {
        alert("No student data found in the CSV.");
        return;
    }

    // Extract season and year from the file name
    const seasonAndYear = extractSeasonAndYear(fileName);
    const season = seasonAndYear.season;
    const year = seasonAndYear.year;

    let backgroundPdf = '';

    // Determine the background PDF based on the file name
    if (fileName.includes('WD')) {
        backgroundPdf = 'Background/background_WD.pdf';
    } else if (fileName.includes('DS')) {
        backgroundPdf = 'Background/background_DS.pdf';
    } else {
        alert("Invalid file name. Please include 'WD' or 'DS' in the file name.");
        return;
    }

    try {
        // Show the progress bar
        progressBarContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';

        // Fetch the background PDF and font files
        const pdfTemplateBytes = await fetch(`${backgroundPdf}?timestamp=${new Date().getTime()}`).then(res => res.arrayBuffer());

        const [boldFontBytes, semiBoldFontBytes, lightFontBytes] = await Promise.all([
            fetch('Police/Montserrat-Bold.ttf').then(res => res.arrayBuffer()),
            fetch('Police/Montserrat-SemiBold.ttf').then(res => res.arrayBuffer()),
            fetch('Police/Montserrat-ExtraLight.ttf').then(res => res.arrayBuffer())
        ]);

        const zip = new JSZip(); // Initialize a new JSZip instance
        const totalStudents = students.length;

        // Loop through each student to create their certificate
        for (let i = 0; i < totalStudents; i++) {
            const student = students[i];
            const pdfBytes = await createCertificate(student, pdfTemplateBytes, boldFontBytes, semiBoldFontBytes, lightFontBytes, graduationDate, startDay, lastDay, season, year, isDS);
            if (pdfBytes) {
                const fileName = `${student.Name}_${student.Surname}_Certificate.pdf`;
                zip.file(fileName, pdfBytes); // Add the certificate to the zip file
            }

            // Update the progress bar
            const progress = Math.round(((i + 1) / totalStudents) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        }

        // Generate the ZIP file and create a download link
        const zipContent = await zip.generateAsync({ type: "blob" });
        const zipBlob = new Blob([zipContent], { type: 'application/zip' });
        const zipUrl = URL.createObjectURL(zipBlob);

        // Create a download link for the ZIP file
        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = 'Certificates.zip';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(zipUrl);

        // Hide the progress bar after the process is complete
        progressBarContainer.classList.add('hidden');
    } catch (error) {
        console.error("Error creating certificates:", error);
        // Hide the progress bar in case of an error
        progressBarContainer.classList.add('hidden');
    }

    // Log each student object to the console
    students.forEach(student => {
        console.log(student);
    });
}


function extractSeasonAndYear(fileName) {
    // Define a regex pattern to match a word (season) followed by a space and four digits (year)
    const regex = /(\w+) (\d{4})/;
    // Use the regex to find a match in the file name
    const match = fileName.match(regex);
    if (match) {
        // If a match is found, return an object with the extracted season and year
        return {
            season: match[1],
            year: match[2]
        };
    } else {
        // If no match is found, return an object with 'Unknown' for both season and year
        return {
            season: 'Unknown',
            year: 'Unknown'
        };
    }
}

function parseCSV(text, isDS) {
    // Parse the CSV text using PapaParse, skipping empty lines and not treating the first row as headers
    const results = Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
    });

    // Log any errors encountered during CSV parsing
    if (results.errors.length) {
        console.error("Error parsing CSV:", results.errors);
    }

    // Process the CSV data differently based on the isDS flag
    if (isDS) {
        // For Data Science (DS), use the second row as the header
        const header = results.data[1];
        const students = [];
        for (let i = 2; i < results.data.length; i++) {
            const row = results.data[i];
            const student = {};

            // Use an array to track used column names
            const usedColumns = [];

            for (let j = 0; j < header.length; j++) {
                // Trim the header value or default to 'Column{j}' if the header is empty
                let columnName = header[j] ? header[j].trim() : `Column${j}`;
                
                // Ensure unique column names by appending a suffix if necessary
                if (usedColumns.includes(columnName)) {
                    let suffix = 1;
                    while (usedColumns.includes(`${columnName} ${suffix}`)) {
                        suffix++;
                    }
                    columnName = `${columnName} ${suffix}`;
                }

                student[columnName] = row[j];
                usedColumns.push(columnName);
            }
            students.push(student);
        }
        return students;
    } else {
        // For non-DS, use the first row as the header
        const header = results.data[0];
        const students = [];
        for (let i = 1; i < results.data.length; i++) {
            const row = results.data[i];
            const student = {};

            // Use an array to track used column names
            const usedColumns = [];

            for (let j = 0; j < header.length; j++) {
                // Trim the header value or default to 'Column{j}' if the header is empty
                let columnName = header[j] ? header[j].trim() : `Column${j}`;
                
                // Ensure unique column names by appending a suffix if necessary
                if (usedColumns.includes(columnName)) {
                    let suffix = 1;
                    while (usedColumns.includes(`${columnName} ${suffix}`)) {
                        suffix++;
                    }
                    columnName = `${columnName} ${suffix}`;
                }

                student[columnName] = row[j];
                usedColumns.push(columnName);
            }
            students.push(student);
        }
        return students;
    }
}


function cleanCertificateType(certificateType) {
    // Trim any leading or trailing whitespace from the certificate type
    certificateType = certificateType.trim();

    // Define a list of words to remove from the certificate type
    const wordsToRemove = ["Completion", "Certificate", "of", "online", "Online", "Attendance", "attendance", "NONE", "none"];

    // Remove each word in the wordsToRemove list from the certificate type
    wordsToRemove.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        certificateType = certificateType.replace(regex, '');
    });

    // Replace multiple consecutive spaces with a single space and trim the result
    certificateType = certificateType.replace(/\s\s+/g, ' ').trim();

    // If the certificate type is not empty after cleaning
    if (certificateType) {
        // Capitalize the first letter if it's not already capitalized
        if (!/[A-Z]/.test(certificateType.charAt(0))) {
            certificateType = certificateType.charAt(0).toUpperCase() + certificateType.slice(1);
        }
        // Format the certificate type as '(Type of Class)'
        certificateType = `(${certificateType} of Class)`;
    }
    // Return the cleaned and formatted certificate type
    return certificateType;
}

// Formats a date string into a format "day month year" (e.g., "1 January 2024")
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

// Checks if a given value is a valid number after replacing commas with periods
function isValidNumber(value) {
    value = value.replace(',', '.');
    return !isNaN(value) && !/[a-zA-Z]/.test(value);
}

// Adds a specified number of weeks to a date string and returns the new date
function addWeeks(dateString, weeks) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + (weeks * 7));
    return date.toISOString().split('T')[0];
}

async function createCertificate(student, pdfTemplateBytes, boldFontBytes, semiBoldFontBytes, lightFontBytes, graduationDate, startDay, lastDay, season, year, isDS) {

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
