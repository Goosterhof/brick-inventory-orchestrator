<?php

declare(strict_types = 1);

use App\Actions\FamilySet\UpdateFamilySetAction;
use App\DataTransferObjects\Input\FamilySet\UpdateFamilySetData;
use App\Enums\FamilySetStatus;
use App\Models\FamilySet;
use Carbon\CarbonImmutable;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\DateFactory;
use Illuminate\Support\Facades\Date;

covers(UpdateFamilySetAction::class);

describe('UpdateFamilySetAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->allows('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());

        $this->dateFactory = \Mockery::mock(DateFactory::class);
        $this->dateFactory->allows('instance')->andReturnUsing(
            fn(\DateTimeInterface $date): CarbonImmutable => CarbonImmutable::instance($date),
        );
    });

    it('should update all fields on the family set', function(): void {
        // arrange
        $savedValues = [];
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $familySet->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $familySet->shouldReceive('save')->once();

        $purchaseDate = Date::parse('2024-06-15');

        $action = new UpdateFamilySetAction($this->dateFactory, $this->db);
        $data = new UpdateFamilySetData(
            quantity: 5,
            status: FamilySetStatus::Built,
            purchaseDateProvided: true,
            purchaseDate: $purchaseDate,
            notesProvided: true,
            notes: 'Updated notes',
        );

        // act
        $result = $action->execute($familySet, $data);

        // assert
        expect($result)->toBe($familySet)
            ->and($savedValues['quantity'])->toBe(5)
            ->and($savedValues['status'])->toBe(FamilySetStatus::Built)
            ->and($savedValues['purchase_date']->format('Y-m-d'))->toBe('2024-06-15')
            ->and($savedValues['notes'])->toBe('Updated notes');
    });

    it('should leave fields untouched when their provided flags are false', function(): void {
        // arrange
        $savedValues = [];
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $familySet->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $familySet->shouldReceive('save')->once();

        $action = new UpdateFamilySetAction($this->dateFactory, $this->db);
        $data = new UpdateFamilySetData(
            status: FamilySetStatus::InProgress,
        );

        // act
        $action->execute($familySet, $data);

        // assert
        expect($savedValues)->toHaveKey('status')
            ->and($savedValues['status'])->toBe(FamilySetStatus::InProgress)
            ->and($savedValues)->not->toHaveKey('quantity')
            ->and($savedValues)->not->toHaveKey('purchase_date')
            ->and($savedValues)->not->toHaveKey('notes');
    });

    it('should clear purchase_date and notes when provided flags are true with null values', function(): void {
        // arrange
        $savedValues = [];
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $familySet->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $familySet->shouldReceive('save')->once();

        $action = new UpdateFamilySetAction($this->dateFactory, $this->db);
        $data = new UpdateFamilySetData(
            purchaseDateProvided: true,
            purchaseDate: null,
            notesProvided: true,
            notes: null,
        );

        // act
        $action->execute($familySet, $data);

        // assert
        expect($savedValues)->toHaveKey('purchase_date')
            ->and($savedValues['purchase_date'])->toBeNull()
            ->and($savedValues)->toHaveKey('notes')
            ->and($savedValues['notes'])->toBeNull();
    });

    it('should call save on the family set', function(): void {
        // arrange
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute');
        $familySet->allows('getAttribute');
        $familySet->shouldReceive('save')->once();

        $action = new UpdateFamilySetAction($this->dateFactory, $this->db);
        $data = new UpdateFamilySetData(
            quantity: 1,
            status: FamilySetStatus::Sealed,
        );

        // act
        $action->execute($familySet, $data);

        // assert - Mockery expectations verify the interactions
    });

    it('should return the same family set instance', function(): void {
        // arrange
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute');
        $familySet->allows('getAttribute');
        $familySet->shouldReceive('save')->once();

        $action = new UpdateFamilySetAction($this->dateFactory, $this->db);
        $data = new UpdateFamilySetData(
            quantity: 3,
            status: FamilySetStatus::Sealed,
        );

        // act
        $result = $action->execute($familySet, $data);

        // assert
        expect($result)->toBe($familySet);
    });
});
