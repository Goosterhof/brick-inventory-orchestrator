<?php

declare(strict_types = 1);

namespace App\Actions\Family;

use App\Exceptions\InviteCodeNotFoundException;
use App\Models\Family;
use App\Models\InviteCode;

final readonly class GetActiveInviteCodeAction
{
    public function __construct(
        private InviteCode $inviteCode,
    ) {}

    public function execute(Family $family): InviteCode
    {
        /** @var InviteCode|null $activeCode */
        $activeCode = $this->inviteCode->newQuery()
            ->where('family_id', $family->id)
            ->active()
            ->first();

        if ($activeCode === null) {
            throw InviteCodeNotFoundException::forFamily($family->id);
        }

        return $activeCode;
    }
}
