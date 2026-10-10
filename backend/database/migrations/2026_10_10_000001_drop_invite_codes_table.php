<?php

declare(strict_types = 1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * WR-2123: BIO admits nobody (WR-2118), so invite codes have no reader or writer left.
     * No table holds a foreign key to invite_codes; its own keys to families and users go with it.
     */
    public function up(): void
    {
        Schema::dropIfExists('invite_codes');
    }

    public function down(): void
    {
        Schema::create('invite_codes', function(Blueprint $table): void {
            $table->id();
            $table->foreignId('family_id')->constrained('families');
            $table->string('code')->unique();
            $table->foreignId('generated_by')->constrained('users');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->index(['family_id', 'revoked_at', 'expires_at']);
        });
    }
};
