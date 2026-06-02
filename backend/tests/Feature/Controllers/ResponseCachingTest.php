<?php

declare(strict_types = 1);

use App\Enums\SetSyncStatus;
use App\Http\Middleware\SetCacheHeaders;
use App\Http\Middleware\SetEtagHeaders;
use App\Models\Color;
use App\Models\Part;
use App\Models\Set;
use App\Models\SetPart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

covers(SetEtagHeaders::class, SetCacheHeaders::class);

uses(RefreshDatabase::class);

describe('Response Caching', function(): void {
    describe('Catalog endpoints (max-age=3600)', function(): void {
        it('should return ETag and Cache-Control on set parts endpoint', function(): void {
            $user = User::factory()->create();

            $set = Set::factory()->create([
                'set_num' => '75192-1',
                'name' => 'Millennium Falcon',
                'year' => 2_017,
                'num_parts' => 7_541,
                'image_url' => 'https://example.com/falcon.jpg',
            ]);

            $color = Color::factory()->create([
                'rebrickable_id' => 1,
                'name' => 'White',
                'rgb' => 'FFFFFF',
                'is_transparent' => false,
            ]);

            $part = Part::factory()->create([
                'part_num' => '3001',
                'name' => 'Brick 2 x 4',
                'category' => '11',
                'image_url' => 'https://example.com/3001.jpg',
            ]);

            $setPart = new SetPart;
            $setPart->set_id = $set->id;
            $setPart->part_id = $part->id;
            $setPart->color_id = $color->id;
            $setPart->quantity = 10;
            $setPart->is_spare = false;
            $setPart->element_id = '300101';
            $setPart->save();

            $response = $this->actingAs($user)->getJson('/api/sets/75192-1/parts');

            $response->assertStatus(200);
            $response->assertHeader('ETag');
            $response->assertHeader('Cache-Control', 'max-age=3600, private');
        });

        it('should forbid caching the 202 envelope while parts are still syncing', function(): void {
            $user = User::factory()->create();

            // Mid-sync set: the endpoint returns a 202 "retry shortly" envelope. If this
            // gets cached, the frontend poll loop reads the stale pending state from the
            // browser cache forever and the "Load parts" spinner never finishes.
            Set::factory()->create([
                'set_num' => '10281-1',
                'parts_sync_status' => SetSyncStatus::InProgress,
            ]);

            $response = $this->actingAs($user)->getJson('/api/sets/10281-1/parts');

            $response->assertStatus(202);
            $response->assertHeader('Cache-Control', 'no-store');
            expect($response->headers->has('ETag'))->toBeFalse();
        });

        it('should return 304 when If-None-Match matches on set parts endpoint', function(): void {
            $user = User::factory()->create();

            $set = Set::factory()->create([
                'set_num' => '75192-1',
                'name' => 'Millennium Falcon',
                'year' => 2_017,
                'num_parts' => 7_541,
                'image_url' => 'https://example.com/falcon.jpg',
            ]);

            $color = Color::factory()->create([
                'rebrickable_id' => 1,
                'name' => 'White',
                'rgb' => 'FFFFFF',
                'is_transparent' => false,
            ]);

            $part = Part::factory()->create([
                'part_num' => '3001',
                'name' => 'Brick 2 x 4',
                'category' => '11',
                'image_url' => 'https://example.com/3001.jpg',
            ]);

            $setPart = new SetPart;
            $setPart->set_id = $set->id;
            $setPart->part_id = $part->id;
            $setPart->color_id = $color->id;
            $setPart->quantity = 10;
            $setPart->is_spare = false;
            $setPart->element_id = '300101';
            $setPart->save();

            // First request to get ETag
            $firstResponse = $this->actingAs($user)->getJson('/api/sets/75192-1/parts');
            $etag = $firstResponse->headers->get('ETag');

            // Second request with If-None-Match
            $response = $this->actingAs($user)->getJson('/api/sets/75192-1/parts', [
                'If-None-Match' => $etag,
            ]);

            $response->assertStatus(304);
        });

        it('should return ETag and Cache-Control on EAN lookup endpoint', function(): void {
            $user = User::factory()->create();

            Http::fake([
                'rebrickable.com/api/v3/lego/sets/*' => Http::response([
                    'results' => [
                        [
                            'set_num' => '75192-1',
                            'name' => 'Millennium Falcon',
                            'year' => 2_017,
                            'theme_id' => 158,
                            'num_parts' => 7_541,
                            'set_img_url' => 'https://example.com/75192.jpg',
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $response = $this->actingAs($user)->getJson('/api/sets/ean/5702016914177');

            $response->assertStatus(200);
            $response->assertHeader('ETag');
            $response->assertHeader('Cache-Control', 'max-age=3600, private');
        });
    });

    describe('Tenant-scoped catalog endpoints (private, max-age=3600)', function(): void {
        it('should return private Cache-Control on storage map endpoint', function(): void {
            $user = User::factory()->create();

            $set = Set::factory()->create([
                'set_num' => '75192-1',
                'name' => 'Millennium Falcon',
                'year' => 2_017,
                'num_parts' => 7_541,
                'image_url' => 'https://example.com/falcon.jpg',
            ]);

            $color = Color::factory()->create([
                'rebrickable_id' => 1,
                'name' => 'White',
                'rgb' => 'FFFFFF',
                'is_transparent' => false,
            ]);

            $part = Part::factory()->create([
                'part_num' => '3001',
                'name' => 'Brick 2 x 4',
                'category' => '11',
                'image_url' => 'https://example.com/3001.jpg',
            ]);

            $setPart = new SetPart;
            $setPart->set_id = $set->id;
            $setPart->part_id = $part->id;
            $setPart->color_id = $color->id;
            $setPart->quantity = 10;
            $setPart->is_spare = false;
            $setPart->element_id = '300101';
            $setPart->save();

            $response = $this->actingAs($user)->getJson('/api/sets/75192-1/storage-map');

            $response->assertStatus(200);
            $response->assertHeader('ETag');
            $response->assertHeader('Cache-Control', 'max-age=3600, private');
        });
    });

    describe('Family-scoped endpoints (private, max-age=60)', function(): void {
        it('should return private Cache-Control on family sets index', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->getJson('/api/family-sets');

            $response->assertStatus(200);
            $response->assertHeader('ETag');
            $response->assertHeader('Cache-Control', 'max-age=60, private');
        });

        it('should return private Cache-Control on storage options index', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->getJson('/api/storage-options');

            $response->assertStatus(200);
            $response->assertHeader('ETag');
            $response->assertHeader('Cache-Control', 'max-age=60, private');
        });

        it('should return private Cache-Control on family members', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->getJson('/api/family/members');

            $response->assertStatus(200);
            $response->assertHeader('ETag');
            $response->assertHeader('Cache-Control', 'max-age=60, private');
        });

        it('should return private Cache-Control on family stats', function(): void {
            $user = User::factory()->create();

            $response = $this->actingAs($user)->getJson('/api/family/stats');

            $response->assertStatus(200);
            $response->assertHeader('ETag');
            $response->assertHeader('Cache-Control', 'max-age=60, private');
        });

        it('should return 304 on family-scoped endpoint when ETag matches', function(): void {
            $user = User::factory()->create();

            // First request to get ETag
            $firstResponse = $this->actingAs($user)->getJson('/api/family-sets');
            $etag = $firstResponse->headers->get('ETag');

            // Second request with If-None-Match
            $response = $this->actingAs($user)->getJson('/api/family-sets', [
                'If-None-Match' => $etag,
            ]);

            $response->assertStatus(304);
        });
    });

    describe('Mutation endpoints (no caching)', function(): void {
        it('should not return ETag or cache headers on POST family-set', function(): void {
            $user = User::factory()->create();

            Http::fake([
                'rebrickable.com/api/v3/lego/sets/75192-1/' => Http::response([
                    'set_num' => '75192-1',
                    'name' => 'Millennium Falcon',
                    'year' => 2_017,
                    'theme_id' => 158,
                    'num_parts' => 7_541,
                    'set_img_url' => 'https://example.com/75192.jpg',
                ]),
                'rebrickable.com/api/v3/lego/sets/75192-1/parts/*' => Http::response([
                    'count' => 0,
                    'next' => null,
                    'results' => [],
                ]),
            ]);

            $response = $this->actingAs($user)->postJson('/api/family-sets', [
                'set_num' => '75192-1',
            ]);

            $response->assertHeader('Cache-Control', 'no-cache, private');
        });
    });
});
