<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Models\User;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<User>
 */
final readonly class ProfileResourceData extends ResourceData
{
    public function __construct(
        public int $id,
        public int $family_id,
        public string $name,
        public string $email,
        public ?DateTimeInterface $email_verified_at,
    ) {}

    /**
     * @param User $model
     */
    public static function from(Model $model): static
    {
        return new self(
            id: $model->id,
            family_id: $model->family_id,
            name: $model->name,
            email: $model->email,
            email_verified_at: $model->email_verified_at,
        );
    }
}
