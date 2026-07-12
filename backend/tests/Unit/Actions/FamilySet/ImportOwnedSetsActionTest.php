<?php

declare(strict_types = 1);

use App\Actions\FamilySet\ImportOwnedSetsAction;
use App\Actions\Sync\UpsertSetAction;
use App\Contracts\LegoDataServiceInterface;
use App\DataTransferObjects\Input\Lego\LegoSetData;
use App\DataTransferObjects\Input\Lego\RebrickableUserSetData;
use App\DataTransferObjects\Result\FamilySet\ImportOwnedSetsResultData;
use App\Enums\FamilySetStatus;
use App\Exceptions\InvalidApiResponseException;
use App\Exceptions\MissingRebrickableTokenException;
use App\Exceptions\RebrickableApiException;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\Set;
use GuzzleHttp\Psr7\Response as Psr7Response;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Client\Response as HttpResponse;

covers(ImportOwnedSetsAction::class);

describe('ImportOwnedSetsAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
    });

    it('should throw MissingRebrickableTokenException when family has no token', function(): void {
        // arrange — the token guard fires before any transaction is opened
        $this->db->shouldNotReceive('transaction');

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $familySetModel = \Mockery::mock(FamilySet::class);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn(null);

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act & assert
        expect(fn(): ImportOwnedSetsResultData => $action->execute($family))
            ->toThrow(MissingRebrickableTokenException::class);
    });

    it('should fetch user sets from the service using the family token', function(): void {
        // arrange — the generator yields no pages, so no transaction is opened
        $this->db->shouldNotReceive('transaction');

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->with(1, 'user-token-123')
            ->once()
            ->andReturnUsing(function(): \Generator {
                yield from [];
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $familySetModel = \Mockery::mock(FamilySet::class);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act
        $action->execute($family);

        // assert - Mockery expectations verify the interaction
    });

    it('should create new family sets for sets not already owned', function(): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $legoSetData = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: 'https://example.com/image.jpg',
        );
        $userSetData = new RebrickableUserSetData(set: $legoSetData, quantity: 2);

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andReturnUsing(function() use ($userSetData): \Generator {
                yield [$userSetData];
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')
            ->with($legoSetData)
            ->once()
            ->andReturn($set);

        $familySetSavedValues = [];
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$familySetSavedValues): void {
            $familySetSavedValues[$key] = $value;
        });
        $familySet->allows('getAttribute')->andReturnUsing(function($key) use (&$familySetSavedValues): mixed {
            return $familySetSavedValues[$key] ?? null;
        });
        $familySet->shouldReceive('save')->once();

        // Single query to preload all existing family sets
        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 1)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('set_id', [42])->andReturnSelf();
        $queryBuilder->shouldReceive('get')->andReturn(new Collection([]));

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $familySetModel->shouldReceive('newInstance')->andReturn($familySet);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act
        $action->execute($family);

        // assert
        expect($familySetSavedValues['family_id'])->toBe(1);
        expect($familySetSavedValues['set_id'])->toBe(42);
        expect($familySetSavedValues['quantity'])->toBe(2);
        expect($familySetSavedValues['status'])->toBe(FamilySetStatus::Sealed);
    });

    it('should update quantity for existing family sets when exactly one exists', function(): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $legoSetData = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: 'https://example.com/image.jpg',
        );
        $userSetData = new RebrickableUserSetData(set: $legoSetData, quantity: 3);

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $existingSavedValues = ['set_id' => 42, 'quantity' => 1];
        $existingFamilySet = \Mockery::mock(FamilySet::class);
        $existingFamilySet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$existingSavedValues): void {
            $existingSavedValues[$key] = $value;
        });
        $existingFamilySet->allows('getAttribute')->andReturnUsing(function($key) use (&$existingSavedValues): mixed {
            return $existingSavedValues[$key] ?? null;
        });
        $existingFamilySet->shouldReceive('save')->once();

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andReturnUsing(function() use ($userSetData): \Generator {
                yield [$userSetData];
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')->andReturn($set);

        // Single query returns the one existing family set
        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 1)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('set_id', [42])->andReturnSelf();
        $queryBuilder->shouldReceive('get')->andReturn(new Collection([$existingFamilySet]));

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $familySetModel->shouldReceive('newInstance')->never();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act
        $action->execute($family);

        // assert
        expect($existingSavedValues['quantity'])->toBe(3);
    });

    it('should return correct counts for created and updated sets', function(): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $legoSetData1 = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: null,
        );
        $legoSetData2 = new LegoSetData(
            setNum: '10179-1',
            name: 'Ultimate Collectors Millennium Falcon',
            year: 2_007,
            themeId: 158,
            numParts: 5_195,
            imageUrl: null,
        );
        $userSetData1 = new RebrickableUserSetData(set: $legoSetData1, quantity: 1);
        $userSetData2 = new RebrickableUserSetData(set: $legoSetData2, quantity: 2);

        $set1 = \Mockery::mock(Set::class);
        $set1->allows('getAttribute')->with('id')->andReturn(1);

        $set2 = \Mockery::mock(Set::class);
        $set2->allows('getAttribute')->with('id')->andReturn(2);

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andReturnUsing(function() use ($userSetData1, $userSetData2): \Generator {
                yield [$userSetData1, $userSetData2];
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')->with($legoSetData1)->andReturn($set1);
        $upsertSetAction->shouldReceive('execute')->with($legoSetData2)->andReturn($set2);

        // One existing family set for set1
        $existingFamilySet = \Mockery::mock(FamilySet::class);
        $existingFamilySet->allows('getAttribute')->with('set_id')->andReturn(1);
        $existingFamilySet->allows('setAttribute');
        $existingFamilySet->shouldReceive('save');

        $newFamilySet = \Mockery::mock(FamilySet::class);
        $newFamilySet->allows('setAttribute');
        $newFamilySet->allows('getAttribute');
        $newFamilySet->shouldReceive('save');

        // Single query returns only the existing family set for set1
        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 1)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('set_id', [1, 2])->andReturnSelf();
        $queryBuilder->shouldReceive('get')->andReturn(new Collection([$existingFamilySet]));

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $familySetModel->shouldReceive('newInstance')->once()->andReturn($newFamilySet);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act
        $result = $action->execute($family);

        // assert
        expect($result)->toBeInstanceOf(ImportOwnedSetsResultData::class);
        expect($result->created)->toBe(1);
        expect($result->updated)->toBe(1);
        expect($result->skipped)->toBe(0);
        expect($result->total)->toBe(2);
        expect($result->complete)->toBeTrue();
        expect($result->error)->toBeNull();
    });

    it('should return zero counts when no sets are found', function(): void {
        // arrange — the generator yields no pages, so no transaction is opened
        $this->db->shouldNotReceive('transaction');

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andReturnUsing(function(): \Generator {
                yield from [];
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $familySetModel = \Mockery::mock(FamilySet::class);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act
        $result = $action->execute($family);

        // assert
        expect($result->created)->toBe(0);
        expect($result->updated)->toBe(0);
        expect($result->skipped)->toBe(0);
        expect($result->total)->toBe(0);
        expect($result->complete)->toBeTrue();
        expect($result->error)->toBeNull();
        expect($result->skippedSetNums)->toBe([]);
    });

    it('should skip sets when multiple family sets exist for the same set', function(): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $legoSetData = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: 'https://example.com/image.jpg',
        );
        $userSetData = new RebrickableUserSetData(set: $legoSetData, quantity: 3);

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andReturnUsing(function() use ($userSetData): \Generator {
                yield [$userSetData];
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')
            ->with($legoSetData)
            ->once()
            ->andReturn($set);

        // Two existing family sets for the same set (duplicates)
        $existingFamilySet1 = \Mockery::mock(FamilySet::class);
        $existingFamilySet1->allows('getAttribute')->with('set_id')->andReturn(42);

        $existingFamilySet2 = \Mockery::mock(FamilySet::class);
        $existingFamilySet2->allows('getAttribute')->with('set_id')->andReturn(42);

        // Single query returns two family sets for the same set_id
        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 1)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('set_id', [42])->andReturnSelf();
        $queryBuilder->shouldReceive('get')->andReturn(new Collection([$existingFamilySet1, $existingFamilySet2]));

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $familySetModel->shouldReceive('newInstance')->never();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act
        $result = $action->execute($family);

        // assert
        expect($result->created)->toBe(0);
        expect($result->updated)->toBe(0);
        expect($result->skipped)->toBe(1);
        expect($result->total)->toBe(0);
        expect($result->complete)->toBeTrue();
        expect($result->skippedSetNums)->toBe(['75192-1']);
    });

    it('should preload family sets per page in a single query', function(): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $legoSetData1 = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: null,
        );
        $legoSetData2 = new LegoSetData(
            setNum: '10179-1',
            name: 'Ultimate Collectors Millennium Falcon',
            year: 2_007,
            themeId: 158,
            numParts: 5_195,
            imageUrl: null,
        );
        $legoSetData3 = new LegoSetData(
            setNum: '10281-1',
            name: 'Bonsai Tree',
            year: 2_021,
            themeId: 598,
            numParts: 878,
            imageUrl: null,
        );
        $userSetData1 = new RebrickableUserSetData(set: $legoSetData1, quantity: 1);
        $userSetData2 = new RebrickableUserSetData(set: $legoSetData2, quantity: 2);
        $userSetData3 = new RebrickableUserSetData(set: $legoSetData3, quantity: 1);

        $set1 = \Mockery::mock(Set::class);
        $set1->allows('getAttribute')->with('id')->andReturn(1);

        $set2 = \Mockery::mock(Set::class);
        $set2->allows('getAttribute')->with('id')->andReturn(2);

        $set3 = \Mockery::mock(Set::class);
        $set3->allows('getAttribute')->with('id')->andReturn(3);

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andReturnUsing(function() use ($userSetData1, $userSetData2, $userSetData3): \Generator {
                yield [$userSetData1, $userSetData2, $userSetData3];
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')->with($legoSetData1)->andReturn($set1);
        $upsertSetAction->shouldReceive('execute')->with($legoSetData2)->andReturn($set2);
        $upsertSetAction->shouldReceive('execute')->with($legoSetData3)->andReturn($set3);

        $newFamilySet1 = \Mockery::mock(FamilySet::class);
        $newFamilySet1->allows('setAttribute');
        $newFamilySet1->allows('getAttribute');
        $newFamilySet1->shouldReceive('save');

        $newFamilySet2 = \Mockery::mock(FamilySet::class);
        $newFamilySet2->allows('setAttribute');
        $newFamilySet2->allows('getAttribute');
        $newFamilySet2->shouldReceive('save');

        $newFamilySet3 = \Mockery::mock(FamilySet::class);
        $newFamilySet3->allows('setAttribute');
        $newFamilySet3->allows('getAttribute');
        $newFamilySet3->shouldReceive('save');

        // Verify only ONE query is made with all set IDs for the single page
        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 1)->once()->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('set_id', [1, 2, 3])->once()->andReturnSelf();
        $queryBuilder->shouldReceive('get')->once()->andReturn(new Collection([]));

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $familySetModel->shouldReceive('newInstance')
            ->times(3)
            ->andReturn($newFamilySet1, $newFamilySet2, $newFamilySet3);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act
        $result = $action->execute($family);

        // assert - Mockery verifies the single query expectation
        expect($result->created)->toBe(3);
        expect($result->updated)->toBe(0);
        expect($result->total)->toBe(3);
        expect($result->complete)->toBeTrue();
    });

    it('should report partial import when API fails after first page', function(): void {
        // arrange — one successful page before the failure, so exactly one transaction
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $legoSetData = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: null,
        );
        $userSetData = new RebrickableUserSetData(set: $legoSetData, quantity: 1);

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andReturnUsing(function() use ($userSetData): \Generator {
                yield [$userSetData];

                throw new RebrickableApiException('Failed to fetch user sets: HTTP 500', 500);
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')->andReturn($set);

        $newFamilySet = \Mockery::mock(FamilySet::class);
        $newFamilySet->allows('setAttribute');
        $newFamilySet->allows('getAttribute');
        $newFamilySet->shouldReceive('save');

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 1)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('set_id', [42])->andReturnSelf();
        $queryBuilder->shouldReceive('get')->andReturn(new Collection([]));

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newQuery')->andReturn($queryBuilder);
        $familySetModel->shouldReceive('newInstance')->andReturn($newFamilySet);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act
        $result = $action->execute($family);

        // assert
        expect($result->created)->toBe(1);
        expect($result->total)->toBe(1);
        expect($result->complete)->toBeFalse();
        expect($result->error)->toContain('Import incomplete');
        expect($result->error)->toContain('1 sets were imported successfully');
        expect($result->error)->toContain('Retry to fetch remaining sets');
    });

    it('should not leak raw upstream response detail into the partial-import error string (RebrickableApiException)', function(): void {
        // arrange — one page lands, then the REAL fromResponse() factory throws mid-stream.
        // The wrapped Response carries a deliberately sensitive-looking body (fake API key + DSN);
        // fromResponse() must keep the message "<context>: HTTP <status>" and never fold the body in.
        // Tripwire: if a future change splices $response->body() into the message, the leak
        // assertions below fail. This pins the proven-safe disposition (queue #140 sibling of the
        // SyncSetPartsJob::failed() leak) so the user-return path can't silently start leaking.
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $legoSetData = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: null,
        );
        $userSetData = new RebrickableUserSetData(set: $legoSetData, quantity: 1);

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $sensitiveBody = '{"detail":"key abc123SECRET at pgsql://user:pass@db.internal/rebrickable"}';
        $upstreamResponse = new HttpResponse(new Psr7Response(502, [], $sensitiveBody));

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andReturnUsing(function() use ($userSetData, $upstreamResponse): \Generator {
                yield [$userSetData];

                throw RebrickableApiException::fromResponse($upstreamResponse, 'Failed to fetch user sets');
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')->andReturn($set);

        $newFamilySet = \Mockery::mock(FamilySet::class);
        $newFamilySet->allows('setAttribute');
        $newFamilySet->allows('getAttribute');
        $newFamilySet->shouldReceive('save');

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 1)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('set_id', [42])->andReturnSelf();
        $queryBuilder->shouldReceive('get')->andReturn(new Collection([]));

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newQuery')->andReturn($queryBuilder);
        $familySetModel->shouldReceive('newInstance')->andReturn($newFamilySet);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act
        $result = $action->execute($family);

        // assert — partial-import UX preserved
        expect($result->created)->toBe(1);
        expect($result->total)->toBe(1);
        expect($result->complete)->toBeFalse();
        // exact shape pin: controlled context + HTTP status only
        expect($result->error)->toBe(
            'Import incomplete: Failed to fetch user sets: HTTP 502. 1 sets were imported successfully. Retry to fetch remaining sets.',
        );
        // leak tripwire — no fragment of the sensitive body reaches the user string
        expect($result->error)->not->toContain('abc123SECRET');
        expect($result->error)->not->toContain('pgsql://');
        expect($result->error)->not->toContain('db.internal');
    });

    it('should surface only controlled prose for InvalidApiResponseException partial failures', function(): void {
        // arrange — the other caught type. Its real factory builds fixed prose only (no upstream
        // text), so the partial-import string is fully app-controlled. Shape-pinned as a tripwire.
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $legoSetData = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: null,
        );
        $userSetData = new RebrickableUserSetData(set: $legoSetData, quantity: 1);

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andReturnUsing(function() use ($userSetData): \Generator {
                yield [$userSetData];

                throw InvalidApiResponseException::invalidStructure('Fetching user sets', "Missing or invalid 'results' field");
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')->andReturn($set);

        $newFamilySet = \Mockery::mock(FamilySet::class);
        $newFamilySet->allows('setAttribute');
        $newFamilySet->allows('getAttribute');
        $newFamilySet->shouldReceive('save');

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 1)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('set_id', [42])->andReturnSelf();
        $queryBuilder->shouldReceive('get')->andReturn(new Collection([]));

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newQuery')->andReturn($queryBuilder);
        $familySetModel->shouldReceive('newInstance')->andReturn($newFamilySet);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act
        $result = $action->execute($family);

        // assert — exact shape pin; message is fixed prose only
        expect($result->complete)->toBeFalse();
        expect($result->error)->toBe(
            "Import incomplete: Fetching user sets: Invalid response structure - Missing or invalid 'results' field. 1 sets were imported successfully. Retry to fetch remaining sets.",
        );
    });

    it('should re-throw exception when first page fails', function(): void {
        // arrange — the fetch fails before any page lands, so no transaction is opened
        $this->db->shouldNotReceive('transaction');

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andThrow(new RebrickableApiException('Failed to fetch user sets: HTTP 401', 401));

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $familySetModel = \Mockery::mock(FamilySet::class);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act & assert
        expect(fn(): ImportOwnedSetsResultData => $action->execute($family))
            ->toThrow(RebrickableApiException::class, 'Failed to fetch user sets: HTTP 401');
    });

    it('should skip processing when page has no user sets', function(): void {
        // arrange — an empty page still opens its per-page transaction; the early return happens inside it
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andReturnUsing(function(): \Generator {
                yield [];
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldNotReceive('execute');

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldNotReceive('newQuery');

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $this->db);

        // act
        $result = $action->execute($family);

        // assert
        expect($result->created)->toBe(0);
        expect($result->updated)->toBe(0);
        expect($result->skipped)->toBe(0);
        expect($result->total)->toBe(0);
        expect($result->complete)->toBeTrue();
    });

    it('should use per-page transactions', function(): void {
        // arrange
        $legoSetData = new LegoSetData(
            setNum: '75192-1',
            name: 'Millennium Falcon',
            year: 2_017,
            themeId: 158,
            numParts: 7_541,
            imageUrl: null,
        );
        $userSetData = new RebrickableUserSetData(set: $legoSetData, quantity: 1);

        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $legoDataService = \Mockery::mock(LegoDataServiceInterface::class);
        $legoDataService->shouldReceive('fetchUserSets')
            ->andReturnUsing(function() use ($userSetData): \Generator {
                yield [$userSetData];

                throw new RebrickableApiException('API error', 500);
            });

        $upsertSetAction = \Mockery::mock(UpsertSetAction::class);
        $upsertSetAction->shouldReceive('execute')->andReturn($set);

        $newFamilySet = \Mockery::mock(FamilySet::class);
        $newFamilySet->allows('setAttribute');
        $newFamilySet->allows('getAttribute');
        $newFamilySet->shouldReceive('save');

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->andReturnSelf();
        $queryBuilder->shouldReceive('get')->andReturn(new Collection([]));

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newQuery')->andReturn($queryBuilder);
        $familySetModel->shouldReceive('newInstance')->andReturn($newFamilySet);

        // Verify transaction is called exactly once (for the one successful page)
        $db = \Mockery::mock(ConnectionInterface::class);
        $db->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(fn(\Closure $callback) => $callback());

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);
        $family->allows('getAttribute')->with('rebrickable_user_token')->andReturn('user-token-123');

        $action = new ImportOwnedSetsAction($legoDataService, $upsertSetAction, $familySetModel, $db);

        // act
        $result = $action->execute($family);

        // assert — Mockery verifies transaction was called exactly once
        expect($result->complete)->toBeFalse();
    });
});
