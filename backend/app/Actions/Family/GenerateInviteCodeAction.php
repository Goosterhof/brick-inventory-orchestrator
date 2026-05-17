<?php

declare(strict_types = 1);

namespace App\Actions\Family;

use App\Models\Family;
use App\Models\InviteCode;
use App\Models\User;
use Illuminate\Database\ConnectionInterface;

final readonly class GenerateInviteCodeAction
{
    public function __construct(
        private InviteCode $inviteCode,
        private ConnectionInterface $connection,
        private int $ttlDays,
    ) {}

    public function execute(Family $family, User $user): InviteCode
    {
        return $this->connection->transaction(function() use ($family, $user): InviteCode {
            $this->revokeExistingActiveCode($family);

            $code = $this->inviteCode->newInstance();
            $code->family_id = $family->id;
            $code->code = $this->generateUniqueCode();
            $code->generated_by = $user->id;
            $code->expires_at = $this->ttlDays > 0 ? now()->addDays($this->ttlDays) : null;
            $code->save();

            return $code;
        });
    }

    private function revokeExistingActiveCode(Family $family): void
    {
        /** @var InviteCode|null $activeCode */
        $activeCode = $this->inviteCode->newQuery()
            ->where('family_id', $family->id)
            ->active()
            ->first();

        if ($activeCode !== null) {
            $activeCode->revoked_at = now();
            $activeCode->save();
        }
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = 'BRICK-' . $this->generateRandomSuffix();
        } while ($this->inviteCode->newQuery()->where('code', $code)->exists());

        return $code;
    }

    private function generateRandomSuffix(): string
    {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $suffix = '';

        for ($i = 0; $i < 4; $i++) {
            $suffix .= $characters[random_int(0, mb_strlen($characters) - 1)];
        }

        return $suffix;
    }
}
