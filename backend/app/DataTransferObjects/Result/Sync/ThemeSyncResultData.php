<?php

declare(strict_types = 1);

namespace App\DataTransferObjects\Result\Sync;

/**
 * Receipt for the `themes:sync` Artisan command.
 *
 * - $fetched: total themes pulled from Rebrickable across all pages
 * - $upserted: themes inserted or updated in the local catalog (first pass)
 * - $parentsLinked: themes whose parent_id FK was resolved on the second pass
 */
final readonly class ThemeSyncResultData
{
    public function __construct(
        public int $fetched,
        public int $upserted,
        public int $parentsLinked,
    ) {}
}
