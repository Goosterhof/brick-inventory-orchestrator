<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * The composite unique index on (storage_option_id, part_id, color_id) does not
     * guard null-color rows: PostgreSQL and SQLite treat NULLs as distinct in unique
     * indexes, so two (storage_option_id, part_id, NULL) rows never collide and the
     * UniqueConstraintViolationException race guard in AssignPartToStorageAction is
     * dead for null-color assignments. This partial unique index closes that hole.
     */
    public function up(): void
    {
        $connection = Schema::getConnection();

        $duplicates = $connection->table('storage_option_parts')
            ->whereNull('color_id')
            ->groupBy('storage_option_id', 'part_id')
            ->havingRaw('COUNT(*) > 1')
            ->selectRaw('storage_option_id, part_id, COUNT(*) AS occurrences')
            ->get();

        if ($duplicates->isNotEmpty()) {
            $tuples = $duplicates->map(function(\stdClass $row): string {
                $storageOptionId = (int) $row->storage_option_id; // @phpstan-ignore cast.int
                $partId = (int) $row->part_id; // @phpstan-ignore cast.int
                $occurrences = (int) $row->occurrences; // @phpstan-ignore cast.int

                return \sprintf('(storage_option_id=%d, part_id=%d, rows=%d)', $storageOptionId, $partId, $occurrences);
            })->implode(', ');

            throw new \RuntimeException('Cannot create unique index "storage_option_parts_null_color_unique": storage_option_parts already contains duplicate null-color rows for ' . $tuples . '. Manually consolidate each tuple into a single row (sum the quantities into one row, delete the extras), then re-run this migration. This migration never deletes or merges rows itself.');
        }

        // Partial unique index — identical syntax on PostgreSQL and SQLite.
        $connection->statement(
            'CREATE UNIQUE INDEX storage_option_parts_null_color_unique '
            . 'ON storage_option_parts (storage_option_id, part_id) '
            . 'WHERE color_id IS NULL',
        );
    }

    public function down(): void
    {
        Schema::getConnection()->statement('DROP INDEX IF EXISTS storage_option_parts_null_color_unique');
    }
};
