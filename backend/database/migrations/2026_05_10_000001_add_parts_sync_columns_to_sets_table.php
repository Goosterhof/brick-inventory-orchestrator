<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sets', function(Blueprint $table): void {
            $table->string('parts_sync_status')->default('pending');
            $table->timestamp('parts_synced_at')->nullable();
            $table->string('parts_sync_failed_reason')->nullable();

            $table->index('parts_sync_status');
        });

        // Backfill: any set that already has rows in set_parts is considered fully synced.
        // Use a portable IN (SELECT ...) subquery — works in both PostgreSQL and SQLite.
        $connection = Schema::getConnection();
        $expression = $connection->raw('CURRENT_TIMESTAMP');
        $connection->table('sets')
            ->whereIn('id', $connection->table('set_parts')->select('set_id')->distinct())
            ->update([
                'parts_sync_status' => 'completed',
                'parts_synced_at' => $expression,
            ]);
    }

    public function down(): void
    {
        Schema::table('sets', function(Blueprint $table): void {
            $table->dropIndex(['parts_sync_status']);
            $table->dropColumn(['parts_sync_status', 'parts_synced_at', 'parts_sync_failed_reason']);
        });
    }
};
