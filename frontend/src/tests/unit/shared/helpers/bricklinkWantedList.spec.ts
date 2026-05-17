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
    });

    describe('downloadBrickLinkWantedList', () => {
        it('creates a blob URL, triggers a click, and revokes the URL', () => {
            // Arrange
            const mockClick = vi.fn<() => void>();
            const mockCreateElement = vi
                .spyOn(document, 'createElement')
                .mockReturnValue({
                    set href(_: string) {},
                    set download(_: string) {},
                    click: mockClick,
                } as unknown as HTMLAnchorElement);
            const mockCreateObjectURL = vi.fn<(obj: Blob) => string>().mockReturnValue('blob:bricklink-test');
            const mockRevokeObjectURL = vi.fn<(url: string) => void>();
            globalThis.URL.createObjectURL = mockCreateObjectURL;
            globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

            // Act
            downloadBrickLinkWantedList('<INVENTORY></INVENTORY>', 'wanted.xml');

            // Assert
            expect(mockCreateElement).toHaveBeenCalledWith('a');
            expect(mockClick).toHaveBeenCalled();
            expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:bricklink-test');

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
