<?php

declare(strict_types = 1);

namespace App\Models;

use App\Contracts\BelongsToFamilyInterface;
use App\Enums\ImportJobStatus;
use Carbon\Carbon;
use Database\Factories\ImportJobFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property positive-int                                           $id
 * @property int                                                    $family_id
 * @property ImportJobStatus                                        $status
 * @property int                                                    $total_sets
 * @property int                                                    $processed_sets
 * @property int                                                    $failed_sets
 * @property array<int, array{set_num: string, error: string}>|null $failed_set_details
 * @property Carbon|null                                            $started_at
 * @property Carbon|null                                            $completed_at
 * @property Carbon|null                                            $created_at
 * @property Carbon|null                                            $updated_at
 * @property Family                                                 $family
 */
class ImportJob extends Model implements BelongsToFamilyInterface
{
    /** @use HasFactory<ImportJobFactory> */
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
            'status' => ImportJobStatus::class,
            'total_sets' => 'integer',
            'processed_sets' => 'integer',
            'failed_sets' => 'integer',
            'failed_set_details' => 'array',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}
