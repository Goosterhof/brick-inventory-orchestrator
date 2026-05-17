<?php

declare(strict_types = 1);

use App\DataTransferObjects\Input\Brickognize\BrickognizePredictionData;
use App\Services\BrickognizeService;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

covers(BrickognizeService::class);

/**
 * Contract tests verify that our service parsing logic handles realistic API response
 * shapes — including extra fields the API returns that we don't consume. When Brickognize
 * changes their response format, this fixture should be updated to match, and any
 * breakage here signals integration drift before it reaches production.
 *
 * Fixtures live in tests/Unit/Services/Contracts/Fixtures/ and represent snapshots of
 * actual Brickognize API response shapes.
 */
const CONTRACT_BRICKOGNIZE_BASE_URL = 'https://api.brickognize.com';

function loadBrickognizeFixture(string $name): array
{
    $path = __DIR__ . '/Fixtures/' . $name;

    return json_decode((string) file_get_contents($path), true, 512, \JSON_THROW_ON_ERROR);
}

describe('Brickognize API Contract', function(): void {
    describe('identifyBrick contract', function(): void {
        it('should parse a full realistic prediction response', function(): void {
            $fixture = loadBrickognizeFixture('brickognize-predict.json');

            Http::fake([
                'https://api.brickognize.com/predict/' => Http::response($fixture),
            ]);

            $service = new BrickognizeService(resolve(HttpFactory::class), CONTRACT_BRICKOGNIZE_BASE_URL);
            $image = UploadedFile::fake()->image('brick.jpg');
            $result = $service->identifyBrick($image);

            expect($result)->toHaveCount(3);

            // First prediction: high confidence with image
            expect($result[0])->toBeInstanceOf(BrickognizePredictionData::class);
            expect($result[0]->id)->toBe('3001');
            expect($result[0]->name)->toBe('Brick 2 x 4');
            expect($result[0]->type)->toBe('part');
            expect($result[0]->imageUrl)->toBe('https://img.brickognize.com/parts/3001.jpg');
            expect($result[0]->score)->toBe(0.95);

            // Second prediction: null image URL
            expect($result[1]->id)->toBe('3002');
            expect($result[1]->imageUrl)->toBeNull();
            expect($result[1]->score)->toBe(0.72);

            // Third prediction: low confidence
            expect($result[2]->id)->toBe('6143');
            expect($result[2]->name)->toBe('Duplo Brick 2 x 2');
            expect($result[2]->score)->toBe(0.15);
        });
    });
});
