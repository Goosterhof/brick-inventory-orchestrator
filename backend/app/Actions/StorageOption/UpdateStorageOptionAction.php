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
            // Serialize reparenting within a family before reading the current tree.
            $this->connection->table('families')->where('id', $storageOption->family_id)->lockForUpdate()->first();

            if ($storageOptionData->parentId !== null) {
                /** @var array<int, int|null> $parents */
                $parents = StorageOption::query()
                    ->where('family_id', $storageOption->family_id)
                    ->pluck('parent_id', 'id')
                    ->all();
                $candidateId = $storageOptionData->parentId;
                $visited = [];

                while ($candidateId !== null) {
                    if ($candidateId === $storageOption->id) {
                        throw ValidationException::withMessages(['parent_id' => 'The selected parent cannot be this location or one of its descendants.']);
                    }

                    if (isset($visited[$candidateId])) {
                        throw ValidationException::withMessages(['parent_id' => 'The selected parent has a cyclic ancestry.']);
                    }

                    if (!array_key_exists($candidateId, $parents)) {
                        throw ValidationException::withMessages(['parent_id' => 'The selected parent does not belong to your family.']);
                    }

                    $visited[$candidateId] = true;
                    $candidateId = $parents[$candidateId];
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
