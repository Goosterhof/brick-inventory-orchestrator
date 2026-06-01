import type {BrickLinkWantedListEntry} from '@shared/helpers/bricklinkWantedList';

import {downloadBrickLinkWantedList, toBrickLinkWantedListXml} from '@shared/helpers/bricklinkWantedList';
import {describe, expect, it, vi} from 'vitest';

describe('bricklinkWantedList', () => {
    describe('toBrickLinkWantedListXml', () => {
        it('wraps the entries in an <INVENTORY> root with the XML declaration', () => {
            // Act
            const xml = toBrickLinkWantedListXml([]);

            // Assert
            expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
            expect(xml).toContain('<INVENTORY>');
            expect(xml).toContain('</INVENTORY>');
        });

        it('emits the required ITEMTYPE, ITEMID and MINQTY fields for each entry', () => {
            // Arrange
            const entries: BrickLinkWantedListEntry[] = [{partNum: '3001', brickLinkColorId: 5, shortfall: 7}];

            // Act
            const xml = toBrickLinkWantedListXml(entries);

            // Assert
            expect(xml).toContain('<ITEMTYPE>P</ITEMTYPE>');
            expect(xml).toContain('<ITEMID>3001</ITEMID>');
            expect(xml).toContain('<MINQTY>7</MINQTY>');
            expect(xml).toContain('<COLOR>5</COLOR>');
        });

        it('omits the COLOR field when brickLinkColorId is null', () => {
            // Arrange
            const entries: BrickLinkWantedListEntry[] = [{partNum: '3001', brickLinkColorId: null, shortfall: 2}];

            // Act
            const xml = toBrickLinkWantedListXml(entries);

            // Assert
            expect(xml).not.toContain('<COLOR>');
            expect(xml).toContain('<ITEMID>3001</ITEMID>');
            expect(xml).toContain('<MINQTY>2</MINQTY>');
        });

        it('omits the COLOR field when brickLinkColorId is undefined', () => {
            // Arrange
            const entries: BrickLinkWantedListEntry[] = [{partNum: '3001', shortfall: 2}];

            // Act
            const xml = toBrickLinkWantedListXml(entries);

            // Assert
            expect(xml).not.toContain('<COLOR>');
        });

        it('skips entries with a non-positive shortfall (zero)', () => {
            // Arrange
            const entries: BrickLinkWantedListEntry[] = [
                {partNum: '3001', brickLinkColorId: 1, shortfall: 0},
                {partNum: '3002', brickLinkColorId: 2, shortfall: 3},
            ];

            // Act
            const xml = toBrickLinkWantedListXml(entries);

            // Assert
            expect(xml).not.toContain('<ITEMID>3001</ITEMID>');
            expect(xml).toContain('<ITEMID>3002</ITEMID>');
        });

        it('skips entries with a negative shortfall', () => {
            // Arrange
            const entries: BrickLinkWantedListEntry[] = [{partNum: '3001', shortfall: -1}];

            // Act
            const xml = toBrickLinkWantedListXml(entries);

            // Assert
            expect(xml).not.toContain('<ITEM>');
        });

        it('escapes XML-special characters in ITEMID so the payload stays well-formed', () => {
            // Arrange — a synthetic part number containing every escape-worthy glyph
            const entries: BrickLinkWantedListEntry[] = [{partNum: `<3&001>"'`, brickLinkColorId: 1, shortfall: 2}];

            // Act
            const xml = toBrickLinkWantedListXml(entries);

            // Assert
            expect(xml).toContain('<ITEMID>&lt;3&amp;001&gt;&quot;&apos;</ITEMID>');
        });

        it('renders multiple entries separated by newlines', () => {
            // Arrange
            const entries: BrickLinkWantedListEntry[] = [
                {partNum: '3001', brickLinkColorId: 1, shortfall: 1},
                {partNum: '3002', brickLinkColorId: 2, shortfall: 3},
            ];

            // Act
            const xml = toBrickLinkWantedListXml(entries);

            // Assert
            const itemCount = xml.split('<ITEM>').length - 1;
            expect(itemCount).toBe(2);
        });

        it('serialises a single coloured entry as the exact newline-delimited document', () => {
            // Arrange
            const entries: BrickLinkWantedListEntry[] = [{partNum: '3001', brickLinkColorId: 5, shortfall: 7}];

            // Act
            const xml = toBrickLinkWantedListXml(entries);

            // Assert — exact structure pins the newline joins (inner + outer) and the closing </ITEM> tag.
            expect(xml).toBe(
                [
                    '<?xml version="1.0" encoding="UTF-8"?>',
                    '<INVENTORY>',
                    '    <ITEM>',
                    '        <ITEMTYPE>P</ITEMTYPE>',
                    '        <ITEMID>3001</ITEMID>',
                    '        <COLOR>5</COLOR>',
                    '        <MINQTY>7</MINQTY>',
                    '    </ITEM>',
                    '</INVENTORY>',
                ].join('\n'),
            );
        });

        it('drops skipped entries entirely rather than leaving a blank line in the document', () => {
            // Arrange — a non-positive shortfall renders null and must be filtered out, not joined as an empty line.
            const entries: BrickLinkWantedListEntry[] = [
                {partNum: '3001', brickLinkColorId: 1, shortfall: 0},
                {partNum: '3002', brickLinkColorId: 2, shortfall: 3},
            ];

            // Act
            const xml = toBrickLinkWantedListXml(entries);

            // Assert — without the null-filter the skipped entry would inject a blank line here.
            expect(xml).toBe(
                [
                    '<?xml version="1.0" encoding="UTF-8"?>',
                    '<INVENTORY>',
                    '    <ITEM>',
                    '        <ITEMTYPE>P</ITEMTYPE>',
                    '        <ITEMID>3002</ITEMID>',
                    '        <COLOR>2</COLOR>',
                    '        <MINQTY>3</MINQTY>',
                    '    </ITEM>',
                    '</INVENTORY>',
                ].join('\n'),
            );
        });
    });

    describe('downloadBrickLinkWantedList', () => {
        it('creates a blob URL with the correct MIME type and content, triggers a click, and revokes the URL', async () => {
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
                return 'blob:bricklink-test';
            });
            const mockRevokeObjectURL = vi.fn<(url: string) => void>();
            globalThis.URL.createObjectURL = mockCreateObjectURL;
            globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

            // Act
            downloadBrickLinkWantedList('<INVENTORY></INVENTORY>', 'wanted.xml');

            // Assert
            expect(mockCreateElement).toHaveBeenCalledWith('a');
            expect(mockClick).toHaveBeenCalled();
            expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:bricklink-test');
            expect(capturedBlob).not.toBeNull();
            const blob = capturedBlob as unknown as Blob;
            expect(blob.type).toBe('application/xml;charset=utf-8;');
            expect(await blob.text()).toBe('<INVENTORY></INVENTORY>');

            mockCreateElement.mockRestore();
        });

        it("assigns the given filename to the anchor's download attribute", () => {
            // Arrange
            const recordedDownloads: string[] = [];
            const mockCreateElement = vi.spyOn(document, 'createElement').mockReturnValue({
                set href(_: string) {},
                set download(value: string) {
                    recordedDownloads.push(value);
                },
                click: vi.fn<() => void>(),
            } as unknown as HTMLAnchorElement);
            globalThis.URL.createObjectURL = vi.fn<(obj: Blob) => string>().mockReturnValue('blob:bricklink-test');
            globalThis.URL.revokeObjectURL = vi.fn<(url: string) => void>();

            // Act
            downloadBrickLinkWantedList('<INVENTORY></INVENTORY>', 'custom-name.xml');

            // Assert
            expect(recordedDownloads).toContain('custom-name.xml');
            mockCreateElement.mockRestore();
        });
    });
});
