<?php

declare(strict_types = 1);

use App\Models\Color;
use App\Models\Part;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

covers(StorageOptionPart::class);

uses(RefreshDatabase::class);

describe('StorageOptionPart', function(): void {
    describe('null-color unique index (race condition guard)', function(): void {
        it('should reject a duplicate null-color row at the database level', function(): void {
            $storageOption = StorageOption::factory()->create();
            $part = Part::factory()->create();
            StorageOptionPart::factory()->create([
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
                'color_id' => null,
                'quantity' => 10,
            ]);

            $duplicate = new StorageOptionPart;
            $duplicate->storage_option_id = $storageOption->id;
            $duplicate->part_id = $part->id;
            $duplicate->color_id = null;
            $duplicate->quantity = 20;

            // Wrap the failing INSERT in a nested transaction so Laravel uses a
            // SAVEPOINT for it. Without this, the unique-constraint failure marks
            // the RefreshDatabase-owned outer transaction as aborted on Postgres
            // and every subsequent query in the test errors out.
            expect(fn() => DB::transaction(fn() => $duplicate->save()))
                ->toThrow(UniqueConstraintViolationException::class);

            expect(
                StorageOptionPart::query()
                    ->where('storage_option_id', $storageOption->id)
                    ->where('part_id', $part->id)
                    ->whereNull('color_id')
                    ->count(),
            )->toBe(1);
        });

        it('should reject a duplicate non-null color row at the database level', function(): void {
            $storageOption = StorageOption::factory()->create();
            $part = Part::factory()->create();
            $color = Color::factory()->create();
            StorageOptionPart::factory()->create([
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
                'color_id' => $color->id,
                'quantity' => 10,
            ]);

            $duplicate = new StorageOptionPart;
            $duplicate->storage_option_id = $storageOption->id;
            $duplicate->part_id = $part->id;
            $duplicate->color_id = $color->id;
            $duplicate->quantity = 20;

            expect(fn() => DB::transaction(fn() => $duplicate->save()))
                ->toThrow(UniqueConstraintViolationException::class);

            expect(
                StorageOptionPart::query()
                    ->where('storage_option_id', $storageOption->id)
                    ->where('part_id', $part->id)
                    ->where('color_id', $color->id)
                    ->count(),
            )->toBe(1);
        });

        it('should allow a null-color row to coexist with colored rows for the same storage option and part', function(): void {
            $storageOption = StorageOption::factory()->create();
            $part = Part::factory()->create();
            $color = Color::factory()->create();

            StorageOptionPart::factory()->create([
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
                'color_id' => null,
                'quantity' => 10,
            ]);
            StorageOptionPart::factory()->create([
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
                'color_id' => $color->id,
                'quantity' => 20,
            ]);

            expect(
                StorageOptionPart::query()
                    ->where('storage_option_id', $storageOption->id)
                    ->where('part_id', $part->id)
                    ->count(),
            )->toBe(2);
        });

        it('should allow the same part with a null color in different storage options', function(): void {
            $part = Part::factory()->create();

            StorageOptionPart::factory()->create([
                'part_id' => $part->id,
                'color_id' => null,
            ]);
            StorageOptionPart::factory()->create([
                'part_id' => $part->id,
                'color_id' => null,
            ]);

            expect(
                StorageOptionPart::query()
                    ->where('part_id', $part->id)
                    ->whereNull('color_id')
                    ->count(),
            )->toBe(2);
        });
    });

    describe('null-color unique index migration pre-check', function(): void {
        it('should abort with an actionable message when violating duplicate rows already exist', function(): void {
            // Simulate the pre-index state: drop the index, insert the duplicates
            // the index would have prevented, then re-run the migration.
            DB::statement('DROP INDEX IF EXISTS storage_option_parts_null_color_unique');

            $storageOption = StorageOption::factory()->create();
            $part = Part::factory()->create();
            StorageOptionPart::factory()->count(2)->create([
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
                'color_id' => null,
            ]);

            /** @var Migration $migration */
            $migration = require database_path('migrations/2026_07_16_000001_add_null_color_unique_index_to_storage_option_parts_table.php');

            expect(function() use ($migration): void {
                $migration->up();
            })->toThrow(\RuntimeException::class, 'duplicate null-color rows');

            // Fail loudly, never destructively: both rows must survive the abort.
            expect(
                StorageOptionPart::query()
                    ->where('storage_option_id', $storageOption->id)
                    ->where('part_id', $part->id)
                    ->whereNull('color_id')
                    ->count(),
            )->toBe(2);
        });

        it('should create the index when no violating duplicate rows exist', function(): void {
            DB::statement('DROP INDEX IF EXISTS storage_option_parts_null_color_unique');

            $storageOption = StorageOption::factory()->create();
            $part = Part::factory()->create();
            StorageOptionPart::factory()->create([
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
                'color_id' => null,
                'quantity' => 10,
            ]);

            /** @var Migration $migration */
            $migration = require database_path('migrations/2026_07_16_000001_add_null_color_unique_index_to_storage_option_parts_table.php');
            $migration->up();

            $duplicate = new StorageOptionPart;
            $duplicate->storage_option_id = $storageOption->id;
            $duplicate->part_id = $part->id;
            $duplicate->color_id = null;
            $duplicate->quantity = 20;

            expect(fn() => DB::transaction(fn() => $duplicate->save()))
                ->toThrow(UniqueConstraintViolationException::class);
        });
    });
});
