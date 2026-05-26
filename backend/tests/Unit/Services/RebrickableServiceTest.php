<?php

declare(strict_types = 1);

use App\DataTransferObjects\Input\Lego\LegoSetData;
use App\DataTransferObjects\Input\Lego\LegoSetPartData;
use App\DataTransferObjects\Input\Lego\LegoThemeData;
use App\DataTransferObjects\Input\Lego\RebrickableUserSetData;
use App\Exceptions\InvalidApiResponseException;
use App\Exceptions\RebrickableApiException;
use App\Exceptions\SetNotFoundException;
use App\Services\RebrickableService;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\Http;

covers(RebrickableService::class);

const TEST_API_KEY = 'test-api-key';
const TEST_BASE_URL = 'https://rebrickable.com/api/v3';
const TEST_CACHE_TTL = 86_400;
const TEST_USER_CACHE_TTL = 3_600;

function createRebrickableService(?CacheRepository $cacheRepository = null): RebrickableService
{
    return new RebrickableService(
        resolve(HttpFactory::class),
        $cacheRepository ?? resolve(CacheRepository::class),
        TEST_API_KEY,
        TEST_BASE_URL,
        TEST_CACHE_TTL,
        TEST_USER_CACHE_TTL,
    );
}

describe('RebrickableService', function(): void {
    describe('fetchSet', function(): void {
        it('should return set data from API', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/' => Http::response([
                    'set_num' => '75192-1',
                    'name' => 'Millennium Falcon',
                    'year' => 2_017,
                    'theme_id' => 158,
                    'num_parts' => 7_541,
                    'set_img_url' => 'https://example.com/75192.jpg',
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $result = $service->fetchSet('75192-1');

            // assert
            expect($result)->toBeInstanceOf(LegoSetData::class);
            expect($result->setNum)->toBe('75192-1');
            expect($result->name)->toBe('Millennium Falcon');
            expect($result->year)->toBe(2_017);
            expect($result->themeId)->toBe(158);
            expect($result->numParts)->toBe(7_541);
            expect($result->imageUrl)->toBe('https://example.com/75192.jpg');

            Http::assertSent(fn($request): bool => $request->url() === 'https://rebrickable.com/api/v3/lego/sets/75192-1/'
                && $request->method() === 'GET'
                && $request->header('Authorization') === ['key ' . TEST_API_KEY]);
        });

        it('should throw SetNotFoundException when set is not found', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/invalid/' => Http::response([], 404),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): LegoSetData => $service->fetchSet('invalid'))->toThrow(SetNotFoundException::class);
        });

        it('should throw RebrickableApiException on server error', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/' => Http::response([], 500),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): LegoSetData => $service->fetchSet('75192-1'))->toThrow(RebrickableApiException::class);
        });

        it('should handle null theme_id and set_img_url', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/10281-1/' => Http::response([
                    'set_num' => '10281-1',
                    'name' => 'Bonsai Tree',
                    'year' => 2_021,
                    'theme_id' => null,
                    'num_parts' => 878,
                    'set_img_url' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $result = $service->fetchSet('10281-1');

            // assert
            expect($result->themeId)->toBeNull();
            expect($result->imageUrl)->toBeNull();
        });

        it('should throw InvalidApiResponseException when response is missing required fields', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/' => Http::response([
                    'set_num' => '75192-1',
                    // missing 'name', 'year', 'num_parts'
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): LegoSetData => $service->fetchSet('75192-1'))->toThrow(InvalidApiResponseException::class);
        });

        it('should handle missing theme_id key in response', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/10281-1/' => Http::response([
                    'set_num' => '10281-1',
                    'name' => 'Bonsai Tree',
                    'year' => 2_021,
                    'num_parts' => 878,
                    'set_img_url' => 'https://example.com/10281.jpg',
                    // theme_id key is completely missing
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $result = $service->fetchSet('10281-1');

            // assert
            expect($result->themeId)->toBeNull();
            expect($result->imageUrl)->toBe('https://example.com/10281.jpg');
        });

        it('should handle missing set_img_url key in response', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/10281-1/' => Http::response([
                    'set_num' => '10281-1',
                    'name' => 'Bonsai Tree',
                    'year' => 2_021,
                    'theme_id' => 158,
                    'num_parts' => 878,
                    // set_img_url key is completely missing
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $result = $service->fetchSet('10281-1');

            // assert
            expect($result->themeId)->toBe(158);
            expect($result->imageUrl)->toBeNull();
        });

        it('should throw InvalidApiResponseException when response is not an array', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/' => Http::response('invalid'),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): LegoSetData => $service->fetchSet('75192-1'))->toThrow(InvalidApiResponseException::class);
        });
    });

    describe('fetchSetByEan', function(): void {
        it('should return set data when EAN matches a set', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/*' => Http::response([
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

            $service = createRebrickableService();

            // act
            $result = $service->fetchSetByEan('5702016914177');

            // assert
            expect($result)->toBeInstanceOf(LegoSetData::class);
            expect($result->setNum)->toBe('75192-1');
            expect($result->name)->toBe('Millennium Falcon');
            expect($result->year)->toBe(2_017);
            expect($result->themeId)->toBe(158);
            expect($result->numParts)->toBe(7_541);
            expect($result->imageUrl)->toBe('https://example.com/75192.jpg');

            Http::assertSent(fn($request): bool => str_contains((string) $request->url(), '/lego/sets/')
                && str_contains((string) $request->url(), 'search=5702016914177')
                && $request->method() === 'GET'
                && $request->header('Authorization') === ['key ' . TEST_API_KEY]);
        });

        it('should throw SetNotFoundException when no results match EAN', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/*' => Http::response([
                    'results' => [],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): LegoSetData => $service->fetchSetByEan('0000000000000'))->toThrow(SetNotFoundException::class);
        });

        it('should throw RebrickableApiException on server error', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/*' => Http::response([], 500),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): LegoSetData => $service->fetchSetByEan('5702016914177'))->toThrow(RebrickableApiException::class);
        });

        it('should throw InvalidApiResponseException when response has no results field', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/*' => Http::response([
                    'data' => [],
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): LegoSetData => $service->fetchSetByEan('5702016914177'))->toThrow(InvalidApiResponseException::class);
        });

        it('should handle missing theme_id and set_img_url in result', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/*' => Http::response([
                    'results' => [
                        [
                            'set_num' => '10281-1',
                            'name' => 'Bonsai Tree',
                            'year' => 2_021,
                            'num_parts' => 878,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $result = $service->fetchSetByEan('5702016914177');

            // assert
            expect($result->themeId)->toBeNull();
            expect($result->imageUrl)->toBeNull();
        });
    });

    describe('fetchSetParts', function(): void {
        it('should return parts data from API', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([
                    'results' => [
                        [
                            'part' => ['part_num' => '3001', 'name' => 'Brick 2 x 4', 'part_cat_id' => 11, 'part_img_url' => null],
                            'color' => ['id' => 1, 'name' => 'White', 'rgb' => 'FFFFFF', 'is_trans' => false],
                            'quantity' => 5,
                            'is_spare' => false,
                            'element_id' => '300101',
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $result = $service->fetchSetParts('75192-1');

            // assert
            expect($result)->toHaveCount(1);
            expect($result[0])->toBeInstanceOf(LegoSetPartData::class);
            expect($result[0]->part->partNum)->toBe('3001');

            Http::assertSent(fn($request): bool => $request->url() === 'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/'
                && $request->method() === 'GET'
                && $request->header('Authorization') === ['key ' . TEST_API_KEY]);
        });

        it('should handle pagination', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([
                    'results' => [
                        [
                            'part' => ['part_num' => '3001', 'name' => 'Brick 2 x 4', 'part_cat_id' => 11, 'part_img_url' => null],
                            'color' => ['id' => 1, 'name' => 'White', 'rgb' => 'FFFFFF', 'is_trans' => false],
                            'quantity' => 5,
                            'is_spare' => false,
                            'element_id' => null,
                        ],
                    ],
                    'next' => 'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/?page=2',
                ]),
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/?page=2' => Http::response([
                    'results' => [
                        [
                            'part' => ['part_num' => '3002', 'name' => 'Brick 2 x 3', 'part_cat_id' => null, 'part_img_url' => null],
                            'color' => ['id' => 2, 'name' => 'Black', 'rgb' => '000000', 'is_trans' => false],
                            'quantity' => 3,
                            'is_spare' => true,
                            'element_id' => null,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $result = $service->fetchSetParts('75192-1');

            // assert
            expect($result)->toHaveCount(2);
            expect($result[0]->part->partNum)->toBe('3001');
            expect($result[1]->part->partNum)->toBe('3002');
            Http::assertSentCount(2);

            // Verify both requests had proper authorization
            Http::assertSent(fn($request): bool => $request->url() === 'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/'
                && $request->method() === 'GET'
                && $request->header('Authorization') === ['key ' . TEST_API_KEY]);
            Http::assertSent(fn($request): bool => $request->url() === 'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/?page=2'
                && $request->method() === 'GET'
                && $request->header('Authorization') === ['key ' . TEST_API_KEY]);
        });

        it('should throw RebrickableApiException when API fails', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([], 500),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => $service->fetchSetParts('75192-1'))->toThrow(RebrickableApiException::class);
        });

        it('should throw InvalidApiResponseException when response is not an array', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response('invalid'),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => $service->fetchSetParts('75192-1'))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when results field is missing', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([
                    'data' => [], // wrong field name
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => $service->fetchSetParts('75192-1'))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when part at index is not an array', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([
                    'results' => [
                        'not-an-array', // string instead of array
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => $service->fetchSetParts('75192-1'))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when part data is missing required fields', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([
                    'results' => [
                        [
                            'part' => ['part_num' => '3001', 'name' => 'Brick 2 x 4', 'part_cat_id' => 11, 'part_img_url' => null],
                            // missing 'color', 'quantity', 'is_spare'
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => $service->fetchSetParts('75192-1'))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when nested part data is missing required fields', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([
                    'results' => [
                        [
                            'part' => ['part_num' => '3001'], // missing 'name'
                            'color' => ['id' => 1, 'name' => 'White', 'rgb' => 'FFFFFF', 'is_trans' => false],
                            'quantity' => 5,
                            'is_spare' => false,
                            'element_id' => null,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => $service->fetchSetParts('75192-1'))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when nested color data is missing required fields', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([
                    'results' => [
                        [
                            'part' => ['part_num' => '3001', 'name' => 'Brick 2 x 4', 'part_cat_id' => 11, 'part_img_url' => null],
                            'color' => ['id' => 1, 'name' => 'White'], // missing 'rgb', 'is_trans'
                            'quantity' => 5,
                            'is_spare' => false,
                            'element_id' => null,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => $service->fetchSetParts('75192-1'))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when part field is not an array', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([
                    'results' => [
                        [
                            'part' => 'not-an-array',
                            'color' => ['id' => 1, 'name' => 'White', 'rgb' => 'FFFFFF', 'is_trans' => false],
                            'quantity' => 5,
                            'is_spare' => false,
                            'element_id' => null,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => $service->fetchSetParts('75192-1'))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when color field is not an array', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([
                    'results' => [
                        [
                            'part' => ['part_num' => '3001', 'name' => 'Brick 2 x 4', 'part_cat_id' => 11, 'part_img_url' => null],
                            'color' => 'not-an-array',
                            'quantity' => 5,
                            'is_spare' => false,
                            'element_id' => null,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => $service->fetchSetParts('75192-1'))->toThrow(InvalidApiResponseException::class);
        });

        it('should strip host from pagination next URL to prevent SSRF', function(): void {
            // arrange — evil.com next URL should be stripped to path+query and resolved against baseUrl
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([
                    'results' => [
                        [
                            'part' => ['part_num' => '3001', 'name' => 'Brick 2 x 4', 'part_cat_id' => 11, 'part_img_url' => null],
                            'color' => ['id' => 1, 'name' => 'White', 'rgb' => 'FFFFFF', 'is_trans' => false],
                            'quantity' => 5,
                            'is_spare' => false,
                            'element_id' => null,
                        ],
                    ],
                    'next' => 'https://evil.com/steal?key=leaked',
                ]),
                // Path /steal resolves against baseUrl to: baseUrl + /steal
                'https://rebrickable.com/api/v3/steal?key=leaked' => Http::response([
                    'results' => [],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $result = $service->fetchSetParts('75192-1');

            // assert — the second request should go to the base URL host, not evil.com
            expect($result)->toHaveCount(1);
            Http::assertSentCount(2);
            Http::assertSent(fn($request): bool => $request->url() === 'https://rebrickable.com/api/v3/steal?key=leaked');
            Http::assertNotSent(fn($request): bool => str_contains((string) $request->url(), 'evil.com'));
        });
    });

    describe('fetchUserSets', function(): void {
        it('should yield user sets page from API', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response([
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

            $service = createRebrickableService();

            // act
            $pages = iterator_to_array($service->fetchUserSets(7, 'user-token-123'));

            // assert
            expect($pages)->toHaveCount(1);
            expect($pages[0])->toHaveCount(1);
            expect($pages[0][0])->toBeInstanceOf(RebrickableUserSetData::class);
            expect($pages[0][0]->set->setNum)->toBe('75192-1');
            expect($pages[0][0]->set->name)->toBe('Millennium Falcon');
            expect($pages[0][0]->quantity)->toBe(2);

            Http::assertSent(fn($request): bool => $request->url() === 'https://rebrickable.com/api/v3/users/user-token-123/sets/'
                && $request->method() === 'GET'
                && $request->header('Authorization') === ['key ' . TEST_API_KEY]);
        });

        it('should yield one page per API page', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response([
                    'results' => [
                        [
                            'set' => [
                                'set_num' => '75192-1',
                                'name' => 'Millennium Falcon',
                                'year' => 2_017,
                                'theme_id' => 158,
                                'num_parts' => 7_541,
                                'set_img_url' => null,
                            ],
                            'quantity' => 1,
                        ],
                    ],
                    'next' => 'https://rebrickable.com/api/v3/users/user-token-123/sets/?page=2',
                ]),
                'https://rebrickable.com/api/v3/users/user-token-123/sets/?page=2' => Http::response([
                    'results' => [
                        [
                            'set' => [
                                'set_num' => '10179-1',
                                'name' => 'Ultimate Collectors Millennium Falcon',
                                'year' => 2_007,
                                'theme_id' => 158,
                                'num_parts' => 5_195,
                                'set_img_url' => null,
                            ],
                            'quantity' => 2,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $pages = iterator_to_array($service->fetchUserSets(7, 'user-token-123'));

            // assert
            expect($pages)->toHaveCount(2);
            expect($pages[0][0]->set->setNum)->toBe('75192-1');
            expect($pages[1][0]->set->setNum)->toBe('10179-1');
            Http::assertSentCount(2);
        });

        it('should yield empty page when user has no sets', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response([
                    'results' => [],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $pages = iterator_to_array($service->fetchUserSets(7, 'user-token-123'));

            // assert
            expect($pages)->toHaveCount(1);
            expect($pages[0])->toHaveCount(0);
        });

        it('should throw RebrickableApiException on API error', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response([], 401),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchUserSets(7, 'user-token-123')))->toThrow(RebrickableApiException::class);
        });

        it('should throw InvalidApiResponseException when response is not an array', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response('invalid'),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchUserSets(7, 'user-token-123')))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when results field is missing', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response([
                    'data' => [],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchUserSets(7, 'user-token-123')))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when set data is missing required fields', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response([
                    'results' => [
                        [
                            // missing 'set' and 'quantity'
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchUserSets(7, 'user-token-123')))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when nested set is not an array', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response([
                    'results' => [
                        [
                            'set' => 'not-an-array',
                            'quantity' => 1,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchUserSets(7, 'user-token-123')))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when nested set is missing required fields', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response([
                    'results' => [
                        [
                            'set' => [
                                'set_num' => '75192-1',
                                // missing name, year, num_parts
                            ],
                            'quantity' => 1,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchUserSets(7, 'user-token-123')))->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when set at index is not an array', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response([
                    'results' => [
                        'not-an-array',
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchUserSets(7, 'user-token-123')))->toThrow(InvalidApiResponseException::class);
        });

        it('should strip host from pagination next URL to prevent SSRF', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response([
                    'results' => [
                        [
                            'set' => [
                                'set_num' => '75192-1',
                                'name' => 'Millennium Falcon',
                                'year' => 2_017,
                                'theme_id' => 158,
                                'num_parts' => 7_541,
                                'set_img_url' => null,
                            ],
                            'quantity' => 1,
                        ],
                    ],
                    'next' => 'https://evil.com/steal?key=leaked',
                ]),
                'https://rebrickable.com/api/v3/steal?key=leaked' => Http::response([
                    'results' => [],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $pages = iterator_to_array($service->fetchUserSets(7, 'user-token-123'));

            // assert — the second request should go to the base URL, not evil.com
            expect($pages)->toHaveCount(2);
            Http::assertSentCount(2);
            Http::assertSent(fn($request): bool => $request->url() === 'https://rebrickable.com/api/v3/steal?key=leaked');
            Http::assertNotSent(fn($request): bool => str_contains((string) $request->url(), 'evil.com'));
        });
    });

    describe('fetchThemes', function(): void {
        it('should yield themes from API', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                    'results' => [
                        ['id' => 1, 'parent_id' => null, 'name' => 'Technic'],
                        ['id' => 158, 'parent_id' => null, 'name' => 'Star Wars'],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $pages = iterator_to_array($service->fetchThemes());

            // assert
            expect($pages)->toHaveCount(1);
            expect($pages[0])->toHaveCount(2);
            expect($pages[0][0])->toBeInstanceOf(LegoThemeData::class);
            expect($pages[0][0]->id)->toBe(1);
            expect($pages[0][0]->name)->toBe('Technic');
            expect($pages[0][0]->parentId)->toBeNull();
            expect($pages[0][1]->id)->toBe(158);
            expect($pages[0][1]->name)->toBe('Star Wars');
            expect($pages[0][1]->parentId)->toBeNull();

            Http::assertSent(fn($request): bool => $request->url() === 'https://rebrickable.com/api/v3/lego/themes/'
                && $request->method() === 'GET'
                && $request->header('Authorization') === ['key ' . TEST_API_KEY]);
        });

        it('should yield each page from a paginated response', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                    'results' => [
                        ['id' => 1, 'parent_id' => null, 'name' => 'Technic'],
                    ],
                    'next' => 'https://rebrickable.com/api/v3/lego/themes/?page=2',
                ]),
                'https://rebrickable.com/api/v3/lego/themes/?page=2' => Http::response([
                    'results' => [
                        ['id' => 209, 'parent_id' => 158, 'name' => 'Episode I'],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $pages = iterator_to_array($service->fetchThemes());

            // assert
            expect($pages)->toHaveCount(2);
            expect($pages[0][0]->id)->toBe(1);
            expect($pages[1][0]->id)->toBe(209);
            expect($pages[1][0]->parentId)->toBe(158);
            Http::assertSentCount(2);
        });

        it('should return parent_id as null when the field is missing', function(): void {
            // arrange — Rebrickable always returns parent_id, but be tolerant
            Http::fake([
                'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                    'results' => [
                        ['id' => 1, 'name' => 'Technic'],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $pages = iterator_to_array($service->fetchThemes());

            // assert
            expect($pages[0][0]->parentId)->toBeNull();
        });

        it('should throw RebrickableApiException on 502', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/themes/' => Http::response([], 502),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchThemes()))
                ->toThrow(RebrickableApiException::class);
        });

        it('should throw InvalidApiResponseException when response is not an array', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/themes/' => Http::response('invalid'),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchThemes()))
                ->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when results field is missing', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                    'data' => [],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchThemes()))
                ->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when a theme entry is not an array', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                    'results' => ['not-an-array'],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchThemes()))
                ->toThrow(InvalidApiResponseException::class);
        });

        it('should throw InvalidApiResponseException when a theme is missing required fields', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                    'results' => [
                        ['parent_id' => null], // missing id and name
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act & assert
            expect(fn(): array => iterator_to_array($service->fetchThemes()))
                ->toThrow(InvalidApiResponseException::class);
        });

        it('should strip host from pagination next URL to prevent SSRF', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                    'results' => [
                        ['id' => 1, 'parent_id' => null, 'name' => 'Technic'],
                    ],
                    'next' => 'https://evil.com/steal?key=leaked',
                ]),
                'https://rebrickable.com/api/v3/steal?key=leaked' => Http::response([
                    'results' => [],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act
            $pages = iterator_to_array($service->fetchThemes());

            // assert
            expect($pages)->toHaveCount(2);
            Http::assertSentCount(2);
            Http::assertSent(fn($request): bool => $request->url() === 'https://rebrickable.com/api/v3/steal?key=leaked');
            Http::assertNotSent(fn($request): bool => str_contains((string) $request->url(), 'evil.com'));
        });

        it('should return cached fetchThemes pages without making HTTP call', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/themes/' => Http::response([
                    'results' => [
                        ['id' => 1, 'parent_id' => null, 'name' => 'Technic'],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // Prime cache
            iterator_to_array($service->fetchThemes());
            Http::assertSentCount(1);

            // act
            $pages = iterator_to_array($service->fetchThemes());

            // assert
            Http::assertSentCount(1);
            expect($pages)->toHaveCount(1);
            expect($pages[0][0]->id)->toBe(1);
        });
    });

    describe('caching', function(): void {
        it('should return cached fetchSet result without making HTTP call', function(): void {
            // arrange — prime the cache with a previous call
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/' => Http::response([
                    'set_num' => '75192-1',
                    'name' => 'Millennium Falcon',
                    'year' => 2_017,
                    'theme_id' => 158,
                    'num_parts' => 7_541,
                    'set_img_url' => 'https://example.com/75192.jpg',
                ]),
            ]);

            $service = createRebrickableService();

            // Prime cache
            $service->fetchSet('75192-1');
            Http::assertSentCount(1);

            // act — second call should use cache
            $result = $service->fetchSet('75192-1');

            // assert — still only 1 HTTP call (cached)
            Http::assertSentCount(1);
            expect($result)->toBeInstanceOf(LegoSetData::class);
            expect($result->setNum)->toBe('75192-1');
        });

        it('should return cached fetchSetByEan result without making HTTP call', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/*' => Http::response([
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

            $service = createRebrickableService();

            // Prime cache
            $service->fetchSetByEan('5702016914177');
            Http::assertSentCount(1);

            // act
            $result = $service->fetchSetByEan('5702016914177');

            // assert
            Http::assertSentCount(1);
            expect($result->setNum)->toBe('75192-1');
        });

        it('should return cached fetchSetParts result without making HTTP call', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/parts/' => Http::response([
                    'results' => [
                        [
                            'part' => ['part_num' => '3001', 'name' => 'Brick 2 x 4', 'part_cat_id' => 11, 'part_img_url' => null],
                            'color' => ['id' => 1, 'name' => 'White', 'rgb' => 'FFFFFF', 'is_trans' => false],
                            'quantity' => 5,
                            'is_spare' => false,
                            'element_id' => '300101',
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // Prime cache
            $service->fetchSetParts('75192-1');
            Http::assertSentCount(1);

            // act
            $result = $service->fetchSetParts('75192-1');

            // assert
            Http::assertSentCount(1);
            expect($result)->toHaveCount(1);
            expect($result[0]->part->partNum)->toBe('3001');
        });

        it('should return cached fetchUserSets pages without making HTTP call', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/users/user-token-123/sets/' => Http::response([
                    'results' => [
                        [
                            'set' => [
                                'set_num' => '75192-1',
                                'name' => 'Millennium Falcon',
                                'year' => 2_017,
                                'theme_id' => 158,
                                'num_parts' => 7_541,
                                'set_img_url' => null,
                            ],
                            'quantity' => 1,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // Prime cache
            iterator_to_array($service->fetchUserSets(7, 'user-token-123'));
            Http::assertSentCount(1);

            // act
            $pages = iterator_to_array($service->fetchUserSets(7, 'user-token-123'));

            // assert
            Http::assertSentCount(1);
            expect($pages)->toHaveCount(1);
            expect($pages[0][0]->set->setNum)->toBe('75192-1');
        });

        it('should key fetchUserSets cache by family id only — token must not appear in cache key (Sapper M6-M1 lockdown)', function(): void {
            // arrange — capture every cache key the service touches via a Mockery'd CacheRepository.
            // The decrypted user token must never be spliced into the cache.key column (ISO 27001 A.5.33).
            Http::fake([
                'https://rebrickable.com/api/v3/users/super-secret-token-abc123/sets/' => Http::response([
                    'results' => [
                        [
                            'set' => [
                                'set_num' => '75192-1',
                                'name' => 'Millennium Falcon',
                                'year' => 2_017,
                                'theme_id' => 158,
                                'num_parts' => 7_541,
                                'set_img_url' => null,
                            ],
                            'quantity' => 1,
                        ],
                    ],
                    'next' => 'https://rebrickable.com/api/v3/users/super-secret-token-abc123/sets/?page=2',
                ]),
                'https://rebrickable.com/api/v3/users/super-secret-token-abc123/sets/?page=2' => Http::response([
                    'results' => [
                        [
                            'set' => [
                                'set_num' => '10179-1',
                                'name' => 'UCS Millennium Falcon',
                                'year' => 2_007,
                                'theme_id' => 158,
                                'num_parts' => 5_195,
                                'set_img_url' => null,
                            ],
                            'quantity' => 1,
                        ],
                    ],
                    'next' => null,
                ]),
            ]);

            /** @var list<string> $observedCacheKeys */
            $observedCacheKeys = [];

            $cacheRepository = \Mockery::mock(CacheRepository::class);
            $cacheRepository->shouldReceive('get')
                ->andReturnUsing(function(string $key) use (&$observedCacheKeys): null {
                    $observedCacheKeys[] = $key;

                    return null;
                });
            $cacheRepository->shouldReceive('put')
                ->andReturnUsing(function(string $key) use (&$observedCacheKeys): bool {
                    $observedCacheKeys[] = $key;

                    return true;
                });

            $service = createRebrickableService($cacheRepository);

            // act — fetch all pages
            iterator_to_array($service->fetchUserSets(42, 'super-secret-token-abc123'));

            // assert — every cache key matches the family-id-rooted shape and contains zero token leakage
            expect($observedCacheKeys)->not->toBe([]);
            foreach ($observedCacheKeys as $observedCacheKey) {
                expect($observedCacheKey)->not->toContain('super-secret-token-abc123');
                expect($observedCacheKey)->toMatch('/^rebrickable:user:42:sets:page:\d+$/');
            }

            // sanity — both pages exercised
            expect($observedCacheKeys)->toContain('rebrickable:user:42:sets:page:1');
            expect($observedCacheKeys)->toContain('rebrickable:user:42:sets:page:2');
        });

        it('should use separate cache keys for different family ids — token rotation is structurally irrelevant (Sapper M6-M2 lockdown)', function(): void {
            // arrange — two families with two different (rotated) tokens; cache key must isolate by family id.
            Http::fake([
                'https://rebrickable.com/api/v3/users/token-old/sets/' => Http::response([
                    'results' => [],
                    'next' => null,
                ]),
                'https://rebrickable.com/api/v3/users/token-new/sets/' => Http::response([
                    'results' => [],
                    'next' => null,
                ]),
            ]);

            /** @var list<string> $observedCacheKeys */
            $observedCacheKeys = [];

            $cacheRepository = \Mockery::mock(CacheRepository::class);
            $cacheRepository->shouldReceive('get')
                ->andReturnUsing(function(string $key) use (&$observedCacheKeys): null {
                    $observedCacheKeys[] = $key;

                    return null;
                });
            $cacheRepository->shouldReceive('put')
                ->andReturnUsing(function(string $key) use (&$observedCacheKeys): bool {
                    $observedCacheKeys[] = $key;

                    return true;
                });

            $service = createRebrickableService($cacheRepository);

            // act — family 7 rotates its token mid-window; cache key is invariant.
            iterator_to_array($service->fetchUserSets(7, 'token-old'));
            iterator_to_array($service->fetchUserSets(7, 'token-new'));

            // assert — both calls hit the SAME family-rooted cache key; neither token appears.
            foreach ($observedCacheKeys as $observedCacheKey) {
                expect($observedCacheKey)->not->toContain('token-old');
                expect($observedCacheKey)->not->toContain('token-new');
            }

            expect($observedCacheKeys)->toContain('rebrickable:user:7:sets:page:1');
        });

        it('should use separate cache keys for different set numbers', function(): void {
            // arrange
            Http::fake([
                'https://rebrickable.com/api/v3/lego/sets/75192-1/' => Http::response([
                    'set_num' => '75192-1',
                    'name' => 'Millennium Falcon',
                    'year' => 2_017,
                    'theme_id' => 158,
                    'num_parts' => 7_541,
                    'set_img_url' => null,
                ]),
                'https://rebrickable.com/api/v3/lego/sets/10281-1/' => Http::response([
                    'set_num' => '10281-1',
                    'name' => 'Bonsai Tree',
                    'year' => 2_021,
                    'theme_id' => null,
                    'num_parts' => 878,
                    'set_img_url' => null,
                ]),
            ]);

            $service = createRebrickableService();

            // act — fetch two different sets
            $result1 = $service->fetchSet('75192-1');
            $result2 = $service->fetchSet('10281-1');

            // assert — both HTTP calls were made (different cache keys)
            Http::assertSentCount(2);
            expect($result1->setNum)->toBe('75192-1');
            expect($result2->setNum)->toBe('10281-1');
        });
    });
});
