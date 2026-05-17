<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Models\Family;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<User>
 */
final readonly class FamilyMemberResourceData extends ResourceData
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public bool $is_head,
    ) {}

    /**
     * @param User $model
     */
    public static function from(Model $model): static
    {
        return new self(
            id: $model->id,
            name: $model->name,
            email: $model->email,
            is_head: false,
        );
    }

    /**
     * @return array<int, static>
     */
    public static function fromFamily(Family $family): array
    {
        return $family->users->map(
            static fn(User $user): self => new self(
                id: $user->id,
                name: $user->name,
                email: $user->email,
                is_head: $family->head_id === $user->id,
            ),
        )->all();
    }
}
