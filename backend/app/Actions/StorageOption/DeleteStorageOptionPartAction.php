<?php

declare(strict_types = 1);

namespace App\Actions\StorageOption;

use App\Models\StorageOptionPart;
use Illuminate\Database\ConnectionInterface;

final readonly class DeleteStorageOptionPartAction
{
    public function __construct(
        private ConnectionInterface $connection,
    ) {}

    public function execute(StorageOptionPart $storageOptionPart): void
    {
        $this->connection->transaction(function() use ($storageOptionPart): void {
            $storageOptionPart->delete();
        });
    }
}
