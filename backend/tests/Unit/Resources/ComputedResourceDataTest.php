<?php

declare(strict_types = 1);

use App\Contracts\ResourceResponseInterface;
use App\Enums\FamilySetStatus;
use App\Http\Resources\ComputedResourceData;
use Illuminate\Http\JsonResponse;

covers(ComputedResourceData::class);

// Concrete test doubles for the abstract ComputedResourceData base class.
// Source DTOs are plain objects — the marker interface retired with the
// Input/Result migration; the base's `from(object)` signature is the contract.

final readonly class TestSourceData
{
    public function __construct(
        public string $name,
        public int $count,
    ) {}
}

/**
 * @extends ComputedResourceData<TestSourceData>
 */
final readonly class TestComputedResourceData extends ComputedResourceData
{
    public function __construct(
        public string $name,
        public int $count,
    ) {}

    /**
     * @param \TestSourceData $resultData
     */
    public static function from(object $resultData): static
    {
        return new self(
            name: $resultData->name,
            count: $resultData->count,
        );
    }
}

final readonly class TestEnumSourceData
{
    public function __construct(
        public FamilySetStatus $status,
    ) {}
}

/**
 * @extends ComputedResourceData<TestEnumSourceData>
 */
final readonly class TestComputedEnumResourceData extends ComputedResourceData
{
    public function __construct(
        public FamilySetStatus $status,
    ) {}

    /**
     * @param \TestEnumSourceData $resultData
     */
    public static function from(object $resultData): static
    {
        return new self(status: $resultData->status);
    }
}

final readonly class TestDateSourceData
{
    public function __construct(
        public \DateTimeInterface $created_at,
    ) {}
}

/**
 * @extends ComputedResourceData<TestDateSourceData>
 */
final readonly class TestComputedDateResourceData extends ComputedResourceData
{
    public function __construct(
        public \DateTimeInterface $created_at,
    ) {}

    /**
     * @param \TestDateSourceData $resultData
     */
    public static function from(object $resultData): static
    {
        return new self(created_at: $resultData->created_at);
    }
}

final readonly class TestArraySourceData
{
    /**
     * @param array<int, FamilySetStatus> $statuses
     */
    public function __construct(
        public array $statuses,
    ) {}
}

/**
 * @extends ComputedResourceData<TestArraySourceData>
 */
final readonly class TestComputedArrayResourceData extends ComputedResourceData
{
    /**
     * @param array<int, FamilySetStatus> $statuses
     */
    public function __construct(
        public array $statuses,
    ) {}

    /**
     * @param \TestArraySourceData $resultData
     */
    public static function from(object $resultData): static
    {
        return new self(statuses: $resultData->statuses);
    }
}

final readonly class TestNullableSourceData
{
    public function __construct(
        public ?string $optional,
    ) {}
}

/**
 * @extends ComputedResourceData<TestNullableSourceData>
 */
final readonly class TestComputedNullableResourceData extends ComputedResourceData
{
    public function __construct(
        public ?string $optional,
    ) {}

    /**
     * @param \TestNullableSourceData $resultData
     */
    public static function from(object $resultData): static
    {
        return new self(optional: $resultData->optional);
    }
}

final readonly class TestNestedSourceData
{
    public function __construct(
        public int $id,
        public string $childName,
        public int $childCount,
    ) {}
}

/**
 * @extends ComputedResourceData<TestNestedSourceData>
 */
final readonly class TestComputedNestedResourceData extends ComputedResourceData
{
    public function __construct(
        public int $id,
        public \TestComputedResourceData $child,
    ) {}

    /**
     * @param \TestNestedSourceData $resultData
     */
    public static function from(object $resultData): static
    {
        $child = new \TestComputedResourceData(
            name: $resultData->childName,
            count: $resultData->childCount,
        );

        return new self(
            id: $resultData->id,
            child: $child,
        );
    }
}

