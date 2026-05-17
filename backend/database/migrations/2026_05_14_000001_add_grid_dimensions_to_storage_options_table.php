<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('storage_options', function(Blueprint $table): void {
            $table->unsignedSmallInteger('grid_rows')->nullable()->after('column');
            $table->unsignedSmallInteger('grid_columns')->nullable()->after('grid_rows');
        });
    }

    public function down(): void
    {
        Schema::table('storage_options', function(Blueprint $table): void {
            $table->dropColumn(['grid_rows', 'grid_columns']);
        });
    }
};
