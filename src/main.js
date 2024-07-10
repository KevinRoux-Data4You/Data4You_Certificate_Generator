
import { generateCertificate } from './generateCertificate.js';
import { updateBackgroundName } from './updateBackgroundName.js';
import { updateCustomBackgroundName } from './updateCustomBackgroundName.js';
import { resetBackground } from './resetBackground.js';

window.generateCertificate = generateCertificate;
window.updateBackgroundName = updateBackgroundName;
window.updateCustomBackgroundName = updateCustomBackgroundName;
window.resetBackground = resetBackground;

export function main() {
    generateCertificate();
}
