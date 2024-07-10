import { generateCertificate } from './generateCertificate.js';
import { updateBackgroundName } from './updateBackgroundName.js';
import { updateCustomBackgroundName } from './updateCustomBackgroundName.js';

window.generateCertificate = generateCertificate;
window.updateBackgroundName = updateBackgroundName;
window.updateCustomBackgroundName = updateCustomBackgroundName;

export function main() {
    generateCertificate();
}
