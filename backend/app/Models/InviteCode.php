<?php

declare(strict_types = 1);

namespace App\Models;

use App\Contracts\BelongsToFamilyInterface;
use Carbon\Carbon;
use Database\Factories\InviteCodeFactory;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property positive-int $id
 * @property int          $family_id
 * @property string       $code
 * @property int          $generated_by
 * @property Carbon|null  $expires_at
 * @property Carbon|null  $revoked_at
 * @property Carbon|null  $created_at
 * @property Carbon|null  $updated_at
 * @property Family       $family
 * @property User         $generatedBy
 */
class InviteCode extends Model implements BelongsToFamilyInterface
{
    /** @use HasFactory<InviteCodeFactory> */
    use HasFactory;

    public function getFamilyId(): int
    {
        return $this->family_id;
    }

    /**
     * @return BelongsTo<Family, $this>
     */
    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
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
     * Scope to active (non-revoked, non-expired) invite codes.
     *
     * @param Builder<InviteCode> $builder
     *
     * @return Builder<InviteCode>
     */
    #[Scope]
    protected function active(Builder $builder): Builder
    {
        return $builder->whereNull('revoked_at')
            ->where(function(Builder $builder): void {
                $builder->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }
}
