<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Add nullable head_id column
        Schema::table('families', function(Blueprint $table): void {
            $table->foreignId('head_id')->nullable()->constrained('users');
        });

        // Step 2: Backfill existing families with their first user
        DB::statement(<<<'SQL'
                UPDATE families
                SET head_id = (
                    SELECT id FROM users
                    WHERE users.family_id = families.id
                    ORDER BY id
                    LIMIT 1
                )
                WHERE head_id IS NULL
            SQL);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('families', function(Blueprint $table): void {
            $table->dropForeign(['head_id']);
            $table->dropColumn('head_id');
        });
    }
};
