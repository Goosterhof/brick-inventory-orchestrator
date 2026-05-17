<?php

declare(strict_types = 1);

use App\Enums\FamilySetStatus;
use App\Http\Controllers\FamilyController;
use App\Models\Color;
use App\Models\FamilySet;
use App\Models\Part;
use App\Models\Set;
use App\Models\SetPart;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

covers(FamilyController::class);

/**
 * Convenience: build a non-spare set_parts row without touching mass-assignment rules.
 * Mirrors the helper used in FamilySetMissingPartsTest.
 */
function makeUsageSetPart(Set $set, Part $part, Color $color, int $quantity, bool $isSpare = false): SetPart
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

describe('FamilyController partUsage', function(): void {
    it('should return 401 when unauthenticated', function(): void {
        $response = $this->getJson('/api/family/parts/3001/4/usage');

        $response->assertStatus(401);
    });

    it('should return 200 with empty usages when no sets need the part', function(): void {
        $user = User::factory()->create();

        $color = Color::factory()->create(['name' => 'Red', 'rgb' => 'C91A09']);
        Part::factory()->create([
            'part_num' => '3001',
            'name' => 'Brick 2 x 4',
            'image_url' => 'https://example.test/3001.png',
        ]);

        $response = $this->actingAs($user)->getJson('/api/family/parts/3001/' . $color->id . '/usage');

        $response->assertStatus(200)
            ->assertJsonPath('part_num', '3001')
            ->assertJsonPath('color_id', $color->id)
            ->assertJsonPath('part_name', 'Brick 2 x 4')
            ->assertJsonPath('part_image_url', 'https://example.test/3001.png')
            ->assertJsonPath('color_name', 'Red')
            ->assertJsonPath('color_hex', 'C91A09')
            ->assertJsonPath('usages', []);
    });

    it('should return 200 with null metadata when part is unknown to the catalog', function(): void {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/family/parts/9999/4/usage');

        $response->assertStatus(200)
            ->assertJsonPath('part_num', '9999')
            ->assertJsonPath('color_id', 4)
            ->assertJsonPath('part_name', null)
            ->assertJsonPath('part_image_url', null)
            ->assertJsonPath('color_name', null)
            ->assertJsonPath('color_hex', null)
            ->assertJsonPath('usages', []);
    });

    it('should return one usage entry per non-wishlist set that needs the part', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '75192-1', 'name' => 'Millennium Falcon']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create(['name' => 'Blue', 'rgb' => '0055BF']);
        $part = Part::factory()->create(['part_num' => '3020', 'name' => 'Plate 2 x 4']);

        makeUsageSetPart($set, $part, $color, 4);

        $response = $this->actingAs($user)->getJson('/api/family/parts/3020/' . $color->id . '/usage');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'usages')
            ->assertJsonPath('usages.0.set_num', '75192-1')
            ->assertJsonPath('usages.0.set_name', 'Millennium Falcon')
            ->assertJsonPath('usages.0.status', 'built')
            ->assertJsonPath('usages.0.quantity_needed', 4)
            ->assertJsonPath('usages.0.quantity_stored', 0)
            ->assertJsonPath('usages.0.shortfall', 4);
    });

    it('should respect family_sets.quantity multiplicity (two copies => 2x parts needed)', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '31120-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 2,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create(['part_num' => '3001']);

        // Each copy needs 6 → owning 2 needs 12.
        makeUsageSetPart($set, $part, $color, 6);

        $response = $this->actingAs($user)->getJson('/api/family/parts/3001/' . $color->id . '/usage');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'usages')
            ->assertJsonPath('usages.0.quantity_needed', 12);
    });

    it('should subtract family-wide stored quantity from per-set need to compute shortfall', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '10281-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Sealed,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();
        makeUsageSetPart($set, $part, $color, 8);

        $storage = StorageOption::factory()->forFamily($family)->create();
        StorageOptionPart::factory()->forStorageOption($storage)
            ->forPart($part)->withColor($color)->create(['quantity' => 3]);

        $response = $this->actingAs($user)->getJson('/api/family/parts/' . $part->part_num . '/' . $color->id . '/usage');

        $response->assertStatus(200)
            ->assertJsonPath('usages.0.quantity_needed', 8)
            ->assertJsonPath('usages.0.quantity_stored', 3)
            ->assertJsonPath('usages.0.shortfall', 5);
    });

    it('should return zero shortfall when storage covers the per-set need', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '10281-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();
        makeUsageSetPart($set, $part, $color, 3);

        $storage = StorageOption::factory()->forFamily($family)->create();
        StorageOptionPart::factory()->forStorageOption($storage)
            ->forPart($part)->withColor($color)->create(['quantity' => 99]);

        $response = $this->actingAs($user)->getJson('/api/family/parts/' . $part->part_num . '/' . $color->id . '/usage');

        $response->assertStatus(200)
            ->assertJsonPath('usages.0.shortfall', 0);
    });

    it('should exclude wishlist sets from usages', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '42100-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Wishlist,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();
        makeUsageSetPart($set, $part, $color, 7);

        $response = $this->actingAs($user)->getJson('/api/family/parts/' . $part->part_num . '/' . $color->id . '/usage');

        $response->assertStatus(200)
            ->assertJsonPath('usages', []);
    });

    it('should exclude spare set_parts from usages', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '21318-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();
        makeUsageSetPart($set, $part, $color, 1, isSpare: true);

        $response = $this->actingAs($user)->getJson('/api/family/parts/' . $part->part_num . '/' . $color->id . '/usage');

        $response->assertStatus(200)
            ->assertJsonPath('usages', []);
    });

    it('should not leak usages from other families', function(): void {
        $user = User::factory()->create();
        $other = User::factory()->create();

        $set = Set::factory()->create(['set_num' => '42100-1']);
        FamilySet::factory()->forFamily($other->family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();
        makeUsageSetPart($set, $part, $color, 50);

        $response = $this->actingAs($user)->getJson('/api/family/parts/' . $part->part_num . '/' . $color->id . '/usage');

        $response->assertStatus(200)
            ->assertJsonPath('usages', []);
    });

    it("should not subtract another family's storage from this family's need", function(): void {
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
        makeUsageSetPart($set, $part, $color, 6);

        $otherStorage = StorageOption::factory()->forFamily($other->family)->create();
        StorageOptionPart::factory()->forStorageOption($otherStorage)
            ->forPart($part)->withColor($color)->create(['quantity' => 6]);

        $response = $this->actingAs($user)->getJson('/api/family/parts/' . $part->part_num . '/' . $color->id . '/usage');

        $response->assertStatus(200)
            ->assertJsonPath('usages.0.quantity_stored', 0)
            ->assertJsonPath('usages.0.shortfall', 6);
    });

    it('should not match a different color of the same part', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $set = Set::factory()->create(['set_num' => '10281-1']);
        FamilySet::factory()->forFamily($family)->forSet($set)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 1,
        ]);

        $red = Color::factory()->create(['name' => 'Red']);
        $blue = Color::factory()->create(['name' => 'Blue']);
        $part = Part::factory()->create();

        // The set needs the part in red, but we ask for blue — usages must be empty.
        makeUsageSetPart($set, $part, $red, 5);

        $response = $this->actingAs($user)->getJson('/api/family/parts/' . $part->part_num . '/' . $blue->id . '/usage');

        $response->assertStatus(200)
            ->assertJsonPath('color_name', 'Blue')
            ->assertJsonPath('usages', []);
    });

    it('should return etag and cache-control private headers for repeat fetches', function(): void {
        $user = User::factory()->create();

        Part::factory()->create(['part_num' => '3001']);
        Color::factory()->create(['id' => 4]);

        $first = $this->actingAs($user)->getJson('/api/family/parts/3001/4/usage');
        $first->assertStatus(200)
            ->assertHeader('cache-control', 'max-age=60, private');

        $etag = $first->headers->get('etag');
        expect($etag)->not->toBeNull();

        $second = $this->actingAs($user)
            ->withHeader('If-None-Match', (string) $etag)
            ->getJson('/api/family/parts/3001/4/usage');

        $second->assertStatus(304);
    });

    it('should issue at most three queries regardless of how many sets need the part', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        // Five owned non-wishlist sets, all needing the same (part, color) — proves the
        // Action's query budget is bounded and does NOT scale with set count.
        $color = Color::factory()->create();
        $part = Part::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $set = Set::factory()->create();
            FamilySet::factory()->forFamily($family)->forSet($set)->create([
                'status' => FamilySetStatus::Built,
                'quantity' => 1,
            ]);
            makeUsageSetPart($set, $part, $color, 2);
        }

        $storage = StorageOption::factory()->forFamily($family)->create();
        StorageOptionPart::factory()->forStorageOption($storage)
            ->forPart($part)->withColor($color)->create(['quantity' => 4]);

        $queries = [];
        DB::listen(function($query) use (&$queries): void {
            $queries[] = $query->sql;
        });

        $response = $this->actingAs($user)->getJson('/api/family/parts/' . $part->part_num . '/' . $color->id . '/usage');

        $response->assertStatus(200)->assertJsonCount(5, 'usages');

        // The Action emits exactly three queries: parts ⨝ colors metadata, the per-set
        // SUM aggregate, and the family-wide stored SUM. Auth + middleware queries are
        // filtered out — we only count queries that touch the Action's three target tables.
        $actionQueries = array_filter(
            $queries,
            static fn(string $sql): bool => str_contains($sql, 'from "parts"')
                || str_contains($sql, 'from "set_parts"')
                || str_contains($sql, 'from "storage_option_parts"'),
        );

        expect($actionQueries)->toHaveCount(3);
    });

    it('should aggregate two non-wishlist family_sets into two distinct entries', function(): void {
        $user = User::factory()->create();
        $family = $user->family;

        $setA = Set::factory()->create(['set_num' => '75192-1', 'name' => 'A']);
        $setB = Set::factory()->create(['set_num' => '10281-1', 'name' => 'B']);
        FamilySet::factory()->forFamily($family)->forSet($setA)->create([
            'status' => FamilySetStatus::Built,
            'quantity' => 1,
        ]);
        FamilySet::factory()->forFamily($family)->forSet($setB)->create([
            'status' => FamilySetStatus::InProgress,
            'quantity' => 1,
        ]);

        $color = Color::factory()->create();
        $part = Part::factory()->create();

        makeUsageSetPart($setA, $part, $color, 3);
        makeUsageSetPart($setB, $part, $color, 7);

        $response = $this->actingAs($user)->getJson('/api/family/parts/' . $part->part_num . '/' . $color->id . '/usage');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'usages');

        $usages = $response->json('usages');
        $bySetNum = collect($usages)->keyBy('set_num');

        expect($bySetNum)->toHaveKeys(['75192-1', '10281-1'])
            ->and($bySetNum['75192-1']['quantity_needed'])->toBe(3)
            ->and($bySetNum['75192-1']['status'])->toBe('built')
            ->and($bySetNum['10281-1']['quantity_needed'])->toBe(7)
            ->and($bySetNum['10281-1']['status'])->toBe('in_progress');
    });
});
