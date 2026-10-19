<?php

declare(strict_types = 1);

use App\Actions\StorageOption\UpdateStorageOptionAction;
use App\DataTransferObjects\Input\StorageOption\StorageOptionData;
use App\Models\StorageOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

covers(UpdateStorageOptionAction::class);

uses(RefreshDatabase::class);

describe('UpdateStorageOptionAction', function(): void {
    it('updates a location and preserves immutable grid dimensions', function(): void {
        $user = User::factory()->create();
        $first = StorageOption::factory()->forFamily($user->family)->create();
        $second = StorageOption::factory()->forFamily($user->family)->create();
        $option = StorageOption::factory()->forFamily($user->family)->create([
            'parent_id' => $first->id,
            'grid_rows' => 5,
            'grid_columns' => 6,
        ]);

        $result = resolve(UpdateStorageOptionAction::class)->execute($option, new StorageOptionData(
            name: 'Renamed',
            description: 'Updated',
            parentId: $second->id,
            row: 2,
            column: 3,
            gridRows: 99,
            gridColumns: 99,
        ));

        expect($result)->toBe($option);
        $this->assertDatabaseHas('storage_options', [
            'id' => $option->id,
            'name' => 'Renamed',
            'description' => 'Updated',
            'parent_id' => $second->id,
            'row' => 2,
            'column' => 3,
            'grid_rows' => 5,
            'grid_columns' => 6,
        ]);

        resolve(UpdateStorageOptionAction::class)->execute($option, new StorageOptionData(name: 'Root'));
        $this->assertDatabaseHas('storage_options', ['id' => $option->id, 'parent_id' => null]);
    });

    it('rejects itself and descendants as parents', function(): void {
        $user = User::factory()->create();
        $option = StorageOption::factory()->forFamily($user->family)->create();
        $child = StorageOption::factory()->forFamily($user->family)->create(['parent_id' => $option->id]);

        foreach ([$option->id, $child->id] as $parentId) {
            expect(fn() => resolve(UpdateStorageOptionAction::class)->execute(
                $option,
                new StorageOptionData(name: $option->name, parentId: $parentId),
            ))->toThrow(ValidationException::class);
        }

        $this->assertDatabaseHas('storage_options', ['id' => $option->id, 'parent_id' => null]);
    });

    it('rejects an existing cycle in the proposed parent ancestry', function(): void {
        $user = User::factory()->create();
        $option = StorageOption::factory()->forFamily($user->family)->create();
        $first = StorageOption::factory()->forFamily($user->family)->create();
        $second = StorageOption::factory()->forFamily($user->family)->create(['parent_id' => $first->id]);
        $first->parent_id = $second->id;
        $first->save();

        expect(fn() => resolve(UpdateStorageOptionAction::class)->execute(
            $option,
            new StorageOptionData(name: $option->name, parentId: $first->id),
        ))->toThrow(ValidationException::class);
    });

    it('rejects a parent outside the location family', function(): void {
        $user = User::factory()->create();
        $option = StorageOption::factory()->forFamily($user->family)->create();
        $foreignParent = StorageOption::factory()->create();

        expect(fn() => resolve(UpdateStorageOptionAction::class)->execute(
            $option,
            new StorageOptionData(name: $option->name, parentId: $foreignParent->id),
        ))->toThrow(ValidationException::class);
    });
});
