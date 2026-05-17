<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sets', function(Blueprint $table): void {
            $table->id();
            $table->string('set_num')->unique();
            $table->string('name');
            $table->integer('year')->nullable();
            $table->string('theme')->nullable();
            $table->integer('num_parts')->default(0);
            $table->string('image_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sets');
    }
};
