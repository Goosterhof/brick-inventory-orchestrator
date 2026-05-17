<?php

declare(strict_types = 1);

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\StorageOptionPartFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property positive-int       $id
 * @property int                $storage_option_id
 * @property int                $part_id
 * @property int|null           $color_id
 * @property int                $quantity
 * @property Carbon|null        $created_at
 * @property Carbon|null        $updated_at
 * @property StorageOption|null $storageOption
 * @property Part               $part
 * @property Color|null         $color
 */
class StorageOptionPart extends Model
{
    /** @use HasFactory<StorageOptionPartFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<StorageOption, $this>
     */
    public function storageOption(): BelongsTo
    {
        return $this->belongsTo(StorageOption::class);
    }

    /**
     * @return BelongsTo<Part, $this>
     */
    public function part(): BelongsTo
    {
        return $this->belongsTo(Part::class);
    }

    /**
     * @return BelongsTo<Color, $this>
     */
    public function color(): BelongsTo
    {
        return $this->belongsTo(Color::class);
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
}
