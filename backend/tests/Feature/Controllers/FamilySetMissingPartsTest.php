<?php

declare(strict_types = 1);

use App\Enums\FamilySetStatus;
use App\Http\Controllers\FamilySetController;
use App\Models\Color;
use App\Models\FamilySet;
use App\Models\Part;
use App\Models\Set;
use App\Models\SetPart;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

covers(FamilySetController::class);

/**
 * Convenience: build a non-spare set_parts row without touching mass-assignment rules.
 */
function makeSetPart(Set $set, Part $part, Color $color, int $quantity, bool $isSpare = false): SetPart
{
    $setPart = new SetPart;
    $setPart->set_id = $set->id;
    $setPart->part_id = $part->id;
    $setPart->color_id = $color->id;
    $setPart->quantity = $quantity;
    $setPart->is_spare = $isSpare;
    $setPart->save();

    return $setPart;
}

describe('FamilySetController missingParts', function(): void {
    it('should return 401 when unauthenticated', function(): void {
        $response = $this->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(401);
    });

    it('should return empty envelope when family has no sets', function(): void {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertExactJson([
                'shortfalls' => [],
                'unknown_family_set_ids' => [],
            ]);
    });

    it('should exclude wishlist sets from aggregation and unknowns', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        // A wishlist set whose parts are never fetched — must NOT appear in unknowns.
        FamilySet::factory()->forFamily($family)->create([
            'status' => FamilySetStatus::Wishlist,
        ]);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertExactJson([
                'shortfalls' => [],
                'unknown_family_set_ids' => [],
            ]);
    });

    it('should surface un-synced non-wishlist family_sets in unknownFamilySetIds', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '42100-1']);
        $familySet = FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
        ]);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertJsonPath('shortfalls', [])
            ->assertJsonPath('unknown_family_set_ids', [(string) $familySet->id]);
    });

    it('should compute a single-set partial shortfall with no storage', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '75192-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::InProgress,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create(['name' => 'Red', 'rgb' => 'C91A09']);
        $part = Part::factory()->create([
            'part_num' => '3001',
            'name' => 'Brick 2 x 4',
            'image_url' => 'https://example.test/3001.png',
        ]);

        makeSetPart($set, $part, $color, 5);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'shortfalls')
            ->assertJsonPath('shortfalls.0.part_id', $part->id)
            ->assertJsonPath('shortfalls.0.part_num', '3001')
            ->assertJsonPath('shortfalls.0.color_id', $color->id)
            ->assertJsonPath('shortfalls.0.part_name', 'Brick 2 x 4')
            ->assertJsonPath('shortfalls.0.color_name', 'Red')
            ->assertJsonPath('shortfalls.0.color_hex', 'C91A09')
            ->assertJsonPath('shortfalls.0.part_image_url', 'https://example.test/3001.png')
            ->assertJsonPath('shortfalls.0.quantity_needed', 5)
            ->assertJsonPath('shortfalls.0.quantity_stored', 0)
            ->assertJsonPath('shortfalls.0.shortfall', 5)
            ->assertJsonPath('shortfalls.0.needed_by_set_nums', ['75192-1'])
            ->assertJsonPath('unknown_family_set_ids', []);
    });

    it('should subtract stored quantities from needed and exclude zero shortfalls', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '10294-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create();
        $fullyStockedPart = Part::factory()->create();
        $partiallyStockedPart = Part::factory()->create();

        // Fully satisfied: need 10, stored 10 — MUST be excluded from response.
        makeSetPart($set, $fullyStockedPart, $color, 10);
        // Partially satisfied: need 8, stored 3 → shortfall 5.
        makeSetPart($set, $partiallyStockedPart, $color, 8);

        $storage = StorageOption::factory()->forFamily($family)->create();
        StorageOptionPart::factory()->forStorageOption($storage)
            ->forPart($fullyStockedPart)->withColor($color)->create(['quantity' => 10]);
        StorageOptionPart::factory()->forStorageOption($storage)
            ->forPart($partiallyStockedPart)->withColor($color)->create(['quantity' => 3]);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'shortfalls')
            ->assertJsonPath('shortfalls.0.part_num', $partiallyStockedPart->part_num)
            ->assertJsonPath('shortfalls.0.quantity_needed', 8)
            ->assertJsonPath('shortfalls.0.quantity_stored', 3)
            ->assertJsonPath('shortfalls.0.shortfall', 5);
    });

    it('should respect family_sets.quantity multiplicity (two copies => 2x parts)', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '31120-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 2,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();

        // Each copy needs 250 → owning 2 needs 500. No storage means full shortfall.
        makeSetPart($set, $part, $color, 250);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'shortfalls')
            ->assertJsonPath('shortfalls.0.quantity_needed', 500)
            ->assertJsonPath('shortfalls.0.quantity_stored', 0)
            ->assertJsonPath('shortfalls.0.shortfall', 500);
    });

    it('should stack shortfalls for the same part+color across multiple owned sets', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $setA = Set::factory()->create(['set_num' => '75192-1']);
        $setB = Set::factory()->create(['set_num' => '10281-1']);
        FamilySet::factory()->forFamily($family)->forSet($setA)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 1,
        ]);
        FamilySet::factory()->forFamily($family)->forSet($setB)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create();
        $sharedPart = Part::factory()->create();

        makeSetPart($setA, $sharedPart, $color, 7);
        makeSetPart($setB, $sharedPart, $color, 4);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'shortfalls')
            ->assertJsonPath('shortfalls.0.quantity_needed', 11)
            ->assertJsonPath('shortfalls.0.shortfall', 11);

        $setNums = $response->json('shortfalls.0.needed_by_set_nums');
        expect($setNums)->toBeArray()
            ->and($setNums)->toContain('75192-1', '10281-1')
            ->and($setNums)->toHaveCount(2);
    });

    it('should exclude spare parts from needed aggregation', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '21318-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Sealed,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create();
        $regularPart = Part::factory()->create();
        $sparePart = Part::factory()->create();

        makeSetPart($set, $regularPart, $color, 3);
        makeSetPart($set, $sparePart, $color, 1, isSpare: true);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'shortfalls')
            ->assertJsonPath('shortfalls.0.part_num', $regularPart->part_num);
    });

    it('should not leak shortfalls from other families', function(): void {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $set = Set::factory()->create(['set_num' => '42100-1']);
        FamilySet::factory()->forFamily($other->family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();
        makeSetPart($set, $part, $color, 50);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertExactJson([
                'shortfalls' => [],
                'unknown_family_set_ids' => [],
            ]);
    });

    it("should not subtract another family's storage against the current family's needs", function(): void {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '10281-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();

        makeSetPart($set, $part, $color, 6);

        // Other family stores the part — MUST NOT reduce this family's shortfall.
        $otherStorage = StorageOption::factory()->forFamily($other->family)->create();
        StorageOptionPart::factory()->forStorageOption($otherStorage)
            ->forPart($part)->withColor($color)->create(['quantity' => 6]);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertJsonPath('shortfalls.0.quantity_stored', 0)
            ->assertJsonPath('shortfalls.0.shortfall', 6);
    });

    it('should return null part_image_url when parts.image_url is null', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '10294-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create(['image_url' => null]);

        makeSetPart($set, $part, $color, 2);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertJsonPath('shortfalls.0.part_image_url', null);
    });

    it('should report fully-satisfied collection as an empty shortfall list', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '10294-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();

        makeSetPart($set, $part, $color, 4);

        $storage = StorageOption::factory()->forFamily($family)->create();
        StorageOptionPart::factory()->forStorageOption($storage)
            ->forPart($part)->withColor($color)->create(['quantity' => 4]);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertExactJson([
                'shortfalls' => [],
                'unknown_family_set_ids' => [],
            ]);
    });

    it('should cap shortfall at zero when storage exceeds needs', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '10281-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();

        makeSetPart($set, $part, $color, 3);

        $storage = StorageOption::factory()->forFamily($family)->create();
        StorageOptionPart::factory()->forStorageOption($storage)
            ->forPart($part)->withColor($color)->create(['quantity' => 99]);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertExactJson([
                'shortfalls' => [],
                'unknown_family_set_ids' => [],
            ]);
    });

    it('should mix known shortfalls with unknown family_sets in a single response', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $syncedSet = Set::factory()->create(['set_num' => '75192-1']);
        $unsyncedSet = Set::factory()->create(['set_num' => '42100-1']);

        FamilySet::factory()->forFamily($family)->forSet($syncedSet)->create([
            'status' => FamilySetStatus::Built,
        ]);
        $unsyncedFamilySet = FamilySet::factory()->forFamily($family)->forSet($unsyncedSet)->create([
            'status' => FamilySetStatus::Sealed,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();
        makeSetPart($syncedSet, $part, $color, 2);

        $response = $this->actingAs($user)->getJson('/api/family-sets/missing-parts');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'shortfalls')
            ->assertJsonPath('unknown_family_set_ids', [(string) $unsyncedFamilySet->id]);
    });
});
