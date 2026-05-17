<?php

declare(strict_types = 1);

use App\Http\Controllers\StorageOptionController;
use App\Models\Part;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

covers(StorageOptionController::class);

uses(RefreshDatabase::class);

describe('StorageOptionController', function(): void {
    describe('index', function(): void {
        it('should return storage options for the authenticated user family', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create([
                'family_id' => $user->family_id,
                'name' => 'Cabinet 1',
            ]);

            $response = $this->actingAs($user)->getJson('/api/storage-options');

            $response->assertStatus(200)
                ->assertJsonCount(1)
                ->assertJsonPath('0.name', 'Cabinet 1');
        });

        it('should not return storage options from other families', function(): void {
            $user = User::factory()->create();
            StorageOption::factory()->create(['name' => 'Other Family Cabinet']);

            $response = $this->actingAs($user)->getJson('/api/storage-options');

            $response->assertStatus(200)
                ->assertJsonCount(0);
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->getJson('/api/storage-options');

            $response->assertStatus(401);
        });

        it('should return child_ids for nested children', function(): void {
            $user = User::factory()->create();
            $cabinet = StorageOption::factory()->create([
                'family_id' => $user->family_id,
                'name' => 'Cabinet 1',
            ]);
            $drawer = StorageOption::factory()->create([
                'family_id' => $user->family_id,
                'parent_id' => $cabinet->id,
                'name' => 'Drawer A1',
            ]);

            $response = $this->actingAs($user)->getJson('/api/storage-options');

            $response->assertStatus(200)
                ->assertJsonCount(1)
                ->assertJsonPath('0.child_ids.0', $drawer->id);
        });
    });

    describe('store', function(): void {
        it('should create a storage option', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => 'New Cabinet',
                'description' => 'A test cabinet',
            ]);

            $response->assertStatus(201)
                ->assertJsonPath('name', 'New Cabinet')
                ->assertJsonPath('description', 'A test cabinet');

            $this->assertDatabaseHas('storage_options', [
                'family_id' => $user->family_id,
                'name' => 'New Cabinet',
            ]);
        });

        it('should create a storage option with parent', function(): void {
            $user = User::factory()->create();
            $cabinet = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);

            $response = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => 'Drawer A1',
                'parent_id' => $cabinet->id,
                'row' => 1,
                'column' => 1,
            ]);

            $response->assertStatus(201)
                ->assertJsonPath('parent_id', $cabinet->id)
                ->assertJsonPath('row', 1)
                ->assertJsonPath('column', 1);
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->postJson('/api/storage-options', [
                'name' => 'New Cabinet',
            ]);

            $response->assertStatus(401);
        });

        it('should require name', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/storage-options', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['name']);
        });

        it('should return 422 when parent_id belongs to another family', function(): void {
            $user = User::factory()->create();
            $otherFamilyOption = StorageOption::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => 'Child Drawer',
                'parent_id' => $otherFamilyOption->id,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['parent_id']);
        });

        it('should pre-seed 30 drawer children for a 6 column by 5 row grid', function(): void {
            $user = User::factory()->create();
            $cabinet = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);

            $response = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => '6 by 5 Section',
                'parent_id' => $cabinet->id,
                'grid_rows' => 5,
                'grid_columns' => 6,
            ]);

            $response->assertStatus(201)
                ->assertJsonPath('grid_rows', 5)
                ->assertJsonPath('grid_columns', 6);

            $sectionId = $response->json('id');

            // Children count: every drawer in the 5x6 grid
            expect(StorageOption::query()->where('parent_id', $sectionId)->count())->toBe(30);

            // R1C1 — the lower bound of both loops
            $this->assertDatabaseHas('storage_options', [
                'parent_id' => $sectionId,
                'family_id' => $user->family_id,
                'name' => 'R1C1',
                'row' => 1,
                'column' => 1,
                'grid_rows' => null,
                'grid_columns' => null,
            ]);

            // R5C6 — the corner drawer, proving both loop upper bounds
            $this->assertDatabaseHas('storage_options', [
                'parent_id' => $sectionId,
                'family_id' => $user->family_id,
                'name' => 'R5C6',
                'row' => 5,
                'column' => 6,
            ]);

            // A row-2 cell to confirm row-major coordinate math
            $this->assertDatabaseHas('storage_options', [
                'parent_id' => $sectionId,
                'name' => 'R2C1',
                'row' => 2,
                'column' => 1,
            ]);
        });

        it('should pre-seed 9 drawer children for a 3 by 3 grid', function(): void {
            $user = User::factory()->create();
            $cabinet = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);

            $response = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => '3 by 3 Section',
                'parent_id' => $cabinet->id,
                'grid_rows' => 3,
                'grid_columns' => 3,
            ]);

            $response->assertStatus(201);

            $sectionId = $response->json('id');

            expect(StorageOption::query()->where('parent_id', $sectionId)->count())->toBe(9);

            // Corner drawer R3C3
            $this->assertDatabaseHas('storage_options', [
                'parent_id' => $sectionId,
                'name' => 'R3C3',
                'row' => 3,
                'column' => 3,
            ]);
        });

        it('should return 422 when grid_rows is set without grid_columns', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => 'Half-set Section',
                'grid_rows' => 5,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['grid_columns']);
        });

        it('should return 422 when grid_columns is set without grid_rows', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => 'Half-set Section',
                'grid_columns' => 6,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['grid_rows']);
        });

        it('should return 422 when grid_rows is zero', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => 'Zero-row Section',
                'grid_rows' => 0,
                'grid_columns' => 6,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['grid_rows']);
        });

        it('should return 422 when grid_rows exceeds 100', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => 'Over-cap Section',
                'grid_rows' => 101,
                'grid_columns' => 6,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['grid_rows']);
        });

        it('should return 422 when child row exceeds parent grid_rows', function(): void {
            $user = User::factory()->create();
            $cabinet = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);
            $section = StorageOption::factory()->create([
                'family_id' => $user->family_id,
                'parent_id' => $cabinet->id,
                'grid_rows' => 5,
                'grid_columns' => 6,
            ]);

            $response = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => 'Manual Drawer',
                'parent_id' => $section->id,
                'row' => 6,
                'column' => 1,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['row']);
        });

        it('should return 422 when child column exceeds parent grid_columns', function(): void {
            $user = User::factory()->create();
            $cabinet = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);
            $section = StorageOption::factory()->create([
                'family_id' => $user->family_id,
                'parent_id' => $cabinet->id,
                'grid_rows' => 5,
                'grid_columns' => 6,
            ]);

            $response = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => 'Manual Drawer',
                'parent_id' => $section->id,
                'row' => 1,
                'column' => 7,
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['column']);
        });
    });

    describe('show', function(): void {
        it('should return a storage option', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create([
                'family_id' => $user->family_id,
                'name' => 'Cabinet 1',
            ]);

            $response = $this->actingAs($user)->getJson('/api/storage-options/' . $storageOption->id);

            $response->assertStatus(200)
                ->assertJsonPath('name', 'Cabinet 1');
        });

        it('should return 404 for storage option from another family', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create(['name' => 'Other Family Cabinet']);

            $response = $this->actingAs($user)->getJson('/api/storage-options/' . $storageOption->id);

            $response->assertStatus(404);
        });

        it('should return 401 when unauthenticated', function(): void {
            $storageOption = StorageOption::factory()->create();

            $response = $this->getJson('/api/storage-options/' . $storageOption->id);

            $response->assertStatus(401);
        });
    });

    describe('update', function(): void {
        it('should update a storage option', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create([
                'family_id' => $user->family_id,
                'name' => 'Old Name',
            ]);

            $response = $this->actingAs($user)->putJson('/api/storage-options/' . $storageOption->id, [
                'name' => 'New Name',
                'description' => 'Updated description',
            ]);

            $response->assertStatus(200)
                ->assertJsonPath('name', 'New Name')
                ->assertJsonPath('description', 'Updated description');

            $this->assertDatabaseHas('storage_options', [
                'id' => $storageOption->id,
                'name' => 'New Name',
                'description' => 'Updated description',
            ]);
        });

        it('should return 404 for storage option from another family', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create(['name' => 'Other Family Cabinet']);

            $response = $this->actingAs($user)->putJson('/api/storage-options/' . $storageOption->id, [
                'name' => 'Hacked Name',
            ]);

            $response->assertStatus(404);
        });

        it('should return 401 when unauthenticated', function(): void {
            $storageOption = StorageOption::factory()->create();

            $response = $this->putJson('/api/storage-options/' . $storageOption->id, [
                'name' => 'New Name',
            ]);

            $response->assertStatus(401);
        });

        it('should ignore grid_rows and grid_columns on PATCH (immutable after create)', function(): void {
            $user = User::factory()->create();
            $section = StorageOption::factory()->create([
                'family_id' => $user->family_id,
                'name' => 'Section',
                'grid_rows' => 5,
                'grid_columns' => 6,
            ]);

            $response = $this->actingAs($user)->patchJson('/api/storage-options/' . $section->id, [
                'name' => 'Renamed Section',
                'grid_rows' => 10,
                'grid_columns' => 10,
            ]);

            $response->assertStatus(200)
                ->assertJsonPath('name', 'Renamed Section')
                ->assertJsonPath('grid_rows', 5)
                ->assertJsonPath('grid_columns', 6);

            // Persisted dims are unchanged
            $this->assertDatabaseHas('storage_options', [
                'id' => $section->id,
                'name' => 'Renamed Section',
                'grid_rows' => 5,
                'grid_columns' => 6,
            ]);
        });
    });

    describe('destroy', function(): void {
        it('should delete a storage option', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);

            $response = $this->actingAs($user)->deleteJson('/api/storage-options/' . $storageOption->id);

            $response->assertStatus(204);
            $this->assertDatabaseMissing('storage_options', ['id' => $storageOption->id]);
        });

        it('should return 404 for storage option from another family', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create();

            $response = $this->actingAs($user)->deleteJson('/api/storage-options/' . $storageOption->id);

            $response->assertStatus(404);
            $this->assertDatabaseHas('storage_options', ['id' => $storageOption->id]);
        });

        it('should return 401 when unauthenticated', function(): void {
            $storageOption = StorageOption::factory()->create();

            $response = $this->deleteJson('/api/storage-options/' . $storageOption->id);

            $response->assertStatus(401);
        });

        it('should cascade delete children', function(): void {
            $user = User::factory()->create();
            $cabinet = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);
            $drawer = StorageOption::factory()->create([
                'family_id' => $user->family_id,
                'parent_id' => $cabinet->id,
            ]);

            $response = $this->actingAs($user)->deleteJson('/api/storage-options/' . $cabinet->id);

            $response->assertStatus(204);
            $this->assertDatabaseMissing('storage_options', ['id' => $cabinet->id]);
            $this->assertDatabaseMissing('storage_options', ['id' => $drawer->id]);
        });

        it('should cascade delete cabinet, sections, and seeded drawers (1+2+39 rows)', function(): void {
            $user = User::factory()->create();

            // Cabinet
            $cabinetResponse = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => 'CEO Cabinet',
            ]);
            $cabinetResponse->assertStatus(201);

            $cabinetId = $cabinetResponse->json('id');

            // 6x5 section (seeds 30 drawers)
            $sixByFiveResponse = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => '6 by 5 Section',
                'parent_id' => $cabinetId,
                'grid_rows' => 5,
                'grid_columns' => 6,
            ]);
            $sixByFiveResponse->assertStatus(201);

            // 3x3 section (seeds 9 drawers)
            $threeByThreeResponse = $this->actingAs($user)->postJson('/api/storage-options', [
                'name' => '3 by 3 Section',
                'parent_id' => $cabinetId,
                'grid_rows' => 3,
                'grid_columns' => 3,
            ]);
            $threeByThreeResponse->assertStatus(201);

            // Verify the full topology exists before deletion: 1 cabinet + 2 sections + 39 drawers
            expect(StorageOption::query()->where('family_id', $user->family_id)->count())->toBe(42);

            // Delete the cabinet — should cascade everything
            $deleteResponse = $this->actingAs($user)->deleteJson('/api/storage-options/' . $cabinetId);
            $deleteResponse->assertStatus(204);

            // Nothing left
            expect(StorageOption::query()->where('family_id', $user->family_id)->count())->toBe(0);
        });
    });

    describe('parts', function(): void {
        it('should return parts assigned to storage option', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);
            $part = Part::factory()->create();
            StorageOptionPart::factory()->create([
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
                'quantity' => 50,
            ]);

            $response = $this->actingAs($user)->getJson(\sprintf('/api/storage-options/%s/parts', $storageOption->id));

            $response->assertStatus(200)
                ->assertJsonCount(1)
                ->assertJsonPath('0.quantity', 50);
        });

        it('should return 404 for storage option from another family', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create();

            $response = $this->actingAs($user)->getJson(\sprintf('/api/storage-options/%s/parts', $storageOption->id));

            $response->assertStatus(404);
        });

        it('should return 401 when unauthenticated', function(): void {
            $storageOption = StorageOption::factory()->create();

            $response = $this->getJson(\sprintf('/api/storage-options/%s/parts', $storageOption->id));

            $response->assertStatus(401);
        });
    });

    describe('assignPart', function(): void {
        it('should assign a part to a storage option', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);
            $part = Part::factory()->create();

            $response = $this->actingAs($user)->postJson(\sprintf('/api/storage-options/%s/parts', $storageOption->id), [
                'part_id' => $part->id,
                'quantity' => 100,
            ]);

            $response->assertStatus(201)
                ->assertJsonPath('quantity', 100);

            $this->assertDatabaseHas('storage_option_parts', [
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
                'quantity' => 100,
            ]);
        });

        it('should update quantity if part already assigned', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);
            $part = Part::factory()->create();
            StorageOptionPart::factory()->create([
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
                'quantity' => 50,
            ]);

            $response = $this->actingAs($user)->postJson(\sprintf('/api/storage-options/%s/parts', $storageOption->id), [
                'part_id' => $part->id,
                'quantity' => 150,
            ]);

            $response->assertStatus(200)
                ->assertJsonPath('quantity', 150);

            expect(StorageOptionPart::query()->where('storage_option_id', $storageOption->id)
                ->where('part_id', $part->id)
                ->count())->toBe(1);
        });

        it('should return 404 for storage option from another family', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create();
            $part = Part::factory()->create();

            $response = $this->actingAs($user)->postJson(\sprintf('/api/storage-options/%s/parts', $storageOption->id), [
                'part_id' => $part->id,
                'quantity' => 100,
            ]);

            $response->assertStatus(404);
        });

        it('should return 401 when unauthenticated', function(): void {
            $storageOption = StorageOption::factory()->create();
            $part = Part::factory()->create();

            $response = $this->postJson(\sprintf('/api/storage-options/%s/parts', $storageOption->id), [
                'part_id' => $part->id,
                'quantity' => 100,
            ]);

            $response->assertStatus(401);
        });

        it('should require part_id and quantity', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);

            $response = $this->actingAs($user)->postJson(\sprintf('/api/storage-options/%s/parts', $storageOption->id), []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['part_id', 'quantity']);
        });
    });

    describe('removePart', function(): void {
        it('should remove a part from a storage option', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create([
                'family_id' => $user->family_id,
            ]);
            $part = Part::factory()->create();
            $storageOptionPart = StorageOptionPart::factory()->create([
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
            ]);

            $response = $this->actingAs($user)->deleteJson(\sprintf('/api/storage-options/%s/parts/%s', $storageOption->id, $storageOptionPart->id));

            $response->assertStatus(204);
            $this->assertDatabaseMissing('storage_option_parts', ['id' => $storageOptionPart->id]);
        });

        it('should return 404 for storage option from another family', function(): void {
            $user = User::factory()->create();
            $storageOption = StorageOption::factory()->create();
            $part = Part::factory()->create();
            $storageOptionPart = StorageOptionPart::factory()->create([
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
            ]);

            $response = $this->actingAs($user)->deleteJson(\sprintf('/api/storage-options/%s/parts/%s', $storageOption->id, $storageOptionPart->id));

            $response->assertStatus(404);
        });

        it('should return 401 when unauthenticated', function(): void {
            $storageOption = StorageOption::factory()->create();
            $part = Part::factory()->create();
            $storageOptionPart = StorageOptionPart::factory()->create([
                'storage_option_id' => $storageOption->id,
                'part_id' => $part->id,
            ]);

            $response = $this->deleteJson(\sprintf('/api/storage-options/%s/parts/%s', $storageOption->id, $storageOptionPart->id));

            $response->assertStatus(401);
        });
    });
});
