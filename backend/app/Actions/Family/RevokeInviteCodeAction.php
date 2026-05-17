<?php

declare(strict_types = 1);

namespace App\Actions\Family;

use App\Exceptions\InviteCodeNotFoundException;
use App\Models\Family;
use App\Models\InviteCode;
use Illuminate\Database\ConnectionInterface;

final readonly class RevokeInviteCodeAction
{
    public function __construct(
        private InviteCode $inviteCode,
        private ConnectionInterface $connection,
    ) {}

    public function execute(Family $family): void
    {
        $this->connection->transaction(function() use ($family): void {
            /** @var InviteCode|null $activeCode */
            $activeCode = $this->inviteCode->newQuery()
                ->where('family_id', $family->id)
                ->active()
                ->first();

            if ($activeCode === null) {
                throw InviteCodeNotFoundException::forFamily($family->id);
            }

            $activeCode->revoked_at = now();
            $activeCode->save();
        });
    }
}
