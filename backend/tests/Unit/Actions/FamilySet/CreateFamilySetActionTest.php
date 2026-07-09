<?php

declare(strict_types = 1);

use App\Actions\FamilySet\CreateFamilySetAction;
use App\Actions\FamilySet\UpdateFamilySetAction;
use App\Actions\GetSetAction;
use App\DataTransferObjects\Input\FamilySet\CreateFamilySetData;
use App\DataTransferObjects\Input\FamilySet\UpdateFamilySetData;
use App\Enums\FamilySetStatus;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\Set;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\Date;

covers(CreateFamilySetAction::class);

describe('CreateFamilySetAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());
    });

    it('should fetch set using GetSetAction', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(1);

        $getSetAction = \Mockery::mock(GetSetAction::class);
        $getSetAction->shouldReceive('execute')
            ->with('75192-1')
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

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newInstance')
            ->once()
            ->andReturn($familySet);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $updateAction = \Mockery::mock(UpdateFamilySetAction::class);
        $updateAction->shouldReceive('execute')
            ->once()
            ->andReturn($familySet);

        $action = new CreateFamilySetAction($getSetAction, $updateAction, $familySetModel, $this->db);
        $data = new CreateFamilySetData(
            setNum: '75192-1',
            quantity: 2,
            status: FamilySetStatus::Built,
        );

        // act
        $action->execute($family, $data);

        // assert - Mockery expectations verify the interactions
    });

    it('should create family set with correct family_id and set_id', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(42);

        $getSetAction = \Mockery::mock(GetSetAction::class);
        $getSetAction->shouldReceive('execute')->andReturn($set);

        $familySetSavedValues = [];
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$familySetSavedValues): void {
            $familySetSavedValues[$key] = $value;
        });
        $familySet->allows('getAttribute')->andReturnUsing(function($key) use (&$familySetSavedValues): mixed {
            return $familySetSavedValues[$key] ?? null;
        });
        $familySet->shouldReceive('save')->once();

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newInstance')
            ->once()
            ->andReturn($familySet);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(99);

        $updateAction = \Mockery::mock(UpdateFamilySetAction::class);
        $updateAction->shouldReceive('execute')->andReturn($familySet);

        $action = new CreateFamilySetAction($getSetAction, $updateAction, $familySetModel, $this->db);
        $data = new CreateFamilySetData(
            setNum: '75192-1',
            quantity: 1,
            status: FamilySetStatus::Sealed,
        );

        // act
        $action->execute($family, $data);

        // assert
        expect($familySetSavedValues['family_id'])->toBe(99);
        expect($familySetSavedValues['set_id'])->toBe(42);
    });

    it('should delegate to update action with correct data', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(1);

        $getSetAction = \Mockery::mock(GetSetAction::class);
        $getSetAction->shouldReceive('execute')->andReturn($set);

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute');
        $familySet->allows('getAttribute');
        $familySet->shouldReceive('save');

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newInstance')->andReturn($familySet);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $purchaseDate = Date::parse('2024-01-15');

        $updateAction = \Mockery::mock(UpdateFamilySetAction::class);
        $updateAction->shouldReceive('execute')
            ->withArgs(fn(FamilySet $fs, UpdateFamilySetData $updateFamilySetData): bool => $fs === $familySet
                && $updateFamilySetData->quantity === 2
                && $updateFamilySetData->status === FamilySetStatus::Built
                && $updateFamilySetData->purchaseDate === $purchaseDate
                && $updateFamilySetData->notes === 'Test notes')
            ->once()
            ->andReturn($familySet);

        $action = new CreateFamilySetAction($getSetAction, $updateAction, $familySetModel, $this->db);
        $data = new CreateFamilySetData(
            setNum: '75192-1',
            quantity: 2,
            status: FamilySetStatus::Built,
            purchaseDate: $purchaseDate,
            notes: 'Test notes',
        );

        // act
        $action->execute($family, $data);

        // assert - Mockery expectations verify the interactions
    });

    it('should return the family set from update action', function(): void {
        // arrange
        $set = \Mockery::mock(Set::class);
        $set->allows('getAttribute')->with('id')->andReturn(1);

        $getSetAction = \Mockery::mock(GetSetAction::class);
        $getSetAction->shouldReceive('execute')->andReturn($set);

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute');
        $familySet->allows('getAttribute');
        $familySet->shouldReceive('save');

        $familySetModel = \Mockery::mock(FamilySet::class);
        $familySetModel->shouldReceive('newInstance')->andReturn($familySet);

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(10);

        $updateAction = \Mockery::mock(UpdateFamilySetAction::class);
        $updateAction->shouldReceive('execute')->andReturn($familySet);

        $action = new CreateFamilySetAction($getSetAction, $updateAction, $familySetModel, $this->db);
        $data = new CreateFamilySetData(
            setNum: '75192-1',
            quantity: 1,
            status: FamilySetStatus::Sealed,
        );

        // act
        $result = $action->execute($family, $data);

        // assert
        expect($result)->toBe($familySet);
    });
});
