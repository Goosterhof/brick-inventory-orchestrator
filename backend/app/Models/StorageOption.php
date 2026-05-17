<?php

declare(strict_types = 1);

namespace App\Models;

use App\Contracts\BelongsToFamilyInterface;
use Carbon\Carbon;
use Database\Factories\StorageOptionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property positive-int $id
 * @property int          $family_id
 * @property int|null     $parent_id
 * @property string       $name
 * @property string|null  $description
 * @property int|null     $row
 * @property int|null     $column
 * @property int|null     $grid_rows
 * @property int|null     $grid_columns
 * @property Carbon|null  $created_at
 * @property Carbon|null  $updated_at
 */
class StorageOption extends Model implements BelongsToFamilyInterface
{
    /** @use HasFactory<StorageOptionFactory> */
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
     * @return BelongsTo<StorageOption, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * @return HasMany<StorageOption, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /**
     * @return HasMany<StorageOptionPart, $this>
     */
    public function storageOptionParts(): HasMany
    {
        return $this->hasMany(StorageOptionPart::class);
    }

    /**
     * Relations that must be cascade-deleted when this model is deleted.
     *
     * @return list<string>
     */
    public static function cascadeRelations(): array
    {
        return ['children', 'storageOptionParts'];
    }
}
