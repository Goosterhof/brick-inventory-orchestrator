import type {MasterShoppingListEntry} from '@app/types/part';
import type {HttpService} from '@script-development/fs-http';

import {
    compareMissingPartsEntries,
    MISSING_PARTS_SORT_FIELDS,
    useMissingPartsFeed,
} from '@app/domains/parts/composables/useMissingPartsFeed';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const mockGetRequest = vi.fn<() => Promise<unknown>>();

const httpService = {getRequest: mockGetRequest} as unknown as HttpService;

const makeEntry = (overrides: Partial<MasterShoppingListEntry> = {}): MasterShoppingListEntry => ({
    partId: 100,
    partNum: '3001',
    colorId: 4,
    partName: 'Brick 2 x 4',
    colorName: 'Red',
    colorHex: 'C91A09',
    partImageUrl: 'https://example.com/3001.jpg',
    quantityNeeded: 10,
    quantityStored: 3,
    shortfall: 7,
    neededBySetNums: ['75313-1', '10497-1'],
    ...overrides,
});

const makePayload = (shortfalls: MasterShoppingListEntry[] = [makeEntry()], unknownFamilySetIds: string[] = []) => ({
    data: {shortfalls, unknownFamilySetIds},
});

describe('useMissingPartsFeed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should start in the loading state so pages can fetch on mount without a flash', () => {
        // Act
        const feed = useMissingPartsFeed(httpService);

        // Assert
        expect(feed.loading.value).toBe(true);
        expect(feed.entries.value).toStrictEqual([]);
    });

    it('should populate entries and unknown set ids on a successful fetch', async () => {
        // Arrange
        const entry = makeEntry();
        mockGetRequest.mockResolvedValue(makePayload([entry], ['abc']));
        const feed = useMissingPartsFeed(httpService);

        // Act
        await feed.fetchMissingParts();

        // Assert
        expect(mockGetRequest).toHaveBeenCalledWith('/family-sets/missing-parts');
        expect(feed.entries.value).toStrictEqual([entry]);
        expect(feed.unknownFamilySetIds.value).toStrictEqual(['abc']);
        expect(feed.loading.value).toBe(false);
        expect(feed.loadError.value).toBe(false);
    });

    it('should reset state and flag the error when the fetch fails', async () => {
        // Arrange
        mockGetRequest.mockResolvedValueOnce(makePayload([makeEntry()], ['abc']));
        mockGetRequest.mockRejectedValueOnce(new Error('Network error'));
        const feed = useMissingPartsFeed(httpService);
        await feed.fetchMissingParts();

        // Act
        await feed.fetchMissingParts();

        // Assert
        expect(feed.entries.value).toStrictEqual([]);
        expect(feed.unknownFamilySetIds.value).toStrictEqual([]);
        expect(feed.loading.value).toBe(false);
        expect(feed.loadError.value).toBe(true);
    });

    it('should total the shortfall across all entries', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue(makePayload([makeEntry({shortfall: 3}), makeEntry({shortfall: 4})]));
        const feed = useMissingPartsFeed(httpService);

        // Act
        await feed.fetchMissingParts();

        // Assert
        expect(feed.totalShortfall.value).toBe(7);
    });

    it('should count distinct affected sets across entries', async () => {
        // Arrange
        mockGetRequest.mockResolvedValue(
            makePayload([
                makeEntry({neededBySetNums: ['75313-1', '10497-1']}),
                makeEntry({neededBySetNums: ['10497-1', '21034-1']}),
            ]),
        );
        const feed = useMissingPartsFeed(httpService);

        // Act
        await feed.fetchMissingParts();

        // Assert
        expect(feed.affectedSetCount.value).toBe(3);
    });
});

describe('compareMissingPartsEntries', () => {
    it('should sort by shortfall descending', () => {
        // Arrange
        const small = makeEntry({shortfall: 2});
        const large = makeEntry({shortfall: 9});

        // Assert
        expect([small, large].sort((a, b) => compareMissingPartsEntries(a, b, 'shortfall'))).toStrictEqual([
            large,
            small,
        ]);
    });

    it('should sort by part name ascending', () => {
        // Arrange
        const brick = makeEntry({partName: 'Brick 2 x 4'});
        const plate = makeEntry({partName: 'Plate 1 x 2'});

        // Assert
        expect([plate, brick].sort((a, b) => compareMissingPartsEntries(a, b, 'name'))).toStrictEqual([brick, plate]);
    });

    it('should sort by color name ascending', () => {
        // Arrange
        const blue = makeEntry({colorName: 'Blue'});
        const red = makeEntry({colorName: 'Red'});

        // Assert
        expect([red, blue].sort((a, b) => compareMissingPartsEntries(a, b, 'color'))).toStrictEqual([blue, red]);
    });
});

describe('MISSING_PARTS_SORT_FIELDS', () => {
    it('should keep the chip render order both pages shipped with', () => {
        expect(MISSING_PARTS_SORT_FIELDS).toStrictEqual(['shortfall', 'name', 'color']);
    });
});
