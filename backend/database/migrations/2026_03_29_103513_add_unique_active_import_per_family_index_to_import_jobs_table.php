<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement(
            'CREATE UNIQUE INDEX import_jobs_family_active_unique '
            . 'ON import_jobs (family_id) '
            . "WHERE status IN ('pending', 'in_progress')",
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS import_jobs_family_active_unique');
    }
};
