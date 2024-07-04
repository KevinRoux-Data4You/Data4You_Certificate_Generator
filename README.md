# Certificate Generation Script

This script generates personalized certificates for students based on the provided CSV file. The certificates are customized according to the course (Data Science or Web Development) and include relevant details such as student names, attendance percentages, and other specific data.

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
3. [Functions](#functions)
4. [Dependencies](#dependencies)

## Installation

1. Clone the repository or download the script.
2. Ensure you have a web server to serve the HTML and JS files.

## Usage

1. Upload the CSV file containing student data.
2. Select the graduation date, start date, and last date.
3. Click on the button to generate certificates.
4. Download the generated ZIP file containing all the certificates.

## Functions

### `generateCertificate()`

This is the main function that orchestrates the certificate generation process. It handles the following steps:

- Gets the CSV file input, graduation date, start day, and last day from the web interface.
- Parses the CSV file to extract student data.
- Determines the course type (Data Science or Web Development) based on the file name.
- Fetches the appropriate background PDF and font files.
- Generates certificates for each student and adds them to a ZIP file.
- Updates the progress bar to reflect the generation status.
- Creates a download link for the ZIP file containing the certificates.

### `extractSeasonAndYear(fileName)`

Extracts the season and year from the file name using a regex pattern.

### `parseCSV(text, isDS)`

Parses the CSV text to extract student data. Handles different parsing logic for Data Science and Web Development courses.

### `cleanCertificateType(certificateType)`

Cleans and formats the certificate type string by removing unnecessary words and ensuring proper capitalization.

### `formatDate(dateString)`

Formats a date string into a readable format (e.g., "1 January 2024").

### `isValidNumber(value)`

Checks if a given value is a valid number after replacing commas with periods.

### `addWeeks(dateString, weeks)`

Adds a specified number of weeks to a date string and returns the new date.

### `createCertificate(student, pdfTemplateBytes, boldFontBytes, semiBoldFontBytes, lightFontBytes, graduationDate, startDay, lastDay, season, year, isDS)`

Creates a personalized certificate for a student using the provided template and font files. Handles drawing text and other elements on the PDF.

## Dependencies

- [PDFLib](https://pdf-lib.js.org/) - Library for creating and modifying PDF documents.
- [JSZip](https://stuk.github.io/jszip/) - Library for creating ZIP files.
- [PapaParse](https://www.papaparse.com/) - Library for parsing CSV files.
- [FontKit](https://github.com/foliojs/fontkit) - Font library used with PDFLib.
