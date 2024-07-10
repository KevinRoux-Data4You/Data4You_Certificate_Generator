export function resetBackground() {
    const backgroundInput = document.getElementById('backgroundFile');
    const defaultBackgroundName = document.getElementById('BackgroundName');
    
    // Clear the background file input
    backgroundInput.value = '';
    
    // Reset the background name text
    const csvFile = document.getElementById('csvFile').files[0];
    if (csvFile) {
        const fileName = csvFile.name;
        if (fileName.includes('WD')) {
            defaultBackgroundName.textContent = 'Default background: WD';
        } else if (fileName.includes('DS')) {
            defaultBackgroundName.textContent = 'Default background: DS';
        } else {
            defaultBackgroundName.textContent = 'Default background: Invalid file name';
        }
    } else {
        defaultBackgroundName.textContent = 'Default background: None';
    }
}