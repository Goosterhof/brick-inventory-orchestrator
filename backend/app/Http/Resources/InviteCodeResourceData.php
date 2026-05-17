<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Models\InviteCode;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<InviteCode>
 */
final readonly class InviteCodeResourceData extends ResourceData
{
    public function __construct(
        public int $id,
        public string $code,
        public ?DateTimeInterface $expires_at,
        public ?DateTimeInterface $created_at,
    ) {}

    /**
     * @param InviteCode $model
     */
    public static function from(Model $model): static
    {
        return new self(
            id: $model->id,
            code: $model->code,
            expires_at: $model->expires_at,
            created_at: $model->created_at,
        );
    }
}
