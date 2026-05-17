<?php

declare(strict_types = 1);

namespace App\Actions\StorageOption;

use App\DataTransferObjects\Input\StorageOption\StorageOptionData;
use App\Models\Family;
use App\Models\StorageOption;
use Illuminate\Database\ConnectionInterface;

use function sprintf;

final readonly class CreateStorageOptionAction
{
    public function __construct(
        private StorageOption $storageOption,
        private ConnectionInterface $connection,
    ) {}

    public function execute(Family $family, StorageOptionData $storageOptionData): StorageOption
    {
        return $this->connection->transaction(function() use ($family, $storageOptionData): StorageOption {
            $storageOption = $this->storageOption->newInstance();
            $storageOption->family_id = $family->id;
            $storageOption->name = $storageOptionData->name;
            $storageOption->description = $storageOptionData->description;
            $storageOption->parent_id = $storageOptionData->parentId;
            $storageOption->row = $storageOptionData->row;
            $storageOption->column = $storageOptionData->column;
            $storageOption->grid_rows = $storageOptionData->gridRows;
            $storageOption->grid_columns = $storageOptionData->gridColumns;
            $storageOption->save();

            // Defensive guard: only seed when both dims are present. The FormRequest's
            // required_with rules already block the half-set case, but a malformed call
            // path that bypasses validation should still not produce a half-seeded grid.
            if ($storageOptionData->gridRows !== null && $storageOptionData->gridColumns !== null) {
                $this->seedDrawerGrid($storageOption, $storageOptionData->gridRows, $storageOptionData->gridColumns);
            }

            return $storageOption;
        });
    }

    private function seedDrawerGrid(StorageOption $storageOption, int $gridRows, int $gridColumns): void
    {
        for ($r = 1; $r <= $gridRows; $r++) {
            for ($c = 1; $c <= $gridColumns; $c++) {
                $drawer = $this->storageOption->newInstance();
                $drawer->family_id = $storageOption->family_id;
                $drawer->parent_id = $storageOption->id;
                $drawer->name = sprintf('R%dC%d', $r, $c);
                $drawer->description = null;
                $drawer->row = $r;
                $drawer->column = $c;
                $drawer->grid_rows = null;
                $drawer->grid_columns = null;
                $drawer->save();
            }
        }
    }
}
