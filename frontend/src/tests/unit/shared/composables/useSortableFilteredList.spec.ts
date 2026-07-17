import {useSortableFilteredList} from '@shared/composables/useSortableFilteredList';
import {describe, expect, it} from 'vitest';
import {computed, ref} from 'vue';

interface Part {
    name: string;
    num: string;
    quantity: number;
}

type Field = 'name' | 'quantity';

const brick = (name: string, num: string, quantity: number): Part => ({name, num, quantity});

const setup = (items: Part[], filter?: (item: Part) => boolean) => {
    const source = ref(items);
    const list = useSortableFilteredList({
        items: source,
        fields: ['name', 'quantity'] as const,
        defaultField: 'name',
        sortLabelKey: {name: 'sort.name', quantity: 'sort.quantity'},
        compare: (a, b, field: Field) => {
            if (field === 'name') {
                return a.name.localeCompare(b.name);
            }
            return b.quantity - a.quantity;
        },
        searchText: (item) => [item.name, item.num],
        filter,
    });
    return {source, ...list};
};

describe('useSortableFilteredList', () => {
    it('should sort by the default field initially', () => {
        // Arrange
        const {activeSortField, filteredItems} = setup([
            brick('Plate 1 x 2', '3023', 5),
            brick('Brick 2 x 4', '3001', 10),
        ]);

        // Assert
        expect(activeSortField.value).toBe('name');
        expect(filteredItems.value.map((item) => item.num)).toStrictEqual(['3001', '3023']);
    });

    it('should re-sort when setSortField activates another field', () => {
        // Arrange
        const {setSortField, activeSortField, filteredItems} = setup([
            brick('Brick 2 x 4', '3001', 10),
            brick('Plate 1 x 2', '3023', 50),
        ]);

        // Act
        setSortField('quantity');

        // Assert
        expect(activeSortField.value).toBe('quantity');
        expect(filteredItems.value.map((item) => item.num)).toStrictEqual(['3023', '3001']);
    });

    it('should filter case-insensitively across all search text fragments', () => {
        // Arrange
        const {searchQuery, filteredItems} = setup([
            brick('Brick 2 x 4', '3001', 10),
            brick('Plate 1 x 2', '3023', 5),
            brick('Tile 1 x 1', 'BRICKISH', 1),
        ]);

        // Act — matches "Brick 2 x 4" by name and "Tile 1 x 1" by part number.
        searchQuery.value = 'bRiCk';

        // Assert
        expect(filteredItems.value.map((item) => item.name)).toStrictEqual(['Brick 2 x 4', 'Tile 1 x 1']);
    });

    it('should treat a whitespace-only query as no search filter', () => {
        // Arrange
        const {searchQuery, filteredItems} = setup([brick('Brick 2 x 4', '3001', 10), brick('Plate 1 x 2', '3023', 5)]);

        // Act
        searchQuery.value = '   ';

        // Assert
        expect(filteredItems.value).toHaveLength(2);
    });

    it('should apply the extra filter predicate when provided', () => {
        // Arrange
        const {filteredItems} = setup(
            [brick('Brick 2 x 4', '3001', 10), brick('Plate 1 x 2', '3023', 5)],
            (item) => item.quantity > 5,
        );

        // Assert
        expect(filteredItems.value.map((item) => item.num)).toStrictEqual(['3001']);
    });

    it('should combine search query and extra filter', () => {
        // Arrange
        const {searchQuery, filteredItems} = setup(
            [brick('Brick 2 x 4', '3001', 10), brick('Brick 1 x 1', '3005', 2), brick('Plate 1 x 2', '3023', 9)],
            (item) => item.quantity > 5,
        );

        // Act
        searchQuery.value = 'brick';

        // Assert
        expect(filteredItems.value.map((item) => item.num)).toStrictEqual(['3001']);
    });

    it('should not mutate the source list when sorting', () => {
        // Arrange
        const {source, filteredItems} = setup([brick('Plate 1 x 2', '3023', 5), brick('Brick 2 x 4', '3001', 10)]);

        // Act
        expect(filteredItems.value.map((item) => item.num)).toStrictEqual(['3001', '3023']);

        // Assert — the source keeps its insertion order.
        expect(source.value.map((item) => item.num)).toStrictEqual(['3023', '3001']);
    });

    it('should recompute when the source list changes', () => {
        // Arrange
        const {source, filteredItems} = setup([brick('Plate 1 x 2', '3023', 5)]);
        expect(filteredItems.value).toHaveLength(1);

        // Act
        source.value = [...source.value, brick('Brick 2 x 4', '3001', 10)];

        // Assert
        expect(filteredItems.value.map((item) => item.num)).toStrictEqual(['3001', '3023']);
    });

    it('should accept a computed source', () => {
        // Arrange
        const raw = ref([brick('Plate 1 x 2', '3023', 5), brick('Brick 2 x 4', '3001', 10)]);
        const source = computed(() => raw.value);
        const {filteredItems} = useSortableFilteredList({
            items: source,
            fields: ['name'] as const,
            defaultField: 'name',
            sortLabelKey: {name: 'sort.name'},
            compare: (a, b) => a.name.localeCompare(b.name),
            searchText: (item) => [item.name],
        });

        // Assert
        expect(filteredItems.value.map((item) => item.num)).toStrictEqual(['3001', '3023']);
    });

    it('should expose the sort fields and label keys for chip rendering', () => {
        // Arrange
        const {allSortFields, sortLabelKey} = setup([]);

        // Assert
        expect(allSortFields).toStrictEqual(['name', 'quantity']);
        expect(sortLabelKey).toStrictEqual({name: 'sort.name', quantity: 'sort.quantity'});
    });
});
