import { createCertificate } from './createCertificate.js';
import { extractSeasonAndYear } from './extractSeasonAndYear.js';
import { parseCSV } from './parseCSV.js';


export async function generateCertificate() {
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
