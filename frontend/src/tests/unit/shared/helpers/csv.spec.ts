import {downloadCsv, exportCsv, toCsv} from '@shared/helpers/csv';
import {describe, expect, it, vi} from 'vitest';

describe('toCsv', () => {
    it('should generate CSV with headers and rows', () => {
        // Arrange
        const headers = ['Name', 'Quantity'];
        const rows = [
            ['Brick 2 x 4', '10'],
            ['Plate 1 x 2', '5'],
        ];

        // Act
        const result = toCsv(headers, rows);

        // Assert
        expect(result).toBe('Name,Quantity\nBrick 2 x 4,10\nPlate 1 x 2,5');
    });

    it('should escape values containing commas', () => {
        // Arrange
        const headers = ['Name'];
        const rows = [['Brick, red']];

        // Act
        const result = toCsv(headers, rows);

        // Assert
        expect(result).toBe('Name\n"Brick, red"');
    });

    it('should escape values containing quotes', () => {
        // Arrange
        const headers = ['Notes'];
        const rows = [['He said "hello"']];

        // Act
        const result = toCsv(headers, rows);

        // Assert
        expect(result).toBe('Notes\n"He said ""hello"""');
    });

    it('should handle empty rows', () => {
        // Arrange
        const headers = ['Name', 'Quantity'];
        const rows: string[][] = [];

        // Act
        const result = toCsv(headers, rows);

        // Assert
        expect(result).toBe('Name,Quantity');
    });
});

describe('downloadCsv', () => {
    it('should create a download link and click it', async () => {
        // Arrange
        const mockClick = vi.fn<() => void>();
        const mockCreateElement = vi
            .spyOn(document, 'createElement')
            .mockReturnValue({
                set href(_: string) {},
                set download(_: string) {},
                click: mockClick,
            } as unknown as HTMLAnchorElement);
        let capturedBlob: Blob | null = null;
        const mockCreateObjectURL = vi.fn<(obj: Blob) => string>().mockImplementation((blob) => {
            capturedBlob = blob;
            return 'blob:test';
        });
        const mockRevokeObjectURL = vi.fn<(url: string) => void>();
        globalThis.URL.createObjectURL = mockCreateObjectURL;
        globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

        // Act
        downloadCsv('Name,Qty\nBrick,10', 'test.csv');

        // Assert
        expect(mockCreateElement).toHaveBeenCalledWith('a');
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test');
        expect(capturedBlob).not.toBeNull();
        const blob = capturedBlob as unknown as Blob;
        expect(blob.type).toBe('text/csv;charset=utf-8;');
        expect(await blob.text()).toBe('Name,Qty\nBrick,10');

        mockCreateElement.mockRestore();
    });
});

describe('exportCsv', () => {
    it('should build the CSV from headers and rows and trigger the download', async () => {
        // Arrange
        const mockClick = vi.fn<() => void>();
        let capturedDownload = '';
        const mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue({
            set href(_: string) {},
            set download(filename: string) {
                capturedDownload = filename;
            },
            click: mockClick,
        } as unknown as HTMLAnchorElement);
        let capturedBlob: Blob | null = null;
        const mockCreateObjectURL = vi.fn<(obj: Blob) => string>().mockImplementation((blob) => {
            capturedBlob = blob;
            return 'blob:test';
        });
        const mockRevokeObjectURL = vi.fn<(url: string) => void>();
        globalThis.URL.createObjectURL = mockCreateObjectURL;
        globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

        // Act
        exportCsv(['Name', 'Qty'], [['Brick', '10']], 'parts.csv');

        // Assert
        expect(mockClick).toHaveBeenCalled();
        expect(capturedDownload).toBe('parts.csv');
        expect(capturedBlob).not.toBeNull();
        const blob = capturedBlob as unknown as Blob;
        expect(await blob.text()).toBe('Name,Qty\nBrick,10');

        mockCreateElement.mockRestore();
    });
});
