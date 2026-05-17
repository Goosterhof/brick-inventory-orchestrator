<?php

declare(strict_types = 1);

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\ColorFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property positive-int $id
 * @property int          $rebrickable_id
 * @property string       $name
 * @property string       $rgb
 * @property bool         $is_transparent
 * @property Carbon|null  $created_at
 * @property Carbon|null  $updated_at
 */
class Color extends Model
{
    /** @use HasFactory<ColorFactory> */
    use HasFactory;

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

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_transparent' => 'boolean',
        ];
    }
}
