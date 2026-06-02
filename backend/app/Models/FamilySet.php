<?php

declare(strict_types = 1);

namespace App\Models;

use App\Contracts\BelongsToFamilyInterface;
use App\Enums\FamilySetStatus;
use Carbon\Carbon;
use Database\Factories\FamilySetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property positive-int    $id
 * @property int             $family_id
 * @property int             $set_id
 * @property int             $quantity
 * @property FamilySetStatus $status
 * @property Carbon|null     $build_started_at
 * @property Carbon|null     $built_at
 * @property Carbon|null     $purchase_date
 * @property string|null     $notes
 * @property Carbon|null     $created_at
 * @property Carbon|null     $updated_at
 * @property Family          $family
 * @property Set             $set
 */
class FamilySet extends Model implements BelongsToFamilyInterface
{
    /** @use HasFactory<FamilySetFactory> */
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
     * @return BelongsTo<Set, $this>
     */
    public function set(): BelongsTo
    {
        return $this->belongsTo(Set::class);
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
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => FamilySetStatus::class,
            'build_started_at' => 'immutable_datetime',
            'built_at' => 'immutable_datetime',
            'purchase_date' => 'date',
            'quantity' => 'integer',
        ];
    }
}
