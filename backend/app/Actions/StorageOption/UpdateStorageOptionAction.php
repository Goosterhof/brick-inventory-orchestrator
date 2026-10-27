<?php

declare(strict_types = 1);

namespace App\Actions\StorageOption;

use App\DataTransferObjects\Input\StorageOption\StorageOptionData;
use App\Models\StorageOption;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Validation\ValidationException;

use function array_key_exists;

/**
 * Updates an existing StorageOption.
 *
 * NOTE: `gridRows` and `gridColumns` on the incoming DTO are intentionally ignored.
 * Grid dimensions are immutable after a section is created — shrinking a grid
 * would orphan seeded drawers (and any parts attached to them), and growing a
 * grid raises the question of whether new drawers should be auto-seeded.
 * Resizing is a future operation that needs its own permit and orphan semantics.
 */
final readonly class UpdateStorageOptionAction
{
    public function __construct(
        private ConnectionInterface $connection,
    ) {}

    public function execute(StorageOption $storageOption, StorageOptionData $storageOptionData): StorageOption
    {
        return $this->connection->transaction(function() use ($storageOption, $storageOptionData): StorageOption {
            if ($storageOptionData->parentId !== null) {
                // All reparent operations for a family take this lock before reading the
                // hierarchy, so two requests cannot validate opposite links at once.
                $this->connection->table('families')
                    ->where('id', $storageOption->family_id)
                    ->lockForUpdate()->firstOrFail();

                /** @var array<int, int|null> $parents */
                $parents = $this->connection->table('storage_options')
                    ->where('family_id', $storageOption->family_id)
                    ->pluck('parent_id', 'id')->all();

                $ancestorId = $storageOptionData->parentId;
                $visited = [];
                while ($ancestorId !== null) {
                    if ($ancestorId === $storageOption->id || isset($visited[$ancestorId])) {
                        throw ValidationException::withMessages(['parent_id' => 'The selected parent would create a cycle.']);
                    }

                    if (!array_key_exists($ancestorId, $parents)) {
                        throw ValidationException::withMessages(['parent_id' => 'The selected parent does not belong to your family.']);
                    }

                    $visited[$ancestorId] = true;
                    $ancestorId = $parents[$ancestorId];
                }
            }

            $storageOption->name = $storageOptionData->name;
            $storageOption->description = $storageOptionData->description;
            $storageOption->parent_id = $storageOptionData->parentId;
            $storageOption->row = $storageOptionData->row;
            $storageOption->column = $storageOptionData->column;
            // Intentionally not assigning grid_rows / grid_columns — see class PHPDoc.
            $storageOption->save();

            return $storageOption;
        });
    }
}
