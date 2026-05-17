<?php

declare(strict_types = 1);

use App\DataTransferObjects\Input\Brickognize\BrickognizePredictionData;
use App\Exceptions\BrickognizeApiException;
use App\Exceptions\InvalidApiResponseException;
use App\Services\BrickognizeService;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

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
});
