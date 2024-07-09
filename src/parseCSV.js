export function parseCSV(text, isDS) {
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
