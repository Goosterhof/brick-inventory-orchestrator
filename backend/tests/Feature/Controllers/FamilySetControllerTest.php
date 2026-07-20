<?php

declare(strict_types = 1);

use App\Enums\FamilySetStatus;
use App\Enums\ImportJobStatus;
use App\Http\Controllers\FamilySetController;
use App\Jobs\ImportOwnedSetsJob;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\ImportJob;
use App\Models\Set;
use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

covers(FamilySetController::class);

uses(RefreshDatabase::class);

describe('FamilySetController', function(): void {
    describe('index', function(): void {
        it('should return empty list when family has no sets', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->getJson('/api/family-sets');

            $response->assertStatus(200)
                ->assertJsonCount(0);
        });

        it('should return family sets for authenticated user', function(): void {
            $user = User::factory()->create();
            $set = Set::factory()->create(['set_num' => '75192-1', 'name' => 'Millennium Falcon']);

            FamilySet::factory()->create([
                'family_id' => $user->family_id,
                'set_id' => $set->id,
                'quantity' => 2,
                'status' => FamilySetStatus::Built,
            ]);

            $response = $this->actingAs($user)->getJson('/api/family-sets');

            $response->assertStatus(200)
                ->assertJsonCount(1)
                ->assertJsonPath('0.quantity', 2)
                ->assertJsonPath('0.status', 'built')
                ->assertJsonPath('0.set_id', $set->id)
                ->assertJsonPath('0.set.id', $set->id)
                ->assertJsonPath('0.set.set_num', '75192-1')
                ->assertJsonPath('0.set.name', 'Millennium Falcon');
        });

        it('should not return sets from other families', function(): void {
            $user = User::factory()->create();
            $otherFamily = Family::factory()->create();
            $set = Set::factory()->create();

            FamilySet::factory()->create([
                'family_id' => $otherFamily->id,
                'set_id' => $set->id,
            ]);

            $response = $this->actingAs($user)->getJson('/api/family-sets');

            $response->assertStatus(200)
                ->assertJsonCount(0);
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->getJson('/api/family-sets');

            $response->assertStatus(401);
        });

        it('should issue a single themes query regardless of how many family sets are listed', function(): void {
            $user = User::factory()->create();

            // Five owned sets, each with a distinct theme — proves the nested SetSummaryResourceData
            // theme is eager-loaded up front (set.theme) and does NOT fire one themes query per row.
            for ($i = 0; $i < 5; $i++) {
                $set = Set::factory()->withTheme()->create();
                FamilySet::factory()->create([
                    'family_id' => $user->family_id,
                    'set_id' => $set->id,
                ]);
            }

            $queries = [];
            DB::listen(function($query) use (&$queries): void {
                $queries[] = $query->sql;
            });

            $response = $this->actingAs($user)->getJson('/api/family-sets');

            $response->assertStatus(200)->assertJsonCount(5);

            // Exactly one query touches the themes table — the eager load — not one per row.
            $themeQueries = array_filter(
                $queries,
                static fn(string $sql): bool => str_contains($sql, 'from "themes"'),
            );

            expect($themeQueries)->toHaveCount(1);
        });
    });

    describe('store', function(): void {
        it('should add an existing set to family', function(): void {
            $user = User::factory()->create();
            $set = Set::factory()->create(['set_num' => '75192-1', 'name' => 'Millennium Falcon']);

            $response = $this->actingAs($user)->postJson('/api/family-sets', [
                'set_num' => '75192-1',
                'quantity' => 2,
                'status' => 'sealed',
                'purchase_date' => '2024-01-15',
                'notes' => 'Birthday gift',
            ]);

            $response->assertStatus(201)
                ->assertJsonPath('quantity', 2)
                ->assertJsonPath('status', 'sealed')
                ->assertJsonPath('purchase_date', '2024-01-15')
                ->assertJsonPath('notes', 'Birthday gift')
                ->assertJsonPath('set_id', $set->id)
                ->assertJsonPath('set.id', $set->id)
                ->assertJsonPath('set.set_num', '75192-1')
                ->assertJsonPath('set.name', 'Millennium Falcon');

            $this->assertDatabaseHas('family_sets', [
                'family_id' => $user->family_id,
                'set_id' => $set->id,
                'quantity' => 2,
            ]);
        });

        it('should fetch set from rebrickable if not in database', function(): void {
            Http::fake([
                'rebrickable.com/api/v3/lego/sets/10281-1/' => Http::response([
                    'set_num' => '10281-1',
                    'name' => 'Bonsai Tree',
                    'year' => 2_021,
                    'theme_id' => 598,
                    'num_parts' => 878,
                    'set_img_url' => 'https://example.com/bonsai.jpg',
                ]),
            ]);

            $user = User::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/family-sets', [
                'set_num' => '10281-1',
            ]);

            $response->assertStatus(201);

            $this->assertDatabaseHas('sets', ['set_num' => '10281-1']);
            $createdSet = Set::query()->where('set_num', '10281-1')->firstOrFail();
            $response->assertJsonPath('set_id', $createdSet->id);
            $this->assertDatabaseHas('family_sets', [
                'family_id' => $user->family_id,
                'set_id' => $createdSet->id,
            ]);
        });

        it('should use default values when not provided', function(): void {
            $user = User::factory()->create();
            Set::factory()->create(['set_num' => '75192-1']);

            $response = $this->actingAs($user)->postJson('/api/family-sets', [
                'set_num' => '75192-1',
            ]);

            $response->assertStatus(201)
                ->assertJsonPath('quantity', 1)
                ->assertJsonPath('status', 'sealed')
                ->assertJsonPath('purchase_date', null)
                ->assertJsonPath('notes', null);
        });

        it('should return 404 for non-existent set from rebrickable', function(): void {
            Http::fake([
                'rebrickable.com/api/v3/lego/sets/99999-1/' => Http::response(
                    ['detail' => 'Not found.'],
                    404,
                ),
            ]);

            $user = User::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/family-sets', [
                'set_num' => '99999-1',
            ]);

            $response->assertStatus(404)
                ->assertJson(['error' => 'Set not found']);
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->postJson('/api/family-sets', [
                'set_num' => '75192-1',
            ]);

            $response->assertStatus(401);
        });

        it('should require set_num', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/family-sets', []);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['set_num']);
        });

        it('should validate status enum', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/family-sets', [
                'set_num' => '75192-1',
                'status' => 'invalid_status',
            ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['status']);
        });

        it('should allow adding the same set multiple times', function(): void {
            $user = User::factory()->create();
            $set = Set::factory()->create(['set_num' => '75192-1']);

            FamilySet::factory()->create([
                'family_id' => $user->family_id,
                'set_id' => $set->id,
            ]);

            $response = $this->actingAs($user)->postJson('/api/family-sets', [
                'set_num' => '75192-1',
            ]);

            $response->assertStatus(201);

            expect(FamilySet::query()->where('family_id', $user->family_id)->count())->toBe(2);
        });
    });

    describe('show', function(): void {
        it('should return a family set', function(): void {
            $user = User::factory()->create();
            $set = Set::factory()->create(['set_num' => '75192-1', 'name' => 'Millennium Falcon']);
            $familySet = FamilySet::factory()->create([
                'family_id' => $user->family_id,
                'set_id' => $set->id,
                'status' => FamilySetStatus::Built,
            ]);

            $response = $this->actingAs($user)->getJson('/api/family-sets/' . $familySet->id);

            $response->assertStatus(200)
                ->assertJsonPath('id', $familySet->id)
                ->assertJsonPath('status', 'built')
                ->assertJsonPath('set_id', $set->id)
                ->assertJsonPath('set.id', $set->id)
                ->assertJsonPath('set.set_num', '75192-1')
                ->assertJsonPath('set.name', 'Millennium Falcon');
        });

        it('should return 404 for family set from another family', function(): void {
            $user = User::factory()->create();
            $otherFamily = Family::factory()->create();
            $set = Set::factory()->create();
            $familySet = FamilySet::factory()->create([
                'family_id' => $otherFamily->id,
                'set_id' => $set->id,
            ]);

            $response = $this->actingAs($user)->getJson('/api/family-sets/' . $familySet->id);

            $response->assertStatus(404);
        });

        it('should return 401 when unauthenticated', function(): void {
            $set = Set::factory()->create();
            $familySet = FamilySet::factory()->create([
                'set_id' => $set->id,
            ]);

            $response = $this->getJson('/api/family-sets/' . $familySet->id);

            $response->assertStatus(401);
        });
    });

    describe('update', function(): void {
        it('should update a family set', function(): void {
            $user = User::factory()->create();
            $set = Set::factory()->create();
            $familySet = FamilySet::factory()->create([
                'family_id' => $user->family_id,
                'set_id' => $set->id,
                'quantity' => 1,
                'status' => FamilySetStatus::Sealed,
            ]);

            $response = $this->actingAs($user)->patchJson('/api/family-sets/' . $familySet->id, [
                'quantity' => 3,
                'status' => 'built',
                'notes' => 'Updated notes',
            ]);

            $response->assertStatus(200)
                ->assertJsonPath('quantity', 3)
                ->assertJsonPath('status', 'built')
                ->assertJsonPath('notes', 'Updated notes')
                ->assertJsonPath('set.id', $set->id);

            $this->assertDatabaseHas('family_sets', [
                'id' => $familySet->id,
                'quantity' => 3,
                'status' => 'built',
                'notes' => 'Updated notes',
            ]);
        });

        it('should return 404 for family set from another family', function(): void {
            $user = User::factory()->create();
            $otherFamily = Family::factory()->create();
            $set = Set::factory()->create();
            $familySet = FamilySet::factory()->create([
                'family_id' => $otherFamily->id,
                'set_id' => $set->id,
            ]);

            $response = $this->actingAs($user)->patchJson('/api/family-sets/' . $familySet->id, [
                'quantity' => 5,
                'status' => 'built',
            ]);

            $response->assertStatus(404);
        });

        it('should return 401 when unauthenticated', function(): void {
            $set = Set::factory()->create();
            $familySet = FamilySet::factory()->create([
                'set_id' => $set->id,
            ]);

            $response = $this->patchJson('/api/family-sets/' . $familySet->id, [
                'quantity' => 5,
                'status' => 'built',
            ]);

            $response->assertStatus(401);
        });

        it('should accept a partial patch updating only notes', function(): void {
            $user = User::factory()->create();
            $set = Set::factory()->create();
            $familySet = FamilySet::factory()->create([
                'family_id' => $user->family_id,
                'set_id' => $set->id,
                'quantity' => 4,
                'status' => FamilySetStatus::Sealed,
            ]);

            $response = $this->actingAs($user)->patchJson('/api/family-sets/' . $familySet->id, [
                'notes' => 'Just notes',
            ]);

            $response->assertStatus(200);

            $fresh = $familySet->fresh();
            expect($fresh->notes)->toBe('Just notes')
                ->and($fresh->quantity)->toBe(4)
                ->and($fresh->status)->toBe(FamilySetStatus::Sealed);
        });

        it('should accept a status-only patch', function(): void {
            $user = User::factory()->create();
            $set = Set::factory()->create();
            $familySet = FamilySet::factory()->create([
                'family_id' => $user->family_id,
                'set_id' => $set->id,
                'quantity' => 2,
                'status' => FamilySetStatus::Built,
            ]);

            $response = $this->actingAs($user)->patchJson('/api/family-sets/' . $familySet->id, [
                'status' => 'in_storage',
            ]);

            $response->assertStatus(200);

            $fresh = $familySet->fresh();
            expect($fresh->status)->toBe(FamilySetStatus::InStorage)
                ->and($fresh->quantity)->toBe(2);
        });
    });

    describe('destroy', function(): void {
        it('should delete a family set', function(): void {
            $user = User::factory()->create();
            $set = Set::factory()->create();
            $familySet = FamilySet::factory()->create([
                'family_id' => $user->family_id,
                'set_id' => $set->id,
            ]);

            $response = $this->actingAs($user)->deleteJson('/api/family-sets/' . $familySet->id);

            $response->assertStatus(204);

            $this->assertDatabaseMissing('family_sets', ['id' => $familySet->id]);
        });

        it('should return 404 for family set from another family', function(): void {
            $user = User::factory()->create();
            $otherFamily = Family::factory()->create();
            $set = Set::factory()->create();
            $familySet = FamilySet::factory()->create([
                'family_id' => $otherFamily->id,
                'set_id' => $set->id,
            ]);

            $response = $this->actingAs($user)->deleteJson('/api/family-sets/' . $familySet->id);

            $response->assertStatus(404);

            $this->assertDatabaseHas('family_sets', ['id' => $familySet->id]);
        });

        it('should return 401 when unauthenticated', function(): void {
            $set = Set::factory()->create();
            $familySet = FamilySet::factory()->create([
                'set_id' => $set->id,
            ]);

            $response = $this->deleteJson('/api/family-sets/' . $familySet->id);

            $response->assertStatus(401);
        });
    });

    describe('importFromRebrickable', function(): void {
        it('should dispatch import job and return 202 with pending status', function(): void {
            Queue::fake();

            $user = User::factory()->create();

            $response = $this->actingAs($user)->postJson('/api/family-sets/import-from-rebrickable');

            $response->assertStatus(202)
                ->assertJsonPath('status', 'pending')
                ->assertJsonPath('total_sets', 0)
                ->assertJsonPath('processed_sets', 0)
                ->assertJsonPath('failed_sets', 0)
                ->assertJsonStructure(['id', 'status', 'total_sets', 'processed_sets', 'failed_sets', 'created_at']);

            Queue::assertPushed(ImportOwnedSetsJob::class, fn(ImportOwnedSetsJob $importOwnedSetsJob): bool => $importOwnedSetsJob->familyId === $user->family_id);

            $this->assertDatabaseHas('import_jobs', [
                'family_id' => $user->family_id,
                'status' => 'pending',
            ]);
        });

        it('should return 409 when import is already in progress', function(): void {
            Queue::fake();

            $user = User::factory()->create();
            ImportJob::factory()->forFamily($user->family)->inProgress()->create();

            $response = $this->actingAs($user)->postJson('/api/family-sets/import-from-rebrickable');

            $response->assertStatus(409)
                ->assertJson(['error' => 'An import is already in progress for this family']);

            // ImportAlreadyInProgressException sits in the dontReport set
            // (bootstrap/app.php), so the kendo report hook must not fire here:
            // nothing at all reaches the queue on the 409 path.
            Queue::assertNothingPushed();
        });

        it('should return 409 when import is pending', function(): void {
            Queue::fake();

            $user = User::factory()->create();
            ImportJob::factory()->forFamily($user->family)->create(['status' => ImportJobStatus::Pending]);

            $response = $this->actingAs($user)->postJson('/api/family-sets/import-from-rebrickable');

            $response->assertStatus(409);
        });

        it('should reclaim a stale active import and start a new one, keeping a single active row', function(): void {
            Queue::fake();

            $user = User::factory()->create();

            // A stranded in-progress job whose worker never ran: created well beyond
            // the 1200s stale threshold. Without reclamation this locks the family out.
            $staleJob = ImportJob::factory()->forFamily($user->family)->inProgress()->create([
                'created_at' => now()->subSeconds(1_300),
            ]);

            $response = $this->actingAs($user)->postJson('/api/family-sets/import-from-rebrickable');

            $response->assertStatus(202)->assertJsonPath('status', 'pending');
            Queue::assertPushed(ImportOwnedSetsJob::class, fn(ImportOwnedSetsJob $importOwnedSetsJob): bool => $importOwnedSetsJob->familyId === $user->family_id);

            // The stranded job is retired via a status flip — never deleted.
            expect($staleJob->fresh()?->status)->toBe(ImportJobStatus::Failed);

            // Partial-unique-index invariant: exactly one active (pending/in_progress)
            // row exists for the family after reclamation.
            expect(
                ImportJob::query()
                    ->where('family_id', $user->family_id)
                    ->whereIn('status', [ImportJobStatus::Pending, ImportJobStatus::InProgress])
                    ->count(),
            )->toBe(1);
        });

        it('should still return 409 for a fresh active import below the stale threshold', function(): void {
            Queue::fake();

            $user = User::factory()->create();

            // Active job created just 60s ago — genuinely in flight, must NOT be reclaimed.
            ImportJob::factory()->forFamily($user->family)->inProgress()->create([
                'created_at' => now()->subSeconds(60),
            ]);

            $response = $this->actingAs($user)->postJson('/api/family-sets/import-from-rebrickable');

            $response->assertStatus(409)
                ->assertJson(['error' => 'An import is already in progress for this family']);
            Queue::assertNothingPushed();
        });

        it('should allow new import after previous one completed', function(): void {
            Queue::fake();

            $user = User::factory()->create();
            ImportJob::factory()->forFamily($user->family)->completed()->create();

            $response = $this->actingAs($user)->postJson('/api/family-sets/import-from-rebrickable');

            $response->assertStatus(202);
            Queue::assertPushed(ImportOwnedSetsJob::class);
        });

        it('should allow new import after previous one failed', function(): void {
            Queue::fake();

            $user = User::factory()->create();
            ImportJob::factory()->forFamily($user->family)->failed()->create();

            $response = $this->actingAs($user)->postJson('/api/family-sets/import-from-rebrickable');

            $response->assertStatus(202);
            Queue::assertPushed(ImportOwnedSetsJob::class);
        });

        it('should return 403 when non-head family member tries to import', function(): void {
            Queue::fake();

            $headUser = User::factory()->create();
            $memberUser = User::factory()->forFamily($headUser->family)->create();

            $response = $this->actingAs($memberUser)->postJson('/api/family-sets/import-from-rebrickable');

            $response->assertStatus(403);
            Queue::assertNothingPushed();
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->postJson('/api/family-sets/import-from-rebrickable');

            $response->assertStatus(401);
        });

        it('should execute import synchronously when job is processed', function(): void {
            Http::fake([
                'rebrickable.com/api/v3/users/test-user-token/sets/' => Http::response([
                    'results' => [
                        [
                            'set' => [
                                'set_num' => '75192-1',
                                'name' => 'Millennium Falcon',
                                'year' => 2_017,
                                'theme_id' => 158,
                                'num_parts' => 7_541,
                                'set_img_url' => 'https://example.com/75192.jpg',
                            ],
                            'quantity' => 2,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $user = User::factory()->create();
            $user->family->rebrickable_user_token = 'test-user-token';
            $user->family->save();

            // Dispatch import
            $response = $this->actingAs($user)->postJson('/api/family-sets/import-from-rebrickable');
            $response->assertStatus(202);

            $importJobId = $response->json('id');

            // Process the job synchronously
            $job = new ImportOwnedSetsJob(importJobId: $importJobId, familyId: $user->family_id);
            app()->call($job->handle(...));

            // Verify the import job was updated
            $this->assertDatabaseHas('import_jobs', [
                'id' => $importJobId,
                'status' => 'completed',
                'processed_sets' => 1,
            ]);

            // Verify the sets were imported
            $this->assertDatabaseHas('sets', ['set_num' => '75192-1']);
            $this->assertDatabaseHas('family_sets', [
                'family_id' => $user->family_id,
                'quantity' => 2,
            ]);
        });

        it('should prevent duplicate pending import jobs at the database level (race condition guard)', function(): void {
            Queue::fake();

            $user = User::factory()->create();

            // First request succeeds
            $response = $this->actingAs($user)->postJson('/api/family-sets/import-from-rebrickable');
            $response->assertStatus(202);

            // Directly verify the unique constraint prevents a second pending import
            // by attempting to insert another pending ImportJob for the same family
            // (simulating a concurrent request that passed the application-level check)
            $duplicateJob = new ImportJob;
            $duplicateJob->family_id = $user->family_id;
            $duplicateJob->status = ImportJobStatus::Pending;
            $duplicateJob->total_sets = 0;
            $duplicateJob->processed_sets = 0;
            $duplicateJob->failed_sets = 0;

            // Wrap the failing INSERT in a nested transaction so Laravel uses
            // a SAVEPOINT for it. Without this, the unique-constraint failure
            // marks the RefreshDatabase-owned outer transaction as aborted on
            // Postgres ("current transaction is aborted, commands ignored")
            // and every subsequent query in the test errors out, masking the
            // assertion we're actually trying to make.
            expect(fn() => DB::transaction(fn() => $duplicateJob->save()))
                ->toThrow(UniqueConstraintViolationException::class);

            // Only one pending import job should exist
            expect(
                ImportJob::query()
                    ->where('family_id', $user->family_id)
                    ->where('status', ImportJobStatus::Pending)
                    ->count(),
            )->toBe(1);
        });
    });

    describe('rate limiting', function(): void {
        // Wiring assertion. The 'testing' env resolves every named limiter to Limit::none(),
        // so a naive "fire N+1 requests, expect 429" test passes green while asserting nothing.
        // This one asserts the fact the route file actually changed: the middleware is attached.
        it('should attach the rebrickable-import throttle middleware to the route', function(): void {
            // act
            $middleware = collect(Route::getRoutes()->getRoutes())
                ->filter(static fn(RoutingRoute $route): bool => $route->uri() === 'api/family-sets/import-from-rebrickable'
                    && \in_array('POST', $route->methods(), true))
                ->flatMap(static fn(RoutingRoute $route): array => $route->gatherMiddleware())
                ->all();

            // assert
            expect($middleware)->toContain('throttle:rebrickable-import');
        });

        // Behavioural assertion. The limiter is explicitly re-enabled by forcing the env and
        // re-binding the provider closures, because the default testing env would make this
        // vacuous. 5/hour is deliberate: a stranded import becomes reclaimable after 1200s
        // (BIO-0029), so a worker-down retry cadence tops out at 3600/1200 = 3 attempts per
        // hour. Allowing 5 keeps the throttle clear of that floor — a limit of 3 or tighter
        // would 429 a legitimate reclamation retry.
        it('should rate-limit at 5 imports per hour', function(): void {
            // arrange
            Queue::fake();

            $this->app['env'] = 'production';
            $this->app->register(AppServiceProvider::class, force: true);

            $user = User::factory()->create();

            // act + assert — 5 imports within the hour are allowed.
            for ($i = 0; $i < 5; $i++) {
                $this->actingAs($user)
                    ->postJson('/api/family-sets/import-from-rebrickable')
                    ->assertStatus(202);

                // Retire the job so the next sequential import is not rejected by the
                // family-scoped 409 concurrency guard, which is a separate mechanism.
                ImportJob::query()
                    ->where('family_id', $user->family_id)
                    ->update(['status' => ImportJobStatus::Completed]);
            }

            // assert — the 6th is throttled.
            $this->actingAs($user)
                ->postJson('/api/family-sets/import-from-rebrickable')
                ->assertStatus(429);
        });

        // Pins the deliberate deviation from every other limiter in AppServiceProvider:
        // this one keys by family_id, not user_id. The protected resource is the family's
        // Rebrickable token and upstream quota. If someone "corrects" the key back to
        // user_id for consistency, this test fails — an n-member family would otherwise
        // drive n x the intended upstream load.
        it('should share the import limit across users in the same family', function(): void {
            // arrange
            $this->app['env'] = 'production';
            $this->app->register(AppServiceProvider::class, force: true);

            $family = Family::factory()->create();
            $headUser = User::factory()->forFamily($family)->create();
            $memberUser = User::factory()->forFamily($family)->create();

            // Burn the family's full allowance through the first user.
            RateLimiter::hit(md5('rebrickable-import' . $family->id), 3_600);
            RateLimiter::hit(md5('rebrickable-import' . $family->id), 3_600);
            RateLimiter::hit(md5('rebrickable-import' . $family->id), 3_600);
            RateLimiter::hit(md5('rebrickable-import' . $family->id), 3_600);
            RateLimiter::hit(md5('rebrickable-import' . $family->id), 3_600);

            // act + assert — a *different* user in the same family is throttled, because the
            // bucket is the family's, not the individual's.
            $this->actingAs($memberUser)
                ->postJson('/api/family-sets/import-from-rebrickable')
                ->assertStatus(429);

            expect($headUser->family_id)->toBe($memberUser->family_id);
        });
    });

    describe('importStatus', function(): void {
        it('should return latest import job status', function(): void {
            $user = User::factory()->create();
            $importJob = ImportJob::factory()->forFamily($user->family)->inProgress()->create([
                'total_sets' => 10,
                'processed_sets' => 5,
                'failed_sets' => 1,
            ]);

            $response = $this->actingAs($user)->getJson('/api/family-sets/import-status');

            $response->assertStatus(200)
                ->assertJsonPath('id', $importJob->id)
                ->assertJsonPath('status', 'in_progress')
                ->assertJsonPath('total_sets', 10)
                ->assertJsonPath('processed_sets', 5)
                ->assertJsonPath('failed_sets', 1);
        });

        it('should return completed import job with details', function(): void {
            $user = User::factory()->create();
            ImportJob::factory()->forFamily($user->family)->completed()->create([
                'total_sets' => 15,
                'processed_sets' => 13,
                'failed_sets' => 2,
                'failed_set_details' => [
                    ['set_num' => '75192-1', 'error' => 'Multiple family sets exist for this set — requires manual reconciliation'],
                ],
            ]);

            $response = $this->actingAs($user)->getJson('/api/family-sets/import-status');

            $response->assertStatus(200)
                ->assertJsonPath('status', 'completed')
                ->assertJsonPath('total_sets', 15)
                ->assertJsonPath('processed_sets', 13)
                ->assertJsonPath('failed_sets', 2)
                ->assertJsonPath('failed_set_details.0.set_num', '75192-1');
        });

        it('should return 404 when no import jobs exist', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->getJson('/api/family-sets/import-status');

            $response->assertStatus(404)
                ->assertJsonPath('message', 'No import jobs found');
        });

        it('should return most recent import job', function(): void {
            $user = User::factory()->create();

            // Create older completed job
            ImportJob::factory()->forFamily($user->family)->completed()->create([
                'total_sets' => 5,
                'created_at' => now()->subDay(),
            ]);

            // Create newer in-progress job
            $latestJob = ImportJob::factory()->forFamily($user->family)->inProgress()->create([
                'total_sets' => 20,
                'created_at' => now(),
            ]);

            $response = $this->actingAs($user)->getJson('/api/family-sets/import-status');

            $response->assertStatus(200)
                ->assertJsonPath('id', $latestJob->id)
                ->assertJsonPath('total_sets', 20);
        });

        it('should not return import jobs from other families', function(): void {
            $user = User::factory()->create();
            $otherFamily = Family::factory()->create();
            ImportJob::factory()->forFamily($otherFamily)->inProgress()->create();

            $response = $this->actingAs($user)->getJson('/api/family-sets/import-status');

            $response->assertStatus(404);
        });

        it('should return 401 when unauthenticated', function(): void {
            $response = $this->getJson('/api/family-sets/import-status');

            $response->assertStatus(401);
        });
    });
});
