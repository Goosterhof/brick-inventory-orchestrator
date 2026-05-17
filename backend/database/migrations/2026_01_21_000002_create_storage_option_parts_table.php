<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('storage_option_parts', function(Blueprint $table): void {
            $table->id();
            $table->foreignId('storage_option_id')->constrained();
            $table->foreignId('part_id')->constrained();
            $table->foreignId('color_id')->nullable()->constrained();
            $table->unsignedInteger('quantity')->default(0);
            $table->timestamps();

            $table->unique(['storage_option_id', 'part_id', 'color_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storage_option_parts');
    }
};
