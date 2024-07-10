
export function updateCustomBackgroundName() {
    const backgroundFile = document.getElementById('backgroundFile').files[0];
    const defaultBackgroundName = document.getElementById('BackgroundName');

    if (backgroundFile) {
        defaultBackgroundName.textContent = `Custom background: ${backgroundFile.name}`;
    } else {
        defaultBackgroundName.textContent = 'Custom background: None';
    }
}
