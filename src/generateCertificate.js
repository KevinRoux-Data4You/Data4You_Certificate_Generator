import { createCertificate } from './createCertificate.js';
import { extractSeasonAndYear } from './extractSeasonAndYear.js';
import { parseCSV } from './parseCSV.js';
import { addWeeks } from './addWeeks.js';
import { formatDate } from './formatDate.js';
import { isValidNumber } from './isValidNumber.js';
import { cleanCertificateType } from './cleanCertificateType.js';

let students = [];
let backgroundPdf = null;
let boldFontBytes = null;
let semiBoldFontBytes = null;
let lightFontBytes = null;
let graduationDate = '';
let startDay = '';
let lastDay = '';
let season = '';
let year = '';
let isDS = false;
let currentFilter = -1; // Initialize with -1 to indicate no student selected
let titleText = '';
let awardText = '';
let customTextLines = null;
let certificateType ='';

// Dictionary to store generated certificate data
const generatedCertificates = {};

export async function handleCertificateAction(isPreview) {
    const csvFile = document.getElementById('csvFile').files[0];
    const backgroundFile = document.getElementById('backgroundFile').files[0];
    graduationDate = document.getElementById('graduationDate').value;
    startDay = document.getElementById('startDay').value;
    lastDay = document.getElementById('lastDay').value;

    const progressBarContainer = document.getElementById('progressBarContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (!csvFile) {
        alert("Please upload a CSV file.");
        return;
    }

    if (!graduationDate || !startDay || !lastDay) {
        alert("Please select graduation, start day, and last day.");
        return;
    }

    const csvText = await csvFile.text();
    const fileName = csvFile.name;
    isDS = fileName.includes('DS');
    students = parseCSV(csvText, isDS);

    if (students.length === 0) {
        alert("No student data found in the CSV.");
        return;
    }

    // Filter out students without a name
    students = students.filter(student => student.Name);

    const seasonAndYear = extractSeasonAndYear(fileName);
    season = seasonAndYear.season;
    year = seasonAndYear.year;

    students.sort((a, b) => a.Name.localeCompare(b.Name));

    if (backgroundFile) {
        backgroundPdf = await backgroundFile.arrayBuffer();
    } else if (fileName.includes('WD')) {
        backgroundPdf = await fetch('Background/background_WD.pdf').then(res => res.arrayBuffer());
    } else if (fileName.includes('DS')) {
        backgroundPdf = await fetch('Background/background_DS.pdf').then(res => res.arrayBuffer());
    } else {
        alert("Invalid file name. Please include 'WD' or 'DS' in the file name.");
        return;
    }

    [boldFontBytes, semiBoldFontBytes, lightFontBytes] = await Promise.all([
        fetch('Police/Montserrat-Bold.ttf').then(res => res.arrayBuffer()),
        fetch('Police/Montserrat-SemiBold.ttf').then(res => res.arrayBuffer()),
        fetch('Police/Montserrat-ExtraLight.ttf').then(res => res.arrayBuffer())
    ]);

    renderPagination(); // Render pagination buttons on initial load

    if (students.length > 0) {
        currentFilter = 0; // Set currentFilter to the first student index

        await generateCertificates(progressBarContainer, progressBar, progressText);

        if (isPreview) {
            await renderPreview();
        }
    } else {
        alert("No student data available to preview.");
    }
}

