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
        $this->now = CarbonImmutable::parse('2026-06-01 09:30:00');
        $this->dateFactory->allows('now')->andReturn($this->now);
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

    it('should stamp build_started_at when transitioning into in_progress and it is null', function(): void {
        // arrange
        $savedValues = ['build_started_at' => null];
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $familySet->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $familySet->shouldReceive('save')->once();

        $action = new UpdateFamilySetAction($this->dateFactory, $this->db);
        $data = new UpdateFamilySetData(status: FamilySetStatus::InProgress);

        // act
        $action->execute($familySet, $data);

        // assert
        expect($savedValues['build_started_at'])->toBe($this->now)
            ->and($savedValues)->not->toHaveKey('built_at');
    });

    it('should stamp built_at when transitioning into built and it is null', function(): void {
        // arrange
        $savedValues = ['built_at' => null];
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $familySet->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $familySet->shouldReceive('save')->once();

        $action = new UpdateFamilySetAction($this->dateFactory, $this->db);
        $data = new UpdateFamilySetData(status: FamilySetStatus::Built);

        // act
        $action->execute($familySet, $data);

        // assert
        expect($savedValues['built_at'])->toBe($this->now)
            ->and($savedValues)->not->toHaveKey('build_started_at');
    });

    it('should not overwrite build_started_at when it is already stamped', function(): void {
        // arrange
        $original = CarbonImmutable::parse('2026-01-01 08:00:00');
        $savedValues = ['build_started_at' => $original];
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $familySet->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $familySet->shouldReceive('save')->once();

        $action = new UpdateFamilySetAction($this->dateFactory, $this->db);
        $data = new UpdateFamilySetData(status: FamilySetStatus::InProgress);

        // act
        $action->execute($familySet, $data);

        // assert
        expect($savedValues['build_started_at'])->toBe($original);
    });

    it('should not overwrite built_at when it is already stamped (built to in_progress to built keeps first)', function(): void {
        // arrange
        $original = CarbonImmutable::parse('2026-02-02 14:00:00');
        $savedValues = ['built_at' => $original];
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $familySet->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $familySet->shouldReceive('save')->once();

        $action = new UpdateFamilySetAction($this->dateFactory, $this->db);
        $data = new UpdateFamilySetData(status: FamilySetStatus::Built);

        // act
        $action->execute($familySet, $data);

        // assert
        expect($savedValues['built_at'])->toBe($original);
    });

    it('should not stamp any build timestamp when transitioning into a non-build status', function(): void {
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
        $data = new UpdateFamilySetData(status: FamilySetStatus::InStorage);

        // act
        $action->execute($familySet, $data);

        // assert
        expect($savedValues)->not->toHaveKey('build_started_at')
            ->and($savedValues)->not->toHaveKey('built_at');
    });

    it('should leave build timestamps untouched when only quantity or notes change', function(): void {
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
            quantity: 7,
            notesProvided: true,
            notes: 'Reorganized the shelf',
        );

        // act
        $action->execute($familySet, $data);

        // assert
        expect($savedValues)->not->toHaveKey('build_started_at')
            ->and($savedValues)->not->toHaveKey('built_at')
            ->and($savedValues['quantity'])->toBe(7)
            ->and($savedValues['notes'])->toBe('Reorganized the shelf');
    });
});
