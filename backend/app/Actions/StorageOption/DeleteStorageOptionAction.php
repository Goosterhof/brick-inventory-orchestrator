<?php

declare(strict_types = 1);

namespace App\Actions\StorageOption;

use App\Models\StorageOption;
use Illuminate\Database\ConnectionInterface;

final readonly class DeleteStorageOptionAction
{
    public function __construct(
        private ConnectionInterface $connection,
    ) {}

    public function execute(StorageOption $storageOption): void
    {
        $storageOption->load('children.storageOptionParts', 'storageOptionParts');

        $this->connection->transaction(function() use ($storageOption): void {
            $this->deleteRecursive($storageOption);
        });
    }

    private function deleteRecursive(StorageOption $storageOption): void
    {
        foreach ($storageOption->children as $child) {
            $this->deleteRecursive($child);
        }

        $storageOption->storageOptionParts()->delete();
        $storageOption->delete();
    }
}
