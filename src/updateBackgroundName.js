
export function updateBackgroundName() {
    const csvFile = document.getElementById('csvFile').files[0];
    const defaultBackgroundName = document.getElementById('BackgroundName');

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
