<?php

declare(strict_types = 1);

namespace App\Models;

use App\Auth\AccountProvisioningPermit;
use App\Auth\ProvisioningGuardedBuilder;
use Carbon\CarbonImmutable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\UseEloquentBuilder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Override;

/**
 * @property positive-int         $id
 * @property int                  $family_id
 * @property string               $name
 * @property string               $email
 * @property CarbonImmutable|null $email_verified_at
 * @property string               $password
 * @property string|null          $remember_token
 * @property CarbonImmutable      $created_at
 * @property CarbonImmutable      $updated_at
 * @property Family               $family
 */
#[Hidden([
    'password',
    'remember_token',
])]
#[UseEloquentBuilder(ProvisioningGuardedBuilder::class)]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory;

    /**
     * Get the family that the user belongs to.
     *
     * @return BelongsTo<Family, $this>
     */
    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    /**
     * Relations that must be cascade-deleted when this model is deleted.
     *
     * @return list<string>
     */
    public static function cascadeRelations(): array
    {
        return [];
    }

    /**
     * WR-2128: save() inserts through ProvisioningGuardedBuilder, but saveOrIgnore() goes
     * straight to the base query, so it is guarded here. Neither guard rides the `creating`
     * event, which saveQuietly(), createQuietly() and withoutEvents() skip.
     *
     * @param Builder<static>                     $query
     * @param array<array-key, mixed>|string|null $uniqueBy
     */
    #[Override]
    protected function performInsertOrIgnore(Builder $query, array|string|null $uniqueBy): bool
    {
        AccountProvisioningPermit::assertOpen('a User model insert');

        return parent::performInsertOrIgnore($query, $uniqueBy);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
