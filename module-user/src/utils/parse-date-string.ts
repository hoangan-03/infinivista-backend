export function parseDateString(dateStr: string): Date | undefined {
    try {
        const [day, month, year] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? undefined : date;
    } catch {
        return undefined;
    }
}

export function formatStartDate(date: Date): string {
    // Format as YYYY-MM-DD
    return date.toISOString().split('T')[0];
}

export function formatAsDDMMYYYY(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
