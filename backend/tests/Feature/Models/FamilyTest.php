<?php

declare(strict_types = 1);

use App\Models\Family;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;

covers(Family::class);

uses(RefreshDatabase::class);

describe('Family', function(): void {
    it('should create a family', function(): void {
        $family = new Family;
        $family->name = 'Smith Family';
        $family->save();

        expect($family)->toBeInstanceOf(Family::class)
            ->and($family->name)->toBe('Smith Family');
    });

    it('should create a family using factory', function(): void {
        $family = Family::factory()->create();

        expect($family)->toBeInstanceOf(Family::class)
            ->and($family->name)->toBeString();
    });

    it('should have multiple users', function(): void {
        $family = Family::factory()->create();
        $users = User::factory()->count(3)->create(['family_id' => $family->id]);

        expect($family->users)->toHaveCount(3)
            ->and($family->users->first())->toBeInstanceOf(User::class);
    });

    it('should have a user that belongs to it', function(): void {
        $family = Family::factory()->create();
        $user = User::factory()->create(['family_id' => $family->id]);

        expect($user->family)->toBeInstanceOf(Family::class)
            ->and($user->family->id)->toBe($family->id);
    });

    describe('invite codes (WR-2123)', function(): void {
        it('should have no invite_codes table and no inviteCodes cascade relation', function(): void {
            expect(Schema::hasTable('invite_codes'))->toBeFalse()
                ->and(Family::cascadeRelations())->not->toContain('inviteCodes');
        });

        it('should recreate invite_codes on rollback and drop it again on migrate', function(): void {
            /** @var Migration $migration */
            $migration = require database_path('migrations/2026_10_10_000001_drop_invite_codes_table.php');

            $migration->down();

            expect(Schema::hasColumns('invite_codes', ['id', 'family_id', 'code', 'generated_by', 'expires_at', 'revoked_at', 'created_at', 'updated_at']))->toBeTrue();

            $migration->up();

            expect(Schema::hasTable('invite_codes'))->toBeFalse();
        });
    });
});
