<?php

declare(strict_types = 1);

namespace App\Services;

use App\Contracts\LegoDataServiceInterface;
use App\DataTransferObjects\Input\Lego\LegoColorData;
use App\DataTransferObjects\Input\Lego\LegoPartData;
use App\DataTransferObjects\Input\Lego\LegoSetData;
use App\DataTransferObjects\Input\Lego\LegoSetPartData;
use App\DataTransferObjects\Input\Lego\LegoThemeData;
use App\DataTransferObjects\Input\Lego\RebrickableUserSetData;
use App\Exceptions\InvalidApiResponseException;
use App\Exceptions\RebrickableApiException;
use App\Exceptions\SetNotFoundException;
use Generator;
use Illuminate\Container\Attributes\Config;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;

use function array_key_exists;
use function is_array;
use function sprintf;

final readonly class RebrickableService implements LegoDataServiceInterface
{
    private const array SET_REQUIRED_FIELDS = ['set_num', 'name', 'year', 'num_parts'];

    private const array PART_REQUIRED_FIELDS = ['part', 'color', 'quantity', 'is_spare'];

    private const array PART_NESTED_REQUIRED_FIELDS = ['part_num', 'name'];

    private const array COLOR_NESTED_REQUIRED_FIELDS = ['id', 'name', 'rgb', 'is_trans'];

    private const array USER_SET_REQUIRED_FIELDS = ['set', 'quantity'];

    private const array THEME_REQUIRED_FIELDS = ['id', 'name'];

    public function __construct(
        private HttpFactory $httpFactory,
        private CacheRepository $cacheRepository,
        #[Config('services.rebrickable.key', '')]
        private string $apiKey,
        #[Config('services.rebrickable.base_url', 'https://rebrickable.com/api/v3')]
        private string $baseUrl,
        #[Config('services.rebrickable.cache_ttl', 86_400)]
        private int $cacheTtl,
        #[Config('services.rebrickable.user_cache_ttl', 3_600)]
        private int $userCacheTtl,
    ) {}

    /**
     * @throws SetNotFoundException
     * @throws RebrickableApiException
     * @throws InvalidApiResponseException
     */
    public function fetchSet(string $setNum): LegoSetData
    {
        $cacheKey = sprintf('rebrickable:set:%s', $setNum);

        $cached = $this->cacheRepository->get($cacheKey);
        if ($cached instanceof LegoSetData) {
            return $cached;
        }

        $response = $this->httpClient()->get(sprintf('/lego/sets/%s/', $setNum));

        $this->handleSetFetchError($response, $setNum);

        $data = $response->json();

        $this->validateSetResponse($data, $setNum);

        /** @var array<string, mixed> $data Validated by validateSetResponse */
        $legoSetData = $this->buildLegoSetData($data);

        $this->cacheRepository->put($cacheKey, $legoSetData, $this->cacheTtl);

        return $legoSetData;
    }

    /**
     * @throws SetNotFoundException
     * @throws RebrickableApiException
     * @throws InvalidApiResponseException
     */
    public function fetchSetByEan(string $ean): LegoSetData
    {
        $cacheKey = sprintf('rebrickable:ean:%s', $ean);

        $cached = $this->cacheRepository->get($cacheKey);
        if ($cached instanceof LegoSetData) {
            return $cached;
        }

        $response = $this->httpClient()->get('/lego/sets/', ['search' => $ean]);

        $this->throwOnApiError($response, sprintf("Failed to search for set by EAN '%s'", $ean));

        $data = $response->json();

        if (!is_array($data) || !array_key_exists('results', $data) || !is_array($data['results'])) {
            throw InvalidApiResponseException::invalidStructure(sprintf("Searching for set by EAN '%s'", $ean), "Missing or invalid 'results' field");
        }

        if ($data['results'] === []) {
            throw SetNotFoundException::forEan($ean);
        }

        /** @var array<string, mixed> $setData */
        $setData = $data['results'][0];

        $this->validateSetResponse($setData, sprintf("EAN '%s'", $ean));

        $legoSetData = $this->buildLegoSetData($setData);

        $this->cacheRepository->put($cacheKey, $legoSetData, $this->cacheTtl);

        return $legoSetData;
    }

    /**
     * @throws RebrickableApiException
     * @throws InvalidApiResponseException
     *
     * @return list<LegoSetPartData>
     */
    public function fetchSetParts(string $setNum): array
    {
        $cacheKey = sprintf('rebrickable:set:%s:parts', $setNum);

        /** @var list<LegoSetPartData>|null $cached */
        $cached = $this->cacheRepository->get($cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        /** @var list<LegoSetPartData> $parts */
        $parts = [];
        /** @var string|null $nextUrl @phpstan-ignore varTag.nativeType */
        $nextUrl = sprintf('/lego/sets/%s/parts/', $setNum);

        while ($nextUrl !== null) {
            $response = $this->httpClient()->get($nextUrl);

            $this->throwOnApiError($response, sprintf("Failed to fetch parts for set '%s'", $setNum));

            /** @var array{results: list<array{part: array{part_num: string, name: string, part_cat_id: int|null, part_img_url: string|null}, color: array{id: int, name: string, rgb: string, is_trans: bool}, quantity: int, is_spare: bool, element_id: string|null}>, next: string|null} $data */
            $data = $response->json();

            $this->validatePartsResponse($data, $setNum);

            foreach ($data['results'] as $partData) {
                $parts[] = new LegoSetPartData(
                    part: new LegoPartData(
                        partNum: $partData['part']['part_num'],
                        name: $partData['part']['name'],
                        categoryId: $partData['part']['part_cat_id'] ?? null,
                        imageUrl: $partData['part']['part_img_url'] ?? null,
                    ),
                    color: new LegoColorData(
                        id: $partData['color']['id'],
                        name: $partData['color']['name'],
                        rgb: $partData['color']['rgb'],
                        isTransparent: $partData['color']['is_trans'],
                    ),
                    quantity: $partData['quantity'],
                    isSpare: $partData['is_spare'],
                    elementId: $partData['element_id'] ?? null,
                );
            }

            $nextUrl = $this->sanitizePaginationUrl($data['next']);
        }

        $this->cacheRepository->put($cacheKey, $parts, $this->cacheTtl);

        return $parts;
    }

    /**
     * @throws RebrickableApiException
     * @throws InvalidApiResponseException
     *
     * @return Generator<int, list<RebrickableUserSetData>>
     */
    public function fetchUserSets(string $userToken): Generator
    {
        /** @var string|null $nextUrl @phpstan-ignore varTag.nativeType */
        $nextUrl = sprintf('/users/%s/sets/', $userToken);
        $page = 1;

        while ($nextUrl !== null) {
            $cacheKey = sprintf('rebrickable:user:%s:sets:page:%d', $userToken, $page);

            /** @var array{results: list<RebrickableUserSetData>, next: string|null}|null $cachedPage */
            $cachedPage = $this->cacheRepository->get($cacheKey);

            if (is_array($cachedPage)) {
                yield $cachedPage['results'];
                $nextUrl = $cachedPage['next'];
                $page++;

                continue;
            }

            $response = $this->httpClient()->get($nextUrl);

            $this->throwOnApiError($response, 'Failed to fetch user sets');

            $data = $response->json();

            $this->validateUserSetsResponse($data);

            /** @var array{results: list<array{set: array{set_num: string, name: string, year: int, theme_id: int|null, num_parts: int, set_img_url: string|null}, quantity: int}>, next: string|null} $validatedData */
            $validatedData = $data;

            /** @var list<RebrickableUserSetData> $pageResults */
            $pageResults = [];

            foreach ($validatedData['results'] as $setData) {
                $pageResults[] = new RebrickableUserSetData(
                    set: new LegoSetData(
                        setNum: $setData['set']['set_num'],
                        name: $setData['set']['name'],
                        year: $setData['set']['year'],
                        themeId: $setData['set']['theme_id'] ?? null,
                        numParts: $setData['set']['num_parts'],
                        imageUrl: $setData['set']['set_img_url'] ?? null,
                    ),
                    quantity: $setData['quantity'],
                );
            }

            $sanitizedNext = $this->sanitizePaginationUrl($validatedData['next']);

            $this->cacheRepository->put($cacheKey, [
                'results' => $pageResults,
                'next' => $sanitizedNext,
            ], $this->userCacheTtl);

            yield $pageResults;

            $nextUrl = $sanitizedNext;
            $page++;
        }
    }

    /**
     * @throws RebrickableApiException
     * @throws InvalidApiResponseException
     *
     * @return Generator<int, list<LegoThemeData>>
     */
    public function fetchThemes(): Generator
    {
        /** @var string|null $nextUrl */
        $nextUrl = '/lego/themes/';
        $page = 1;

        while ($nextUrl !== null) {
            $cacheKey = sprintf('rebrickable:themes:page:%d', $page);

            /** @var array{results: list<LegoThemeData>, next: string|null}|null $cachedPage */
            $cachedPage = $this->cacheRepository->get($cacheKey);

            if (is_array($cachedPage)) {
                yield $cachedPage['results'];
                $nextUrl = $cachedPage['next'];
                $page++;

                continue;
            }

            $response = $this->httpClient()->get($nextUrl);

            $this->throwOnApiError($response, 'Failed to fetch themes');

            $data = $response->json();

            $this->validateThemesResponse($data);

            /** @var array{results: list<array{id: int, parent_id: int|null, name: string}>, next: string|null} $validatedData */
            $validatedData = $data;

            /** @var list<LegoThemeData> $pageResults */
            $pageResults = [];

            foreach ($validatedData['results'] as $themeData) {
                $pageResults[] = new LegoThemeData(
                    id: $themeData['id'],
                    name: $themeData['name'],
                    parentId: $themeData['parent_id'] ?? null,
                );
            }

            $sanitizedNext = $this->sanitizePaginationUrl($validatedData['next']);

            $this->cacheRepository->put($cacheKey, [
                'results' => $pageResults,
                'next' => $sanitizedNext,
            ], $this->cacheTtl);

            yield $pageResults;

            $nextUrl = $sanitizedNext;
            $page++;
        }
    }

    /**
     * @param array<string, mixed> $data
     */
    private function buildLegoSetData(array $data): LegoSetData
    {
        /** @var array{set_num: string, name: string, year: int, theme_id?: int|null, num_parts: int, set_img_url?: string|null} $data */
        return new LegoSetData(
            setNum: $data['set_num'],
            name: $data['name'],
            year: $data['year'],
            themeId: $data['theme_id'] ?? null,
            numParts: $data['num_parts'],
            imageUrl: $data['set_img_url'] ?? null,
        );
    }

    private function sanitizePaginationUrl(?string $absoluteUrl): ?string
    {
        if ($absoluteUrl === null) {
            return null;
        }

        if (str_starts_with($absoluteUrl, $this->baseUrl)) {
            return $absoluteUrl;
        }

        $parsed = parse_url($absoluteUrl);

        return ($parsed['path'] ?? '') . (isset($parsed['query']) ? '?' . $parsed['query'] : '');
    }

    private function httpClient(): PendingRequest
    {
        return $this->httpFactory->baseUrl($this->baseUrl)
            ->withHeaders(['Authorization' => 'key ' . $this->apiKey])
            ->acceptJson()
            ->timeout(30)
            ->retry(3, 100, throw: false);
    }

    /**
     * @throws RebrickableApiException
     */
    private function throwOnApiError(Response $response, string $context): void
    {
        if ($response->failed()) {
            throw RebrickableApiException::fromResponse($response, $context);
        }
    }

    /**
     * @throws SetNotFoundException
     * @throws RebrickableApiException
     */
    private function handleSetFetchError(Response $response, string $setNum): void
    {
        if ($response->successful()) {
            return;
        }

        if ($response->status() === 404) {
            throw SetNotFoundException::forSetNum($setNum);
        }

        throw RebrickableApiException::fromResponse($response, sprintf("Failed to fetch set '%s'", $setNum));
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validateSetResponse(mixed $data, string $setNum): void
    {
        if (!is_array($data)) {
            throw InvalidApiResponseException::invalidStructure(sprintf("Fetching set '%s'", $setNum), 'Expected array response');
        }

        $missingFields = [];
        foreach (self::SET_REQUIRED_FIELDS as $field) {
            if (!array_key_exists($field, $data)) {
                $missingFields[] = $field;
            }
        }

        if ($missingFields !== []) {
            throw InvalidApiResponseException::missingFields($missingFields, sprintf("Fetching set '%s'", $setNum));
        }
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validatePartsResponse(mixed $data, string $setNum): void
    {
        if (!is_array($data)) {
            throw InvalidApiResponseException::invalidStructure(sprintf("Fetching parts for set '%s'", $setNum), 'Expected array response');
        }

        if (!array_key_exists('results', $data) || !is_array($data['results'])) {
            throw InvalidApiResponseException::invalidStructure(sprintf("Fetching parts for set '%s'", $setNum), "Missing or invalid 'results' field");
        }

        foreach ($data['results'] as $index => $partData) {
            $this->validatePartData($partData, $setNum, $index);
        }
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validatePartData(mixed $partData, string $setNum, int $index): void
    {
        if (!is_array($partData)) {
            throw InvalidApiResponseException::invalidStructure(sprintf("Fetching parts for set '%s'", $setNum), sprintf('Part at index %d is not an array', $index));
        }

        $missingFields = [];
        foreach (self::PART_REQUIRED_FIELDS as $field) {
            if (!array_key_exists($field, $partData)) {
                $missingFields[] = $field;
            }
        }

        if ($missingFields !== []) {
            throw InvalidApiResponseException::missingFields($missingFields, sprintf("Part at index %d for set '%s'", $index, $setNum));
        }

        $this->validateNestedPartData($partData['part'], $setNum, $index);
        $this->validateNestedColorData($partData['color'], $setNum, $index);
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validateNestedPartData(mixed $partData, string $setNum, int $index): void
    {
        if (!is_array($partData)) {
            throw InvalidApiResponseException::invalidStructure(sprintf("Part at index %d for set '%s'", $index, $setNum), "'part' field is not an array");
        }

        $missingFields = [];
        foreach (self::PART_NESTED_REQUIRED_FIELDS as $field) {
            if (!array_key_exists($field, $partData)) {
                $missingFields[] = 'part.' . $field;
            }
        }

        if ($missingFields !== []) {
            throw InvalidApiResponseException::missingFields($missingFields, sprintf("Part at index %d for set '%s'", $index, $setNum));
        }
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validateNestedColorData(mixed $colorData, string $setNum, int $index): void
    {
        if (!is_array($colorData)) {
            throw InvalidApiResponseException::invalidStructure(sprintf("Part at index %d for set '%s'", $index, $setNum), "'color' field is not an array");
        }

        $missingFields = [];
        foreach (self::COLOR_NESTED_REQUIRED_FIELDS as $field) {
            if (!array_key_exists($field, $colorData)) {
                $missingFields[] = 'color.' . $field;
            }
        }

        if ($missingFields !== []) {
            throw InvalidApiResponseException::missingFields($missingFields, sprintf("Part at index %d for set '%s'", $index, $setNum));
        }
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validateUserSetsResponse(mixed $data): void
    {
        if (!is_array($data)) {
            throw InvalidApiResponseException::invalidStructure('Fetching user sets', 'Expected array response');
        }

        if (!array_key_exists('results', $data) || !is_array($data['results'])) {
            throw InvalidApiResponseException::invalidStructure('Fetching user sets', "Missing or invalid 'results' field");
        }

        foreach ($data['results'] as $index => $setData) {
            $this->validateUserSetData($setData, $index);
        }
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validateUserSetData(mixed $setData, int $index): void
    {
        if (!is_array($setData)) {
            throw InvalidApiResponseException::invalidStructure('Fetching user sets', sprintf('Set at index %d is not an array', $index));
        }

        $missingFields = [];
        foreach (self::USER_SET_REQUIRED_FIELDS as $field) {
            if (!array_key_exists($field, $setData)) {
                $missingFields[] = $field;
            }
        }

        if ($missingFields !== []) {
            throw InvalidApiResponseException::missingFields($missingFields, sprintf('User set at index %d', $index));
        }

        $this->validateNestedSetData($setData['set'], $index);
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validateNestedSetData(mixed $setData, int $index): void
    {
        if (!is_array($setData)) {
            throw InvalidApiResponseException::invalidStructure(sprintf('User set at index %d', $index), "'set' field is not an array");
        }

        $missingFields = [];
        foreach (self::SET_REQUIRED_FIELDS as $field) {
            if (!array_key_exists($field, $setData)) {
                $missingFields[] = 'set.' . $field;
            }
        }

        if ($missingFields !== []) {
            throw InvalidApiResponseException::missingFields($missingFields, sprintf('User set at index %d', $index));
        }
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validateThemesResponse(mixed $data): void
    {
        if (!is_array($data)) {
            throw InvalidApiResponseException::invalidStructure('Fetching themes', 'Expected array response');
        }

        if (!array_key_exists('results', $data) || !is_array($data['results'])) {
            throw InvalidApiResponseException::invalidStructure('Fetching themes', "Missing or invalid 'results' field");
        }

        foreach ($data['results'] as $index => $themeData) {
            $this->validateThemeData($themeData, $index);
        }
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validateThemeData(mixed $themeData, int $index): void
    {
        if (!is_array($themeData)) {
            throw InvalidApiResponseException::invalidStructure('Fetching themes', sprintf('Theme at index %d is not an array', $index));
        }

        $missingFields = [];
        foreach (self::THEME_REQUIRED_FIELDS as $field) {
            if (!array_key_exists($field, $themeData)) {
                $missingFields[] = $field;
            }
        }

        if ($missingFields !== []) {
            throw InvalidApiResponseException::missingFields($missingFields, sprintf('Theme at index %d', $index));
        }
    }
}
