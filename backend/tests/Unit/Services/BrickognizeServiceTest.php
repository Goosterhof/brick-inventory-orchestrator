<?php

declare(strict_types = 1);

use App\DataTransferObjects\Input\Brickognize\BrickognizePredictionData;
use App\Exceptions\BrickognizeApiException;
use App\Exceptions\InvalidApiResponseException;
use App\Services\BrickognizeService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

covers(BrickognizeService::class);

const TEST_BRICKOGNIZE_BASE_URL = 'https://api.brickognize.com';

describe('BrickognizeService', function(): void {
    describe('identifyBrick', function(): void {
        it('should return predictions from API', function(): void {
            // arrange
            Http::fake([
                'https://api.brickognize.com/predict/' => Http::response([
                    'items' => [
                        [
                            'id' => '3001',
                            'name' => 'Brick 2 x 4',
                            'type' => 'part',
                            'img_url' => 'https://example.com/3001.jpg',
                            'score' => 0.95,
                        ],
                        [
                            'id' => '3002',
                            'name' => 'Brick 2 x 3',
                            'type' => 'part',
                            'img_url' => null,
                            'score' => 0.72,
                        ],
                    ],
                ]),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act
            $result = $service->identifyBrick($image);

            // assert
            expect($result)->toHaveCount(2);
            expect($result[0])->toBeInstanceOf(BrickognizePredictionData::class);
            expect($result[0]->id)->toBe('3001');
            expect($result[0]->name)->toBe('Brick 2 x 4');
            expect($result[0]->type)->toBe('part');
            expect($result[0]->imageUrl)->toBe('https://example.com/3001.jpg');
            expect($result[0]->score)->toBe(0.95);
            expect($result[1]->imageUrl)->toBeNull();

            Http::assertSent(fn($request): bool => $request->url() === 'https://api.brickognize.com/predict/'
                && $request->method() === 'POST');
        });

        it('should return empty array when no items found', function(): void {
            // arrange
            Http::fake([
                'https://api.brickognize.com/predict/' => Http::response([
                    'items' => [],
                ]),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act
            $result = $service->identifyBrick($image);

            // assert
            expect($result)->toHaveCount(0);
        });

        it('should throw BrickognizeApiException on API error', function(): void {
            // arrange
            Http::fake([
                'https://api.brickognize.com/predict/' => Http::response([], 500),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act & assert
            expect(fn(): array => $service->identifyBrick($image))->toThrow(BrickognizeApiException::class);
        });

        it('should throw InvalidApiResponseException for malformed response', function(mixed $responseBody): void {
            // arrange
            Http::fake([
                'https://api.brickognize.com/predict/' => Http::response($responseBody),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act & assert
            expect(fn(): array => $service->identifyBrick($image))->toThrow(InvalidApiResponseException::class);
        })->with([
            'response is not an array' => ['invalid'],
            'items field is missing' => [['data' => []]],
            'prediction at index is not an array' => [['items' => ['not-an-array']]],
            'prediction is missing required fields' => [['items' => [['id' => '3001']]]],
        ]);

        it('should handle integer score values', function(): void {
            // arrange
            Http::fake([
                'https://api.brickognize.com/predict/' => Http::response([
                    'items' => [
                        [
                            'id' => '3001',
                            'name' => 'Brick 2 x 4',
                            'type' => 'part',
                            'img_url' => null,
                            'score' => 1, // integer instead of float
                        ],
                    ],
                ]),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act
            $result = $service->identifyBrick($image);

            // assert
            expect($result[0]->score)->toBe(1.0);
        });
    });

    describe('retry policy', function(): void {
        it('should honour the Retry-After header in seconds when the API rate limits', function(): void {
            // arrange
            Sleep::fake();

            Http::fake([
                'https://api.brickognize.com/predict/' => Http::sequence()
                    ->push([], 429, ['Retry-After' => '2'])
                    ->push(['items' => []]),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act
            $result = $service->identifyBrick($image);

            // assert — one retry that waited exactly the advertised 2 seconds
            expect($result)->toHaveCount(0);
            Http::assertSentCount(2);
            Sleep::assertSequence([Sleep::for(2)->seconds()]);
        });

        it('should clamp an excessive Retry-After to the 60 second cap', function(): void {
            // arrange
            Sleep::fake();

            Http::fake([
                'https://api.brickognize.com/predict/' => Http::sequence()
                    ->push([], 429, ['Retry-After' => '120'])
                    ->push(['items' => []]),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act
            $result = $service->identifyBrick($image);

            // assert — the 120s the API asked for is bounded to 60s
            expect($result)->toHaveCount(0);
            Sleep::assertSequence([Sleep::for(60)->seconds()]);
        });

        it('should fall back to a bounded default when Retry-After is missing on a 429', function(): void {
            // arrange
            Sleep::fake();

            Http::fake([
                'https://api.brickognize.com/predict/' => Http::sequence()
                    ->push([], 429)
                    ->push(['items' => []]),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act
            $result = $service->identifyBrick($image);

            // assert
            expect($result)->toHaveCount(0);
            Sleep::assertSequence([Sleep::for(1)->second()]);
        });

        it('should fall back to a bounded default when Retry-After is not in seconds form', function(): void {
            // arrange
            Sleep::fake();

            Http::fake([
                'https://api.brickognize.com/predict/' => Http::sequence()
                    ->push([], 429, ['Retry-After' => 'Wed, 21 Oct 2026 07:28:00 GMT'])
                    ->push(['items' => []]),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act
            $result = $service->identifyBrick($image);

            // assert — HTTP-date form is not parsed; bounded default applies
            expect($result)->toHaveCount(0);
            Sleep::assertSequence([Sleep::for(1)->second()]);
        });

        it('should keep the fixed 100ms backoff for non-429 failures', function(): void {
            // arrange
            Sleep::fake();

            Http::fake([
                'https://api.brickognize.com/predict/' => Http::sequence()
                    ->push([], 500)
                    ->push(['items' => []]),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act
            $result = $service->identifyBrick($image);

            // assert — pre-existing behavior unchanged
            expect($result)->toHaveCount(0);
            Sleep::assertSequence([Sleep::for(100)->milliseconds()]);
        });

        it('should keep the fixed 100ms backoff when the connection fails', function(): void {
            // arrange
            Sleep::fake();

            Http::fake([
                'https://api.brickognize.com/predict/' => Http::failedConnection(),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act & assert — no response to read a Retry-After from; fixed backoff applies
            expect(fn(): array => $service->identifyBrick($image))->toThrow(ConnectionException::class);
            Sleep::assertSequence([
                Sleep::for(100)->milliseconds(),
                Sleep::for(100)->milliseconds(),
            ]);
        });

        it('should throw BrickognizeApiException when 429 retries are exhausted', function(): void {
            // arrange
            Sleep::fake();

            Http::fake([
                'https://api.brickognize.com/predict/' => Http::sequence()
                    ->push([], 429, ['Retry-After' => '1'])
                    ->push([], 429, ['Retry-After' => '1'])
                    ->push([], 429, ['Retry-After' => '1']),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), TEST_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');

            // act & assert — bounded attempts; the typed 502-path exception still surfaces
            expect(fn(): array => $service->identifyBrick($image))->toThrow(BrickognizeApiException::class);
            Http::assertSentCount(3);
            Sleep::assertSequence([
                Sleep::for(1)->second(),
                Sleep::for(1)->second(),
            ]);
        });
    });
});
