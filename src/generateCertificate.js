import { createCertificate } from './createCertificate.js';
import { extractSeasonAndYear } from './extractSeasonAndYear.js';
import { parseCSV } from './parseCSV.js';

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

    if (isPreview) {
        if (students.length > 0) {
            currentFilter = 0; // Set currentFilter to the first student index
            await renderPreview();
        } else {
            alert("No student data available to preview.");
        }
    } else {
        progressBarContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';

        const zip = new JSZip();

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            if (!student.Name) continue;
            const pdfBytes = await createCertificate(student, backgroundPdf, boldFontBytes, semiBoldFontBytes, lightFontBytes, graduationDate, startDay, lastDay, season, year, isDS);
            if (pdfBytes) {
                const fileName = `${student.Name}_${student.Surname}_Certificate.pdf`;
                zip.file(fileName, pdfBytes);
            }

            const progress = Math.round(((i + 1) / students.length) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        }

        const zipContent = await zip.generateAsync({ type: "blob" });
        const zipBlob = new Blob([zipContent], { type: 'application/zip' });
        const zipUrl = URL.createObjectURL(zipBlob);

        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = 'Certificates.zip';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(zipUrl);

        progressBarContainer.classList.add('hidden');
    }
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

async function renderPreview() {
    const previewList = document.getElementById('previewList');
    previewList.innerHTML = ''; // Clear previous content before rendering

    if (currentFilter === -1 || !students[currentFilter] || !students[currentFilter].Name) {
        previewList.innerHTML = '<div class="preview-item">No student selected</div>';
        return;
    }

    const student = students[currentFilter];
    const pdfBytes = await createCertificate(student, backgroundPdf, boldFontBytes, semiBoldFontBytes, lightFontBytes, graduationDate, startDay, lastDay, season, year, isDS);
    if (pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `<iframe src="${url}"></iframe>`;
        previewList.appendChild(previewItem);
    }
}
