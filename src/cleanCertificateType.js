export function cleanCertificateType(certificateType) {
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
