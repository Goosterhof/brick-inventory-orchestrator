<?php

declare(strict_types = 1);

use App\DataTransferObjects\Input\Lego\LegoSetData;
use App\DataTransferObjects\Input\Lego\LegoSetPartData;
use App\DataTransferObjects\Input\Lego\LegoThemeData;
use App\DataTransferObjects\Input\Lego\RebrickableUserSetData;
use App\Services\RebrickableService;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\Http;

covers(RebrickableService::class);

/**
 * Contract tests verify that our service parsing logic handles realistic API response
 * shapes — including extra fields the API returns that we don't consume. When Rebrickable
 * changes their response format, these fixtures should be updated to match, and any
 * breakage here signals integration drift before it reaches production.
 *
 * Fixtures live in tests/Unit/Services/Contracts/Fixtures/ and represent snapshots of
 * actual Rebrickable API v3 response shapes.
 */
const CONTRACT_API_KEY = 'test-api-key';
const CONTRACT_BASE_URL = 'https://rebrickable.com/api/v3';

function createContractRebrickableService(): RebrickableService
{
    return new RebrickableService(
        resolve(HttpFactory::class),
        resolve(CacheRepository::class),
        CONTRACT_API_KEY,
        CONTRACT_BASE_URL,
        86_400,
        3_600,
    );
}

function loadFixture(string $name): array
{
    $path = __DIR__ . '/Fixtures/' . $name;

    return json_decode((string) file_get_contents($path), true, 512, \JSON_THROW_ON_ERROR);
}

describe('Rebrickable API Contract', function(): void {
    describe('fetchSet contract', function(): void {
        it('should parse a full realistic set response including extra fields', function(): void {
            $fixture = loadFixture('rebrickable-set.json');

            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/' => Http::response($fixture),
            ]);

            $service = createContractRebrickableService();
            $result = $service->fetchSet('75192-1');

            expect($result)->toBeInstanceOf(LegoSetData::class);
            expect($result->setNum)->toBe('75192-1');
            expect($result->name)->toBe('Millennium Falcon');
            expect($result->year)->toBe(2_017);
            expect($result->themeId)->toBe(158);
            expect($result->numParts)->toBe(7_541);
            expect($result->imageUrl)->toBe('https://cdn.rebrickable.com/media/sets/75192-1/12345.jpg');
        });
    });

    describe('fetchSetByEan contract', function(): void {
        it('should parse a full realistic search response including extra fields', function(): void {
            $fixture = loadFixture('rebrickable-set-search.json');

            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/*' => Http::response($fixture),
            ]);

            $service = createContractRebrickableService();
            $result = $service->fetchSetByEan('5702016914177');

            expect($result)->toBeInstanceOf(LegoSetData::class);
            expect($result->setNum)->toBe('75192-1');
            expect($result->name)->toBe('Millennium Falcon');
            expect($result->year)->toBe(2_017);
            expect($result->themeId)->toBe(158);
            expect($result->numParts)->toBe(7_541);
        });
    });

    describe('fetchSetParts contract', function(): void {
        it('should parse a full realistic parts response including nested extra fields', function(): void {
            $fixture = loadFixture('rebrickable-set-parts.json');

            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response($fixture),
            ]);

            $service = createContractRebrickableService();
            $result = $service->fetchSetParts('75192-1');

            expect($result)->toHaveCount(2);

            // First part: all fields populated
            expect($result[0])->toBeInstanceOf(LegoSetPartData::class);
            expect($result[0]->part->partNum)->toBe('3001');
            expect($result[0]->part->name)->toBe('Brick 2 x 4');
            expect($result[0]->part->categoryId)->toBe(11);
            expect($result[0]->part->imageUrl)->toBe('https://cdn.rebrickable.com/media/parts/elements/300101.jpg');
            expect($result[0]->color->id)->toBe(1);
            expect($result[0]->color->name)->toBe('White');
            expect($result[0]->color->rgb)->toBe('FFFFFF');
            expect($result[0]->color->isTransparent)->toBeFalse();
            expect($result[0]->quantity)->toBe(5);
            expect($result[0]->isSpare)->toBeFalse();
            expect($result[0]->elementId)->toBe('300101');

            // Second part: nullable fields are null
            expect($result[1]->part->partNum)->toBe('3022');
            expect($result[1]->part->imageUrl)->toBeNull();
            expect($result[1]->color->name)->toBe('Black');
            expect($result[1]->isSpare)->toBeTrue();
            expect($result[1]->elementId)->toBeNull();
        });
    });

    describe('fetchThemes contract', function(): void {
        it('should parse a full realistic themes response including extra fields', function(): void {
            $fixture = loadFixture('rebrickable-themes.json');

            Http::fake([
                'https://rebrickable.com/api/v3/lego/themes/' => Http::response($fixture),
            ]);

            $service = createContractRebrickableService();
            $pages = iterator_to_array($service->fetchThemes());

            expect($pages)->toHaveCount(1);
            expect($pages[0])->toHaveCount(3);

            expect($pages[0][0])->toBeInstanceOf(LegoThemeData::class);
            expect($pages[0][0]->id)->toBe(1);
            expect($pages[0][0]->name)->toBe('Technic');
            expect($pages[0][0]->parentId)->toBeNull();

            expect($pages[0][1]->id)->toBe(158);
            expect($pages[0][1]->name)->toBe('Star Wars');
            expect($pages[0][1]->parentId)->toBeNull();

            expect($pages[0][2]->id)->toBe(209);
            expect($pages[0][2]->name)->toBe('Episode I');
            expect($pages[0][2]->parentId)->toBe(158);
        });
    });

    describe('fetchUserSets contract', function(): void {
        it('should parse a full realistic user sets response including extra fields', function(): void {
            $fixture = loadFixture('rebrickable-user-sets.json');

            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response($fixture),
            ]);

            $service = createContractRebrickableService();
            $pages = iterator_to_array($service->fetchUserSets('user-token-123'));

            expect($pages)->toHaveCount(1);
            expect($pages[0])->toHaveCount(2);

            // First set: all fields populated
            expect($pages[0][0])->toBeInstanceOf(RebrickableUserSetData::class);
            expect($pages[0][0]->set->setNum)->toBe('75192-1');
            expect($pages[0][0]->set->name)->toBe('Millennium Falcon');
            expect($pages[0][0]->set->year)->toBe(2_017);
            expect($pages[0][0]->set->themeId)->toBe(158);
            expect($pages[0][0]->set->numParts)->toBe(7_541);
            expect($pages[0][0]->quantity)->toBe(2);

            // Second set: nullable imageUrl
            expect($pages[0][1]->set->setNum)->toBe('10294-1');
            expect($pages[0][1]->set->name)->toBe('Titanic');
            expect($pages[0][1]->set->imageUrl)->toBeNull();
            expect($pages[0][1]->quantity)->toBe(1);
        });
    });
});