describe('ComputedResourceData', function(): void {
    describe('from()', function(): void {
        it('should create an instance from a Result DTO object', function(): void {
            // arrange
            $source = new \TestSourceData(name: 'Test', count: 42);

            // act
            $resource = \TestComputedResourceData::from($source);

            // assert
            expect($resource)->toBeInstanceOf(\TestComputedResourceData::class)
                ->and($resource->name)->toBe('Test')
                ->and($resource->count)->toBe(42);
        });
    });

    describe('transformValue()', function(): void {
        it('should transform nested ResourceResponse instances to arrays', function(): void {
            // arrange
            $source = new \TestNestedSourceData(id: 1, childName: 'Alice', childCount: 30);

            // act
            $resource = \TestComputedNestedResourceData::from($source);
            $array = $resource->toArray();

            // assert
            expect($array['child'])->toBeArray()
                ->and($array['child']['name'])->toBe('Alice')
                ->and($array['child']['count'])->toBe(30);
        });

        it('should transform BackedEnum instances to their backing value', function(): void {
            // arrange
            $resource = new \TestComputedEnumResourceData(FamilySetStatus::Built);

            // act
            $array = $resource->toArray();

            // assert
            expect($array['status'])->toBe('built');
        });

        it('should transform DateTimeInterface instances to ISO 8601 format', function(): void {
            // arrange
            $date = new \DateTimeImmutable('2025-06-15T14:30:00+02:00');
            $resource = new \TestComputedDateResourceData($date);

            // act
            $array = $resource->toArray();

            // assert
            expect($array['created_at'])->toBe('2025-06-15T14:30:00+02:00');
        });

        it('should recursively transform array values', function(): void {
            // arrange
            $resource = new \TestComputedArrayResourceData([FamilySetStatus::Sealed, FamilySetStatus::Built]);

            // act
            $array = $resource->toArray();

            // assert
            expect($array['statuses'])->toBe(['sealed', 'built']);
        });

        it('should pass through scalar values unchanged', function(): void {
            // arrange
            $source = new \TestSourceData(name: 'Test', count: 25);

            // act
            $resource = \TestComputedResourceData::from($source);
            $array = $resource->toArray();

            // assert
            expect($array['name'])->toBe('Test')
                ->and($array['count'])->toBe(25);
        });

        it('should pass through null values unchanged', function(): void {
            // arrange
            $resource = new \TestComputedNullableResourceData(null);

            // act
            $array = $resource->toArray();

            // assert
            expect($array['optional'])->toBeNull();
        });
    });

    describe('toResponse()', function(): void {
        it('should return a JsonResponse with 200 status', function(): void {
            // arrange
            $source = new \TestSourceData(name: 'Test', count: 25);
            $resource = \TestComputedResourceData::from($source);

            // act
            $response = $resource->toResponse();

            // assert
            expect($response)->toBeInstanceOf(JsonResponse::class)
                ->and($response->getStatusCode())->toBe(200);
        });
    });

    describe('toResponseWithStatus()', function(): void {
        it('should return a JsonResponse with the specified status code', function(): void {
            // arrange
            $source = new \TestSourceData(name: 'Test', count: 25);
            $resource = \TestComputedResourceData::from($source);

            // act
            $response = $resource->toResponseWithStatus(201);

            // assert
            expect($response)->toBeInstanceOf(JsonResponse::class)
                ->and($response->getStatusCode())->toBe(201);
        });
    });

    describe('jsonSerialize()', function(): void {
        it('should return the same array as toArray()', function(): void {
            // arrange
            $source = new \TestSourceData(name: 'Test', count: 25);
            $resource = \TestComputedResourceData::from($source);

            // act & assert
            expect($resource->jsonSerialize())->toBe($resource->toArray());
        });
    });

    it('should implement ResourceResponse interface', function(): void {
        // arrange
        $source = new \TestSourceData(name: 'Test', count: 25);
        $resource = \TestComputedResourceData::from($source);

        // assert
        expect($resource)->toBeInstanceOf(ResourceResponseInterface::class);
    });
});
