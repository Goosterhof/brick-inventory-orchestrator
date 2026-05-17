<?php

declare(strict_types = 1);

use App\Console\Commands\SyncThemesCommand;
use App\Models\Set;
use App\Models\Theme;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;

covers(SyncThemesCommand::class);

uses(RefreshDatabase::class);

describe('themes:sync command', function(): void {
    it('should populate the themes table from a single page response', function(): void {
        // arrange
        Http::fake([
            'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                'results' => [
                    ['id' => 1, 'parent_id' => null, 'name' => 'Technic'],
                    ['id' => 158, 'parent_id' => null, 'name' => 'Star Wars'],
                    ['id' => 209, 'parent_id' => 158, 'name' => 'Episode I'],
                ],
                'next' => null,
            ]),
        ]);

        // act
        $exitCode = Artisan::call('themes:sync');
        $output = Artisan::output();

        // assert
        expect($exitCode)->toBe(0)
            ->and($output)->toContain('fetched=3')
            ->and($output)->toContain('upserted=3')
            ->and($output)->toContain('parentsLinked=1');

        $this->assertDatabaseCount('themes', 3);
        $this->assertDatabaseHas('themes', ['rebrickable_id' => 158, 'name' => 'Star Wars', 'parent_id' => null]);

        $starWars = Theme::query()->where('rebrickable_id', 158)->firstOrFail();
        $this->assertDatabaseHas('themes', [
            'rebrickable_id' => 209,
            'name' => 'Episode I',
            'parent_id' => $starWars->id,
        ]);
    });

    it('should resolve parent_id when the parent appears AFTER its child in the result stream', function(): void {
        // arrange — the two-pass strategy's whole reason for being.
        Http::fake([
            'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                'results' => [
                    ['id' => 209, 'parent_id' => 158, 'name' => 'Episode I'],
                    ['id' => 158, 'parent_id' => null, 'name' => 'Star Wars'],
                ],
                'next' => null,
            ]),
        ]);

        // act
        $exitCode = Artisan::call('themes:sync');

        // assert
        expect($exitCode)->toBe(0);

        $starWars = Theme::query()->where('rebrickable_id', 158)->firstOrFail();
        $episodeI = Theme::query()->where('rebrickable_id', 209)->firstOrFail();

        expect($episodeI->parent_id)->toBe($starWars->id);
    });

    it('should leave parent_id null when the parent is missing from the catalog', function(): void {
        // arrange
        Http::fake([
            'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                'results' => [
                    ['id' => 209, 'parent_id' => 999, 'name' => 'Orphan Theme'],
                ],
                'next' => null,
            ]),
        ]);

        // act
        $exitCode = Artisan::call('themes:sync');
        $output = Artisan::output();

        // assert
        expect($exitCode)->toBe(0)
            ->and($output)->toContain('parentsLinked=0');

        $orphan = Theme::query()->where('rebrickable_id', 209)->firstOrFail();
        expect($orphan->parent_id)->toBeNull();
    });

    it('should idempotently update existing themes on a second run', function(): void {
        // arrange — first run with one name, second with renamed
        Http::fake([
            'https://rebrickable.com/api/v3/lego/themes/' => Http::sequence()
                ->push([
                    'results' => [
                        ['id' => 1, 'parent_id' => null, 'name' => 'Technic'],
                    ],
                    'next' => null,
                ])
                ->push([
                    'results' => [
                        ['id' => 1, 'parent_id' => null, 'name' => 'Technic Renamed'],
                    ],
                    'next' => null,
                ]),
        ]);

        // act
        Artisan::call('themes:sync');

        // The first sync caches the page; clear it to force a real second call
        cache()->forget('rebrickable:themes:page:1');

        Artisan::call('themes:sync');

        // assert
        expect(Theme::query()->count())->toBe(1);
        $this->assertDatabaseHas('themes', ['rebrickable_id' => 1, 'name' => 'Technic Renamed']);
    });

    it('should be linkable to sets via the theme_id FK after sync', function(): void {
        // arrange
        Http::fake([
            'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                'results' => [
                    ['id' => 158, 'parent_id' => null, 'name' => 'Star Wars'],
                ],
                'next' => null,
            ]),
        ]);

        Artisan::call('themes:sync');

        // act — attach a set to the synced theme
        $starWars = Theme::query()->where('rebrickable_id', 158)->firstOrFail();
        $set = Set::factory()->create(['theme_id' => $starWars->id]);

        // assert
        expect($set->theme)->not->toBeNull();
        expect($set->theme->name)->toBe('Star Wars');
    });
});
