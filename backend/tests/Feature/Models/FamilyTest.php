<?php

declare(strict_types = 1);

use App\Models\Family;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

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
});
