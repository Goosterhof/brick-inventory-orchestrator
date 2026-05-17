<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('set_parts', function(Blueprint $table): void {
            $table->id();
            $table->foreignId('set_id')->constrained();
            $table->foreignId('part_id')->constrained();
            $table->foreignId('color_id')->constrained();
            $table->integer('quantity')->default(1);
            $table->boolean('is_spare')->default(false);
            $table->string('element_id')->nullable();
            $table->timestamps();

            $table->unique(['set_id', 'part_id', 'color_id', 'is_spare']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('set_parts');
    }
};
