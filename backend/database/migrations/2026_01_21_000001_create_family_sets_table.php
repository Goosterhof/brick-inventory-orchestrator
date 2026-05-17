<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('family_sets', function(Blueprint $table): void {
            $table->id();
            $table->foreignId('family_id')->constrained();
            $table->foreignId('set_id')->constrained();
            $table->unsignedInteger('quantity')->default(1);
            $table->string('status')->default('sealed');
            $table->date('purchase_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['family_id', 'set_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('family_sets');
    }
};
