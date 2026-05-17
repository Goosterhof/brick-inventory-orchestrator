<?php

declare(strict_types = 1);

namespace App\Actions\FamilySet;

use App\Models\FamilySet;
use Illuminate\Database\ConnectionInterface;

final readonly class DeleteFamilySetAction
{
    public function __construct(
        private ConnectionInterface $connection,
    ) {}

    public function execute(FamilySet $familySet): void
    {
        $this->connection->transaction(function() use ($familySet): void {
            $familySet->delete();
        });
    }
}
