import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {afterEach, describe, expect, it} from 'vitest';

// fs-http captures the axios adapter when the family http service is created,
// so the mock adapter is installed before the store module is imported.
const mock = new MockAdapter(axios);
const {familySetStoreModule} = await import('@app/stores/familySetStore');

const fetchedSet = {id: 7, set_id: 75192, quantity: 1, status: 'built', purchase_date: null, notes: null};

describe('familySetStoreModule', () => {
    afterEach(() => {
        mock.reset();
        localStorage.clear();
    });

    it('should draft a new family set with sealed, single-copy defaults', () => {
        // Act
        const draft = familySetStoreModule.generateNew();

        // Assert
        expect(draft.mutable.value).toStrictEqual({
            setId: 0,
            setNum: '',
            quantity: 1,
            status: 'sealed',
            purchaseDate: null,
            notes: null,
        });
    });

    it('should create a drafted family set against the family-sets endpoint', async () => {
        // Arrange
        mock.onPost('family-sets').reply(200, fetchedSet);
        const draft = familySetStoreModule.generateNew();
        draft.mutable.value.setNum = '75192-1';

        // Act
        const created = await draft.create();

        // Assert
        expect(created.id).toBe(7);
        expect(JSON.parse(mock.history.post[0]?.data as string)).toMatchObject({set_num: '75192-1', status: 'sealed'});
    });

    it('should adapt a retrieved family set for editing against its own url', async () => {
        // Arrange
        mock.onGet('family-sets').reply(200, [fetchedSet]);
        mock.onPut('family-sets/7').reply(200, {...fetchedSet, quantity: 2});
        await familySetStoreModule.retrieveAll();
        const adapted = await familySetStoreModule.getOrFailById(7);

        // Act
        adapted.mutable.value.quantity = 2;
        const updated = await adapted.update();

        // Assert
        expect(adapted.status).toBe('built');
        expect(updated.quantity).toBe(2);
        expect(JSON.parse(mock.history.put[0]?.data as string)).toMatchObject({id: 7, quantity: 2});
    });
});
