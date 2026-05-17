<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // SyncSetPartsJob::failed() truncates the throwable message to 500
        // characters before persisting. The original migration declared the
        // column with the default Schema string() length of 255, so any
        // throwable message between 256-500 characters overflows.
        Schema::table('sets', function(Blueprint $table): void {
            $table->string('parts_sync_failed_reason', 500)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('sets', function(Blueprint $table): void {
            $table->string('parts_sync_failed_reason')->nullable()->change();
        });
    }
};
