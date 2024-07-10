import { createCertificate } from './createCertificate.js';
import { extractSeasonAndYear } from './extractSeasonAndYear.js';
import { parseCSV } from './parseCSV.js';

export async function generateCertificate() {
    const csvFile = document.getElementById('csvFile').files[0];
    const backgroundFile = document.getElementById('backgroundFile').files[0];
    const graduationDate = document.getElementById('graduationDate').value;
    const startDay = document.getElementById('startDay').value;
    const lastDay = document.getElementById('lastDay').value;

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
    const isDS = fileName.includes('DS');
    const students = parseCSV(csvText, isDS);

    if (students.length === 0) {
        alert("No student data found in the CSV.");
        return;
    }

    const seasonAndYear = extractSeasonAndYear(fileName);
    const season = seasonAndYear.season;
    const year = seasonAndYear.year;

    let backgroundPdf;

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

    try {
        progressBarContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';

        const [boldFontBytes, semiBoldFontBytes, lightFontBytes] = await Promise.all([
            fetch('Police/Montserrat-Bold.ttf').then(res => res.arrayBuffer()),
            fetch('Police/Montserrat-SemiBold.ttf').then(res => res.arrayBuffer()),
            fetch('Police/Montserrat-ExtraLight.ttf').then(res => res.arrayBuffer())
        ]);

        const zip = new JSZip();
        const totalStudents = students.length;

        for (let i = 0; i < totalStudents; i++) {
            const student = students[i];
            const pdfBytes = await createCertificate(student, backgroundPdf, boldFontBytes, semiBoldFontBytes, lightFontBytes, graduationDate, startDay, lastDay, season, year, isDS);
            if (pdfBytes) {
                const fileName = `${student.Name}_${student.Surname}_Certificate.pdf`;
                zip.file(fileName, pdfBytes);
            }

            const progress = Math.round(((i + 1) / totalStudents) * 100);
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
    } catch (error) {
        console.error("Error creating certificates:", error);
        progressBarContainer.classList.add('hidden');
    }

    students.forEach(student => {
        console.log(student);
    });
}


export async function previewCertificate() {
    const csvFile = document.getElementById('csvFile').files[0];
    const backgroundFile = document.getElementById('backgroundFile').files[0];
    const graduationDate = document.getElementById('graduationDate').value;
    const startDay = document.getElementById('startDay').value;
    const lastDay = document.getElementById('lastDay').value;

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
    const isDS = fileName.includes('DS');
    const students = parseCSV(csvText, isDS);

    if (students.length === 0) {
        alert("No student data found in the CSV.");
        return;
    }

    const seasonAndYear = extractSeasonAndYear(fileName);
    const season = seasonAndYear.season;
    const year = seasonAndYear.year;

    let backgroundPdf;

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

    try {
        const [boldFontBytes, semiBoldFontBytes, lightFontBytes] = await Promise.all([
            fetch('Police/Montserrat-Bold.ttf').then(res => res.arrayBuffer()),
            fetch('Police/Montserrat-SemiBold.ttf').then(res => res.arrayBuffer()),
            fetch('Police/Montserrat-ExtraLight.ttf').then(res => res.arrayBuffer())
        ]);

        const student = students[0];
        const pdfBytes = await createCertificate(student, backgroundPdf, boldFontBytes, semiBoldFontBytes, lightFontBytes, graduationDate, startDay, lastDay, season, year, isDS);
        
        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const previewList = document.getElementById('previewList');
            previewList.innerHTML = `<div class="preview-item"><iframe src="${url}"></iframe></div>`;
        }
    } catch (error) {
        console.error("Error creating preview certificate:", error);
    }
}