<?php

declare(strict_types = 1);

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\FamilyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property positive-int      $id
 * @property string            $name
 * @property positive-int|null $head_id
 * @property string|null       $rebrickable_user_token
 * @property Carbon|null       $created_at
 * @property Carbon|null       $updated_at
 * @property User|null         $headUser
 */
class Family extends Model
{
    /** @use HasFactory<FamilyFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<User, $this>
     */
    public function headUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'head_id');
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @return HasMany<StorageOption, $this>
     */
    public function storageOptions(): HasMany
    {
        return $this->hasMany(StorageOption::class);
    }

    /**
     * @return HasMany<FamilySet, $this>
     */
    public function familySets(): HasMany
    {
        return $this->hasMany(FamilySet::class);
    }

    /**
     * @return HasMany<InviteCode, $this>
     */
    public function inviteCodes(): HasMany
    {
        return $this->hasMany(InviteCode::class);
    }

    /**
     * @return HasMany<ImportJob, $this>
     */
    public function importJobs(): HasMany
    {
        return $this->hasMany(ImportJob::class);
    }

    /**
     * Relations that must be cascade-deleted when this model is deleted.
     *
     * @return list<string>
     */
    public static function cascadeRelations(): array
    {
        return ['users', 'storageOptions', 'familySets', 'inviteCodes', 'importJobs'];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rebrickable_user_token' => 'encrypted',
        ];
    }
}
