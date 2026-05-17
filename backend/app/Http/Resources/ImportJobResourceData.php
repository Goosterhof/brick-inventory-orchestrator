<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Enums\ImportJobStatus;
use App\Models\ImportJob;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;

/**
 * @extends ResourceData<ImportJob>
 */
final readonly class ImportJobResourceData extends ResourceData
{
    /**
     * @param array<int, array{set_num: string, error: string}>|null $failed_set_details
     */
    public function __construct(
        public int $id,
        public ImportJobStatus $status,
        public int $total_sets,
        public int $processed_sets,
        public int $failed_sets,
        public ?array $failed_set_details,
        public ?DateTimeInterface $started_at,
        public ?DateTimeInterface $completed_at,
        public ?DateTimeInterface $created_at,
    ) {}

    /**
     * @param ImportJob $model
     */
    public static function from(Model $model): static
    {
        return new self(
            id: $model->id,
            status: $model->status,
            total_sets: $model->total_sets,
            processed_sets: $model->processed_sets,
            failed_sets: $model->failed_sets,
            failed_set_details: $model->failed_set_details,
            started_at: $model->started_at,
            completed_at: $model->completed_at,
            created_at: $model->created_at,
        );
    }
}
