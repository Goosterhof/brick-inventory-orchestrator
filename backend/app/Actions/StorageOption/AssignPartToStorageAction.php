<?php

declare(strict_types = 1);

namespace App\Actions\StorageOption;

use App\DataTransferObjects\Input\StorageOption\AssignPartToStorageData;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\UniqueConstraintViolationException;

final readonly class AssignPartToStorageAction
{
    public function __construct(
        private StorageOptionPart $storageOptionPart,
        private ConnectionInterface $connection,
    ) {}

    public function execute(StorageOption $storageOption, AssignPartToStorageData $assignPartToStorageData): StorageOptionPart
    {
        try {
            return $this->connection->transaction(function() use ($storageOption, $assignPartToStorageData): StorageOptionPart {
                $storageOptionPart = $this->storageOptionPart->newQuery()
                    ->where('storage_option_id', $storageOption->id)
                    ->where('part_id', $assignPartToStorageData->partId)
                    ->where('color_id', $assignPartToStorageData->colorId)
                    ->first();

                if ($storageOptionPart === null) {
                    $storageOptionPart = $this->storageOptionPart->newInstance();
                    $storageOptionPart->storage_option_id = $storageOption->id;
                    $storageOptionPart->part_id = $assignPartToStorageData->partId;
                    $storageOptionPart->color_id = $assignPartToStorageData->colorId;
                }

                $storageOptionPart->quantity = $assignPartToStorageData->quantity;
                $storageOptionPart->save();

                return $storageOptionPart;
            });
        } catch (UniqueConstraintViolationException) {
            return $this->connection->transaction(function() use ($storageOption, $assignPartToStorageData): StorageOptionPart {
                /** @var StorageOptionPart */
                $storageOptionPart = $this->storageOptionPart->newQuery()
                    ->where('storage_option_id', $storageOption->id)
                    ->where('part_id', $assignPartToStorageData->partId)
                    ->where('color_id', $assignPartToStorageData->colorId)
                    ->firstOrFail();

                $storageOptionPart->quantity = $assignPartToStorageData->quantity;
                $storageOptionPart->save();

                return $storageOptionPart;
            });
        }
    }
}
