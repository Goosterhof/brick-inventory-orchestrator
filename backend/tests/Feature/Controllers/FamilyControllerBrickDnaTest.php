<?php

declare(strict_types = 1);

use App\Http\Controllers\FamilyController;
use App\Models\Color;
use App\Models\Part;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

covers(FamilyController::class);

uses(RefreshDatabase::class);

describe('FamilyController brickDna', function(): void {
    it('should return brick DNA analytics for authenticated user', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $storageOption = StorageOption::factory()->forFamily($family)->create();

        $red = Color::factory()->create(['name' => 'Red', 'rgb' => 'FF0000', 'is_transparent' => false]);
        $blue = Color::factory()->create(['name' => 'Blue', 'rgb' => '0000FF', 'is_transparent' => false]);

        $brick = Part::factory()->create(['part_num' => '3001', 'name' => 'Brick 2x4', 'category' => 'Bricks']);
        $plate = Part::factory()->create(['part_num' => '3020', 'name' => 'Plate 2x4', 'category' => 'Plates']);

        StorageOptionPart::factory()->forStorageOption($storageOption)->forPart($brick)->withColor($red)->create(['quantity' => 50]);
        StorageOptionPart::factory()->forStorageOption($storageOption)->forPart($brick)->withColor($blue)->create(['quantity' => 30]);
        StorageOptionPart::factory()->forStorageOption($storageOption)->forPart($plate)->withColor($red)->create(['quantity' => 20]);

        $response = $this->actingAs($user)->getJson('/api/family/brick-dna');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'top_colors',
                'top_part_types',
                'rarest_parts',
                'diversity_score',
                'total_unique_parts',
                'total_parts_quantity',
            ])
            ->assertJsonPath('total_unique_parts', 3)
            ->assertJsonPath('total_parts_quantity', 100);

        // Verify top colors are ordered by quantity
        $topColors = $response->json('top_colors');
        expect($topColors)->toHaveCount(2);
        expect($topColors[0]['name'])->toBe('Red');
        expect($topColors[0]['total_quantity'])->toBe(70);
        expect($topColors[1]['name'])->toBe('Blue');
        expect($topColors[1]['total_quantity'])->toBe(30);

        // Verify top part types are ordered by quantity
        $topParts = $response->json('top_part_types');
        expect($topParts)->toHaveCount(2);
        expect($topParts[0]['name'])->toBe('Brick 2x4');
        expect($topParts[0]['total_quantity'])->toBe(80);

        // Verify rarest parts (lowest quantity first)
        $rarestParts = $response->json('rarest_parts');
        expect($rarestParts)->toHaveCount(3);
        expect($rarestParts[0]['quantity'])->toBe(20);

        // Diversity score should be between 0 and 1
        $diversityScore = $response->json('diversity_score');
        expect($diversityScore)->toBeGreaterThan(0.0)
            ->and($diversityScore)->toBeLessThanOrEqual(1.0);
    });

    it('should return empty data when family has no stored parts', function(): void {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/family/brick-dna');

        $response->assertStatus(200)
            ->assertJsonPath('top_colors', [])
            ->assertJsonPath('top_part_types', [])
            ->assertJsonPath('rarest_parts', [])
            ->assertJsonPath('diversity_score', 0)
            ->assertJsonPath('total_unique_parts', 0)
            ->assertJsonPath('total_parts_quantity', 0);
    });

    it('should not include parts from other families', function(): void {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $otherStorageOption = StorageOption::factory()->forFamily($otherUser->family)->create();
        StorageOptionPart::factory()->forStorageOption($otherStorageOption)->create(['quantity' => 100]);

        $response = $this->actingAs($user)->getJson('/api/family/brick-dna');

        $response->assertStatus(200)
            ->assertJsonPath('total_unique_parts', 0)
            ->assertJsonPath('total_parts_quantity', 0);
    });

    it('should return 401 when unauthenticated', function(): void {
        $response = $this->getJson('/api/family/brick-dna');

        $response->assertStatus(401);
    });
});
