/**
 * Generate a CSV string from rows of data.
 */
const escape = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
};

export const toCsv = (headers: string[], rows: string[][]): string => {
    const lines = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))];

    return lines.join('\n');
};

/**
 * Trigger a CSV file download in the browser.
 */
export const downloadCsv = (csv: string, filename: string): void => {
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
