// Adds a specified number of weeks to a date string and returns the new date
export function addWeeks(dateString, weeks) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + (weeks * 7));
    return date.toISOString().split('T')[0];
}