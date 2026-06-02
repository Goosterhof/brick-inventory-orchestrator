<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('family_sets', function(Blueprint $table): void {
            $table->timestamp('build_started_at')->nullable()->after('status');
            $table->timestamp('built_at')->nullable()->after('build_started_at');
        });
    }

    public function down(): void
    {
        Schema::table('family_sets', function(Blueprint $table): void {
            $table->dropColumn(['build_started_at', 'built_at']);
        });
    }
};
