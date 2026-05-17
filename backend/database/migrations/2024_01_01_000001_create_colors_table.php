<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('colors', function(Blueprint $table): void {
            $table->id();
            $table->integer('rebrickable_id')->unique();
            $table->string('name');
            $table->string('rgb', 6);
            $table->boolean('is_transparent')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('colors');
    }
};
