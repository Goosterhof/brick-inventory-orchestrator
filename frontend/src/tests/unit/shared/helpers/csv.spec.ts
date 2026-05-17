import {downloadCsv, toCsv} from '@shared/helpers/csv';
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
    it('should create a download link and click it', () => {
        // Arrange
        const mockClick = vi.fn<() => void>();
        const mockCreateElement = vi
            .spyOn(document, 'createElement')
            .mockReturnValue({
                set href(_: string) {},
                set download(_: string) {},
                click: mockClick,
            } as unknown as HTMLAnchorElement);
        const mockCreateObjectURL = vi.fn<(obj: Blob) => string>().mockReturnValue('blob:test');
        const mockRevokeObjectURL = vi.fn<(url: string) => void>();
        globalThis.URL.createObjectURL = mockCreateObjectURL;
        globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

        // Act
        downloadCsv('Name,Qty\nBrick,10', 'test.csv');

        // Assert
        expect(mockCreateElement).toHaveBeenCalledWith('a');
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:test');

        mockCreateElement.mockRestore();
    });
});
