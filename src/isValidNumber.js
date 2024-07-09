// Checks if a given value is a valid number after replacing commas with periods
export function isValidNumber(value) {
    value = value.replace(',', '.');
    return !isNaN(value) && !/[a-zA-Z]/.test(value);
}