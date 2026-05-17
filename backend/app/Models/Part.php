<?php

declare(strict_types = 1);

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\PartFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property positive-int $id
 * @property string       $part_num
 * @property string       $name
 * @property string|null  $category
 * @property string|null  $image_url
 * @property Carbon|null  $created_at
 * @property Carbon|null  $updated_at
 */
class Part extends Model
{
    /** @use HasFactory<PartFactory> */
    use HasFactory;

    /**
     * @return BelongsToMany<Set, $this>
     */
    public function sets(): BelongsToMany
    {
        return $this->belongsToMany(Set::class, 'set_parts')
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
        return ['setParts', 'storageOptionParts'];
    }
}
