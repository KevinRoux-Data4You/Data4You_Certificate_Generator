export function extractSeasonAndYear(fileName) {
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