async function generateCertificates(progressBarContainer, progressBar, progressText) {
    progressBarContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = '0%';

    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        if (!student.Name) continue;

        // Check if the certificate data is already generated
        const studentKey = `${student.Name}_${student.Surname}`;
        if (!generatedCertificates[studentKey]) {
            // If not generated, generate the certificate

            console.log(student);

            titleText = '';
            awardText = '';
            customTextLines = null;
            certificateType = '';

            certificateType = cleanCertificateType(student['Certificate Type'] || '');

            if (!titleText) {
                if (!isDS) {
                    if (certificateType.toLowerCase().includes('online')) {
                        titleText = "ONLINE CERTIFICATE OF COMPLETION";
                    } else {
                        titleText = "CERTIFICATE OF COMPLETION";
                    }
                } else {
                    titleText = "CERTIFICATE OF ATTENDANCE";
                }
            }
        
            if (!awardText) {
                awardText = "This certificate is awarded to";
            }
        
            if (!customTextLines) {
                if (isDS) {
                    customTextLines = [
                        `For successfully completing the Data Science Bootcamp at Coding Bootcamp Praha,`, 
                        `${season} Batch ${year}. The 8-week programme took place between ${formatDate(startDay)} and `,
                        `${formatDate(lastDay)} in Prague, Czech Republic and consisted of 4-week part-time studies (W1-W4)`,
                        `and 4-week full-time studies (W5-W8). Course details can be found on www.codingbootcamp.cz.`, 
                        `Coding Bootcamp Praha is organised by Data4You.`,
                    ];
                    if (student['Column2'] !== "2 month") {
                        if (isValidNumber(student['Attendance Total (%)'])) {
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
            }

            const pdfBytes = await createCertificate(student, backgroundPdf, boldFontBytes, semiBoldFontBytes, lightFontBytes, graduationDate, startDay, lastDay, season, year, isDS, titleText, awardText, customTextLines, certificateType);

            const certificateData = {
                titleText,
                awardText,
                studentName: `${student.Name} ${student.Surname}`,
                customTextLines,
                score: student['% out of Total Score'] || 'N/A',
                attendance: {
                    total1: student['Attendance Total (%)'],
                    total2: student['Attendance Total (%) 1'],
                    inPerson: student['Attendance In Person (%)'] || 'N/A',
                    online: student['Attendance Online (%)'] || 'N/A',
                },
            };
            
            console.log("Generated Certificate Data for", studentKey, ":", certificateData);
            if (pdfBytes) {
                generatedCertificates[studentKey] = { pdfBytes, certificateData };
            }
        }

        const progress = Math.round(((i + 1) / students.length) * 100);
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
    }

    progressBarContainer.classList.add('hidden');
}

export async function downloadCertificates() {
    const zip = new JSZip();

    for (const studentKey in generatedCertificates) {
        const { pdfBytes } = generatedCertificates[studentKey];
        if (pdfBytes) {
            const fileName = `${studentKey}_Certificate.pdf`;
            zip.file(fileName, pdfBytes);
        }
    }

    const zipContent = await zip.generateAsync({ type: "blob" });
    const zipBlob = new Blob([zipContent], { type: 'application/zip' });
    const zipUrl = URL.createObjectURL(zipBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = zipUrl;
    downloadLink.download = 'Certificates.zip';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = '';

    students.forEach((student, index) => {
        if (!student.Name) return;
        const button = document.createElement('button');
        button.textContent = `${student.Name} ${student.Surname}`;
        button.className = 'pagination-button';
        button.onclick = () => {
            currentFilter = index;
            renderPreview();
        };
        paginationContainer.appendChild(button);
    });

    // Set default filter to the first student on initial load
    if (students.length > 0) {
        currentFilter = 0;
    }
}

// Ajoutez cette fonction pour redimensionner dynamiquement les zones de texte
function resizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Modifiez cette fonction pour inclure l'appel à resizeTextarea
export async function saveStudentData(studentKey) {
    const studentDataDiv = document.querySelector('.student-data');
    const textareas = studentDataDiv.querySelectorAll('textarea');

    const updatedCertificateData = {};
    textareas.forEach(textarea => {
        const key = textarea.previousElementSibling.textContent.replace(':', '').trim();
        let value = textarea.value;
        try {
            value = JSON.parse(value);
        } catch (e) {
            // Garder la valeur en tant que chaîne de caractères si ce n'est pas un JSON valide
        }
        updatedCertificateData[key] = value;
    });

    const [studentName, studentSurname] = studentKey.split('_');
    const student = students.find(s => s.Name === studentName && s.Surname === studentSurname);

    if (student) {
        Object.keys(updatedCertificateData).forEach(key => {
            if (key in student) {
                student[key] = updatedCertificateData[key];
            }
        });

        titleText = updatedCertificateData['titleText'] || titleText;
        awardText = updatedCertificateData['awardText'] || awardText;
        customTextLines = Array.isArray(updatedCertificateData['customTextLines']) ? updatedCertificateData['customTextLines'] : customTextLines;
        certificateType = updatedCertificateData['certificateType'] || certificateType;

        const pdfBytes = await createCertificate(student, backgroundPdf, boldFontBytes, semiBoldFontBytes, lightFontBytes, graduationDate, startDay, lastDay, season, year, isDS, titleText, awardText, customTextLines, certificateType);

        generatedCertificates[studentKey] = {
            pdfBytes,
            certificateData: updatedCertificateData
        };

        console.log("Données du certificat mises à jour pour", studentKey, ":", updatedCertificateData);

        await renderPreview();

        alert('Données de l\'étudiant enregistrées et certificat régénéré avec succès !');
    } else {
        alert('Étudiant non trouvé !');
    }
}

async function renderPreview() {
    const studentInfo = document.getElementById('studentInfo');
    const previewList = document.getElementById('previewList');

    studentInfo.innerHTML = '';
    previewList.innerHTML = '';

    if (currentFilter >= 0 && currentFilter < students.length) {
        const student = students[currentFilter];
        const studentKey = `${student.Name}_${student.Surname}`;
        const certificateData = generatedCertificates[studentKey]?.certificateData;
        const pdfBytes = generatedCertificates[studentKey]?.pdfBytes;

        if (pdfBytes) {
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);

            const iframe = document.createElement('iframe');
            iframe.src = pdfUrl;
            iframe.width = '100%';
            iframe.height = '500px';

            previewList.appendChild(iframe);
        }

        if (certificateData) {
            const studentDataDiv = document.createElement('div');
            studentDataDiv.className = 'student-data';

            const excludedFields = ['studentName', 'score', 'attendance'];

            const leftColumnHtml = Object.entries(certificateData)
                .filter(([key, value]) => !excludedFields.includes(key) && (key === 'titleText' || key === 'awardText'))
                .map(([key, value]) =>
                    `<p><strong>${key}:</strong> <textarea oninput="resizeTextarea(this)">${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</textarea></p>`
                ).join('');

            const rightColumnHtml = Object.entries(certificateData)
                .filter(([key, value]) => !excludedFields.includes(key) && key !== 'titleText' && key !== 'awardText')
                .map(([key, value]) =>
                    `<p><strong>${key}:</strong> <textarea oninput="resizeTextarea(this)">${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</textarea></p>`
                ).join('');

            studentDataDiv.innerHTML =
                `<h3>${studentKey}</h3>
                <div class="student-data-container">
                    <div class="student-data-left">
                        ${leftColumnHtml}
                    </div>
                    <div class="student-data-right">
                        ${rightColumnHtml}
                        <button onclick="saveStudentData('${studentKey}')">Save</button>
                    </div>
                </div>`;

            studentInfo.appendChild(studentDataDiv);

            // Redimensionner toutes les zones de texte initialement
            studentDataDiv.querySelectorAll('textarea').forEach(textarea => {
                resizeTextarea(textarea);
            });
        }
    }
}


// Ajoutez cette ligne pour que resizeTextarea soit accessible dans le contexte global
window.resizeTextarea = resizeTextarea;