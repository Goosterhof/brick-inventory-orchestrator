<?php

declare(strict_types = 1);

use App\Http\Controllers\FeedbackController;
use App\Models\User;
use App\Providers\AppServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

covers(FeedbackController::class);

uses(RefreshDatabase::class);

describe('FeedbackController', function(): void {
    beforeEach(function(): void {
        config()->set('report-tool.kendo_url', 'https://kendo.test');
        config()->set('report-tool.project', 3);
        config()->set('report-tool.token', 'secret-token');
    });

    describe('store', function(): void {
        it('should relay feedback with screenshots to kendo and return the created report', function(): void {
            // arrange
            $user = User::factory()->create(['name' => 'Ada Bricklayer']);

            Http::fake([
                'kendo.test/api/projects/3/reports' => Http::response([
                    'id' => 42,
                    'title' => 'Broken drawer',
                    'description' => 'The drawer view crashes',
                    'author_name' => 'Ada Bricklayer',
                ], 201),
            ]);

            // act
            $response = $this->actingAs($user)->postJson('/api/feedback', [
                'title' => 'Broken drawer',
                'description' => 'The drawer view crashes',
                'screenshots' => [
                    UploadedFile::fake()->image('crash-one.png'),
                    UploadedFile::fake()->image('crash-two.jpg'),
                ],
            ]);

            // assert
            $response->assertStatus(201)
                ->assertJsonPath('id', 42)
                ->assertJsonPath('title', 'Broken drawer')
                ->assertJsonPath('author_name', 'Ada Bricklayer');

            Http::assertSent(function(Request $request): bool {
                expect($request->url())->toBe('https://kendo.test/api/projects/3/reports')
                    ->and($request->hasHeader('Authorization', 'Bearer secret-token'))->toBeTrue();

                $fields = collect($request->data())->keyBy('name');

                expect($fields['title']['contents'])->toBe('Broken drawer')
                    ->and($fields['description']['contents'])->toBe('The drawer view crashes')
                    ->and($fields['author_name']['contents'])->toBe('Ada Bricklayer');

                $fileParts = collect($request->data())->where('name', 'files[]')->values();

                expect($fileParts)->toHaveCount(2);

                return true;
            });
        });

        it('should relay feedback without screenshots', function(): void {
            // arrange
            $user = User::factory()->create(['name' => 'Grace Sorter']);

            Http::fake([
                'kendo.test/api/projects/3/reports' => Http::response(['id' => 7], 201),
            ]);

            // act
            $response = $this->actingAs($user)->postJson('/api/feedback', [
                'title' => 'Missing piece',
                'description' => 'The 2x4 count is off by one',
            ]);

            // assert
            $response->assertStatus(201)
                ->assertJsonPath('id', 7);

            Http::assertSent(function(Request $request): bool {
                $names = collect($request->data())->pluck('name');

                expect($names)->not->toContain('files[]');

                return true;
            });
        });

        it('should return 422 when title is missing', function(): void {
            // arrange
            $user = User::factory()->create();
            Http::fake();

            // act
            $response = $this->actingAs($user)->postJson('/api/feedback', [
                'description' => 'No title given',
            ]);

            // assert
            $response->assertStatus(422)
                ->assertJsonValidationErrors(['title']);
            Http::assertNothingSent();
        });

        it('should return 422 when description is missing', function(): void {
            // arrange
            $user = User::factory()->create();
            Http::fake();

            // act
            $response = $this->actingAs($user)->postJson('/api/feedback', [
                'title' => 'No description given',
            ]);

            // assert
            $response->assertStatus(422)
                ->assertJsonValidationErrors(['description']);
            Http::assertNothingSent();
        });

        it('should return 422 when title exceeds 255 characters', function(): void {
            // arrange
            $user = User::factory()->create();
            Http::fake();

            // act
            $response = $this->actingAs($user)->postJson('/api/feedback', [
                'title' => str_repeat('a', 256),
                'description' => 'Title too long',
            ]);

            // assert
            $response->assertStatus(422)
                ->assertJsonValidationErrors(['title']);
            Http::assertNothingSent();
        });

        it('should return 422 when more than five screenshots are attached', function(): void {
            // arrange
            $user = User::factory()->create();
            Http::fake();

            // act
            $response = $this->actingAs($user)->postJson('/api/feedback', [
                'title' => 'Too many screenshots',
                'description' => 'Six is one over the cap',
                'screenshots' => [
                    UploadedFile::fake()->image('one.png'),
                    UploadedFile::fake()->image('two.png'),
                    UploadedFile::fake()->image('three.png'),
                    UploadedFile::fake()->image('four.png'),
                    UploadedFile::fake()->image('five.png'),
                    UploadedFile::fake()->image('six.png'),
                ],
            ]);

            // assert
            $response->assertStatus(422)
                ->assertJsonValidationErrors(['screenshots']);
            Http::assertNothingSent();
        });

        it('should return 422 when a screenshot exceeds the 3MB size cap', function(): void {
            // arrange
            $user = User::factory()->create();
            Http::fake();

            // act
            $response = $this->actingAs($user)->postJson('/api/feedback', [
                'title' => 'Oversized screenshot',
                'description' => 'One screenshot is too large',
                'screenshots' => [
                    UploadedFile::fake()->image('huge.png')->size(3_073), // 3073 KB > 3072 KB cap
                ],
            ]);

            // assert
            $response->assertStatus(422)
                ->assertJsonValidationErrors(['screenshots.0']);
            Http::assertNothingSent();
        });

        it('should return 422 when a screenshot is not an image', function(): void {
            // arrange
            $user = User::factory()->create();
            Http::fake();

            // act
            $response = $this->actingAs($user)->postJson('/api/feedback', [
                'title' => 'Bad attachment',
                'description' => 'A PDF is not a screenshot',
                'screenshots' => [
                    UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
                ],
            ]);

            // assert
            $response->assertStatus(422)
                ->assertJsonValidationErrors(['screenshots.0']);
            Http::assertNothingSent();
        });

        it('should return 401 when unauthenticated', function(): void {
            // arrange
            Http::fake();

            // act
            $response = $this->postJson('/api/feedback', [
                'title' => 'Broken drawer',
                'description' => 'The drawer view crashes',
            ]);

            // assert
            $response->assertStatus(401);
            Http::assertNothingSent();
        });

        it('should return 502 when the kendo submission fails', function(): void {
            // arrange
            $user = User::factory()->create();

            Http::fake([
                'kendo.test/api/projects/3/reports' => Http::response(['message' => 'nope'], 500),
            ]);

            // act
            $response = $this->actingAs($user)->postJson('/api/feedback', [
                'title' => 'Broken drawer',
                'description' => 'The drawer view crashes',
            ]);

            // assert
            $response->assertStatus(502)
                ->assertJsonPath('error', 'Failed to send feedback');
        });

        it('should return 502 when the kendo host is unreachable', function(): void {
            // arrange
            $user = User::factory()->create();

            Http::fake(function(): void {
                throw new ConnectionException('Connection timed out');
            });

            // act
            $response = $this->actingAs($user)->postJson('/api/feedback', [
                'title' => 'Broken drawer',
                'description' => 'The drawer view crashes',
            ]);

            // assert
            $response->assertStatus(502)
                ->assertJsonPath('error', 'Failed to send feedback');
        });
    });

    describe('rate limiting', function(): void {
        // Wiring assertion. The 'testing' env resolves every named limiter to Limit::none(),
        // so a naive "fire N+1 requests, expect 429" test passes green while asserting nothing.
        // This one asserts the fact the route file actually changed: the middleware is attached.
        it('should attach the feedback throttle middleware to the route', function(): void {
            // act
            $middleware = collect(Route::getRoutes()->getRoutes())
                ->filter(static fn(RoutingRoute $route): bool => $route->uri() === 'api/feedback'
                    && \in_array('POST', $route->methods(), true))
                ->flatMap(static fn(RoutingRoute $route): array => $route->gatherMiddleware())
                ->all();

            // assert
            expect($middleware)->toContain('throttle:feedback');
        });

        // Behavioural assertion. Mirrors the invite-email precedent in InviteCodeControllerTest:
        // the limiter is explicitly re-enabled by forcing the env to 'production' and re-binding
        // the provider closures, because the default testing env would make this vacuous.
        it('should rate-limit at 5 requests per hour per user', function(): void {
            // arrange
            $this->app['env'] = 'production';

            // Force the AppServiceProvider closures to re-bind under the new env.
            $this->app->register(AppServiceProvider::class, force: true);

            // No counter reset is needed: ThrottleRequests keys named limiters as
            // md5($limiterName . $limit->key), and RefreshDatabase mints a fresh user id per
            // test, so md5('feedback' . $userId) is unique to this test by construction.

            Http::fake([
                'kendo.test/api/projects/3/reports' => Http::response([
                    'id' => 42,
                    'title' => 'Broken drawer',
                    'description' => 'The drawer view crashes',
                    'author_name' => 'Ada Bricklayer',
                ], 201),
            ]);

            $user = User::factory()->create(['name' => 'Ada Bricklayer']);

            // act + assert — 5 calls within the hour are allowed.
            for ($i = 0; $i < 5; $i++) {
                $response = $this->actingAs($user)->postJson('/api/feedback', [
                    'title' => 'Broken drawer ' . $i,
                    'description' => 'The drawer view crashes',
                ]);

                $response->assertStatus(201);
            }

            // 6th call must be throttled.
            $response = $this->actingAs($user)->postJson('/api/feedback', [
                'title' => 'Broken drawer 6',
                'description' => 'The drawer view crashes',
            ]);

            $response->assertStatus(429);
        });
    });
});
