<?php

declare(strict_types = 1);

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\SetPartFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property positive-int $id
 * @property int          $set_id
 * @property int          $part_id
 * @property int          $color_id
 * @property int          $quantity
 * @property bool         $is_spare
 * @property string|null  $element_id
 * @property Carbon|null  $created_at
 * @property Carbon|null  $updated_at
 * @property Set          $set
 * @property Part         $part
 * @property Color        $color
 */
class SetPart extends Model
{
    /** @use HasFactory<SetPartFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Set, $this>
     */
    public function set(): BelongsTo
    {
        return $this->belongsTo(Set::class);
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

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_spare' => 'boolean',
        ];
    }
}
