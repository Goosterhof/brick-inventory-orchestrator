<?php

declare(strict_types = 1);

namespace App\Models;

use App\Enums\SetSyncStatus;
use Carbon\Carbon;
use Database\Factories\SetFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property positive-int  $id
 * @property string        $set_num
 * @property string        $name
 * @property int|null      $year
 * @property int|null      $theme_id
 * @property int           $num_parts
 * @property string|null   $image_url
 * @property SetSyncStatus $parts_sync_status
 * @property Carbon|null   $parts_synced_at
 * @property string|null   $parts_sync_failed_reason
 * @property Carbon|null   $created_at
 * @property Carbon|null   $updated_at
 * @property Theme|null    $theme
 */
class Set extends Model
{
    /** @use HasFactory<SetFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Theme, $this>
     */
    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    /**
     * @return BelongsToMany<Part, $this>
     */
    public function parts(): BelongsToMany
    {
        return $this->belongsToMany(Part::class, 'set_parts')
            ->withPivot(['color_id', 'quantity', 'is_spare', 'element_id'])
            ->withTimestamps();
    }

    /**
     * @return HasMany<SetPart, $this>
     */
    public function setParts(): HasMany
    {
        return $this->hasMany(SetPart::class);
    }

    /**
     * @return HasMany<FamilySet, $this>
     */
    public function familySets(): HasMany
    {
        return $this->hasMany(FamilySet::class);
    }

    /**
     * Relations that must be cascade-deleted when this model is deleted.
     *
     * @return list<string>
     */
    public static function cascadeRelations(): array
    {
        return ['setParts', 'familySets'];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'parts_sync_status' => SetSyncStatus::class,
            'parts_synced_at' => 'datetime',
        ];
    }
}
