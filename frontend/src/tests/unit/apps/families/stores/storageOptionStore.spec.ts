import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {afterEach, describe, expect, it} from 'vitest';

// fs-http captures the axios adapter when the family http service is created,
// so the mock adapter is installed before the store module is imported.
const mock = new MockAdapter(axios);
const {storageOptionStoreModule} = await import('@app/stores/storageOptionStore');

const fetchedOption = {
    id: 3,
    name: 'Red drawer',
    description: null,
    parent_id: null,
    row: null,
    column: null,
    grid_rows: 4,
    grid_columns: 6,
    child_ids: [],
};

describe('storageOptionStoreModule', () => {
    afterEach(() => {
        mock.reset();
        localStorage.clear();
    });

    it('should draft a new top-level storage option with no grid', () => {
        // Act
        const draft = storageOptionStoreModule.generateNew();

        // Assert
        expect(draft.mutable.value).toStrictEqual({
            name: '',
            description: null,
            parentId: null,
            row: null,
            column: null,
            gridRows: null,
            gridColumns: null,
            childIds: [],
        });
    });

    it('should create a drafted storage option against the storage-options endpoint', async () => {
        // Arrange
        mock.onPost('storage-options').reply(200, fetchedOption);
        const draft = storageOptionStoreModule.generateNew();
        draft.mutable.value.name = 'Red drawer';

        // Act
        const created = await draft.create();

        // Assert
        expect(created.id).toBe(3);
        expect(JSON.parse(mock.history.post[0]?.data as string)).toMatchObject({name: 'Red drawer', parent_id: null});
    });

    it('should adapt a retrieved storage option for editing against its own url', async () => {
        // Arrange
        mock.onGet('storage-options').reply(200, [fetchedOption]);
        mock.onPut('storage-options/3').reply(200, {...fetchedOption, name: 'Blue drawer'});
        await storageOptionStoreModule.retrieveAll();
        const adapted = await storageOptionStoreModule.getOrFailById(3);

        // Act
        adapted.mutable.value.name = 'Blue drawer';
        const updated = await adapted.update();

        // Assert
        expect(adapted.gridRows).toBe(4);
        expect(updated.name).toBe('Blue drawer');
        expect(JSON.parse(mock.history.put[0]?.data as string)).toMatchObject({id: 3, name: 'Blue drawer'});
    });
});
