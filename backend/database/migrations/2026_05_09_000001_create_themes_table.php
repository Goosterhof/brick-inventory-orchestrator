<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('themes', function(Blueprint $table): void {
            $table->id();
            $table->integer('rebrickable_id')->unique();
            $table->string('name');
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('themes')
                ->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('themes');
    }
};
