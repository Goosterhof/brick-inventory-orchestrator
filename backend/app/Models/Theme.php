<?php

declare(strict_types = 1);

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\ThemeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Catalog model for LEGO theme taxonomy from Rebrickable.
 *
 * Themes form a self-referencing tree (e.g. "Star Wars" parent of "Star Wars
 * Episode I"). Sourced via the `themes:sync` Artisan command; not user-editable.
 *
 * @property positive-int $id
 * @property int          $rebrickable_id
 * @property string       $name
 * @property int|null     $parent_id
 * @property Carbon|null  $created_at
 * @property Carbon|null  $updated_at
 */
class Theme extends Model
{
    /** @use HasFactory<ThemeFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Theme, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * @return HasMany<Theme, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /**
     * @return HasMany<Set, $this>
     */
    public function sets(): HasMany
    {
        return $this->hasMany(Set::class);
    }

    /**
     * Relations that must be cascade-deleted when this model is deleted.
     *
     * Themes are catalog data managed by the `themes:sync` command; deletion
     * of a theme is not part of routine warehouse operations. The architecture
     * test requires every HasMany/HasOne to be listed, but no `DeleteThemeAction`
     * exists — the migration's `nullOnDelete` on both `themes.parent_id` and
     * `sets.theme_id` is the actual delete semantics.
     *
     * @return list<string>
     */
    public static function cascadeRelations(): array
    {
        return ['children', 'sets'];
    }
}
