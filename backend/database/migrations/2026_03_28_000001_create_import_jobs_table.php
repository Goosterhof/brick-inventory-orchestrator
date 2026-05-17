<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('import_jobs', function(Blueprint $table): void {
            $table->id();
            $table->foreignId('family_id')->constrained('families');
            $table->string('status')->default('pending');
            $table->unsignedInteger('total_sets')->default(0);
            $table->unsignedInteger('processed_sets')->default(0);
            $table->unsignedInteger('failed_sets')->default(0);
            $table->json('failed_set_details')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['family_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_jobs');
    }
};
