<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drop the legacy opaque `theme` string column and add a real FK to the
 * new `themes` catalog. Existing rows lose their theme string — sets resync
 * from Rebrickable on the next user-import or set-fetch and the FK is set
 * by `UpsertSetAction`. Permitted by the shipping order's "no two-phase
 * backfill" decision (theme strings were never user-editable).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('sets', function(Blueprint $table): void {
            $table->dropColumn('theme');
        });

        Schema::table('sets', function(Blueprint $table): void {
            $table->foreignId('theme_id')
                ->nullable()
                ->after('year')
                ->constrained('themes')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sets', function(Blueprint $table): void {
            $table->dropConstrainedForeignId('theme_id');
        });

        Schema::table('sets', function(Blueprint $table): void {
            $table->string('theme')->nullable()->after('year');
        });
    }
};
