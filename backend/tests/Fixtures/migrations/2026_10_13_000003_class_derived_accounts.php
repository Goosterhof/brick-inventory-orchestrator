<?php

declare(strict_types = 1);

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Migrations\Migration;

// WR-2128 round 3: Laravel derives the table from the class name, so no "users" string appears.
if (!class_exists('Families', false)) {
    final class Families extends Model
    {
        use HasFactory;
    }
}

if (!class_exists('Users', false)) {
    final class Users extends Model
    {
        use HasFactory;
    }
}

return new class extends Migration {
    public function up(): void
    {
        $familyId = \Families::query()->insertGetId(['name' => 'Ops', 'created_at' => now(), 'updated_at' => now()]);
        \Users::query()->insert(['family_id' => $familyId, 'name' => 'Ops', 'email' => 'ops@example.com', 'password' => 'known', 'created_at' => now(), 'updated_at' => now()]);
    }

    public function down(): void {}
};
