<?php

declare(strict_types = 1);

use App\Enums\FamilySetStatus;
use App\Exceptions\MissingRelationException;
use App\Http\Resources\ResourceData;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;

covers(ResourceData::class);

// Concrete test doubles for the abstract ResourceData base class

final readonly class TestResourceData extends ResourceData
{
    public function __construct(
        public string $name,
        public int $age,
    ) {}

    public static function from(Model $model): static
    {
        return new self(
            name: $model->name,
            age: $model->age,
        );
    }
}

final readonly class TestParentResourceData extends ResourceData
{
    public const array EAGER_LOAD = ['child'];

    public function __construct(
        public int $id,
        public \TestResourceData $child,
    ) {}

    public static function from(Model $model): static
    {
        $model->loadMissing(self::requiredRelations());
        self::validateRelationsLoaded($model);

        return new self(
            id: $model->id,
            child: \TestResourceData::from($model->child),
        );
    }
}

final readonly class TestEnumResourceData extends ResourceData
{
    public function __construct(
        public FamilySetStatus $status,
    ) {}

    public static function from(Model $model): static
    {
        return new self(status: $model->status);
    }
}

final readonly class TestDateResourceData extends ResourceData
{
    public function __construct(
        public \DateTimeInterface $created_at,
    ) {}

    public static function from(Model $model): static
    {
        return new self(created_at: $model->created_at);
    }
}

final readonly class TestArrayResourceData extends ResourceData
{
    /**
     * @param array<int, FamilySetStatus> $statuses
     */
    public function __construct(
        public array $statuses,
    ) {}

    public static function from(Model $model): static
    {
        return new self(statuses: $model->statuses);
    }
}

final readonly class TestNullableResourceData extends ResourceData
{
    public function __construct(
        public ?string $optional,
    ) {}

    public static function from(Model $model): static
    {
        return new self(optional: $model->optional);
    }
}

describe('ResourceData', function(): void {
    describe('transformValue()', function(): void {
        it('should transform ResourceData instances to arrays', function(): void {
            // arrange
            $childModel = \Mockery::mock(Model::class);
            $childModel->allows('getAttribute')->with('name')->andReturn('Alice');
            $childModel->allows('getAttribute')->with('age')->andReturn(30);

            $parentModel = \Mockery::mock(Model::class);
            $parentModel->allows('getAttribute')->with('id')->andReturn(1);
            $parentModel->allows('getAttribute')->with('child')->andReturn($childModel);
            $parentModel->shouldReceive('loadMissing')->andReturnSelf();
            $parentModel->shouldReceive('relationLoaded')->with('child')->andReturnTrue();

            // act
            $resource = \TestParentResourceData::from($parentModel);
            $array = $resource->toArray();

            // assert
            expect($array['child'])->toBeArray()
                ->and($array['child']['name'])->toBe('Alice')
                ->and($array['child']['age'])->toBe(30);
        });

        it('should transform BackedEnum instances to their backing value', function(): void {
            // arrange
            $resource = new \TestEnumResourceData(FamilySetStatus::Built);

            // act
            $array = $resource->toArray();

            // assert
            expect($array['status'])->toBe('built');
        });

        it('should transform DateTimeInterface instances to ISO 8601 format', function(): void {
            // arrange
            $date = new \DateTimeImmutable('2025-06-15T14:30:00+02:00');
            $resource = new \TestDateResourceData($date);

            // act
            $array = $resource->toArray();

            // assert
            expect($array['created_at'])->toBe('2025-06-15T14:30:00+02:00');
        });

        it('should recursively transform array values', function(): void {
            // arrange
            $resource = new \TestArrayResourceData([FamilySetStatus::Sealed, FamilySetStatus::Built]);

            // act
            $array = $resource->toArray();

            // assert
            expect($array['statuses'])->toBe(['sealed', 'built']);
        });

        it('should pass through scalar values and nulls unchanged', function(): void {
            // arrange
            $model = \Mockery::mock(Model::class);
            $model->allows('getAttribute')->with('name')->andReturn('Test');
            $model->allows('getAttribute')->with('age')->andReturn(25);

            // act
            $resource = \TestResourceData::from($model);
            $array = $resource->toArray();

            // assert
            expect($array['name'])->toBe('Test')
                ->and($array['age'])->toBe(25);
        });

        it('should pass through null values unchanged', function(): void {
            // arrange
            $resource = new \TestNullableResourceData(null);

            // act
            $array = $resource->toArray();

            // assert
            expect($array['optional'])->toBeNull();
        });
    });

    describe('validateRelationsLoaded()', function(): void {
        it('should throw MissingRelationException when required relation is not loaded', function(): void {
            // arrange
            $model = \Mockery::mock(Model::class);
            $model->allows('getAttribute')->with('id')->andReturn(1);
            $model->shouldReceive('loadMissing')->andReturnSelf();
            $model->shouldReceive('relationLoaded')->with('child')->andReturnFalse();

            // act & assert
            expect(fn(): \TestParentResourceData => \TestParentResourceData::from($model))
                ->toThrow(MissingRelationException::class);
        });

        it('should not throw when required relations are loaded', function(): void {
            // arrange
            $childModel = \Mockery::mock(Model::class);
            $childModel->allows('getAttribute')->with('name')->andReturn('Alice');
            $childModel->allows('getAttribute')->with('age')->andReturn(30);

            $model = \Mockery::mock(Model::class);
            $model->allows('getAttribute')->with('id')->andReturn(1);
            $model->allows('getAttribute')->with('child')->andReturn($childModel);
            $model->shouldReceive('loadMissing')->andReturnSelf();
            $model->shouldReceive('relationLoaded')->with('child')->andReturnTrue();

            // act & assert — no exception thrown
            $resource = \TestParentResourceData::from($model);

            expect($resource)->toBeInstanceOf(\TestParentResourceData::class);
        });
    });

    describe('collection()', function(): void {
        it('should call loadMissing with EAGER_LOAD and map models through from()', function(): void {
            // arrange
            $model1 = \Mockery::mock(Model::class);
            $model1->allows('getAttribute')->with('name')->andReturn('Alice');
            $model1->allows('getAttribute')->with('age')->andReturn(30);

            $model2 = \Mockery::mock(Model::class);
            $model2->allows('getAttribute')->with('name')->andReturn('Bob');
            $model2->allows('getAttribute')->with('age')->andReturn(25);

            $collection = \Mockery::mock(Collection::class);
            $collection->shouldReceive('loadMissing')->with([])->andReturnSelf();
            $collection->shouldReceive('map')->andReturnUsing(fn(\Closure $callback): \Illuminate\Support\Collection => collect([$callback($model1), $callback($model2)]));

            // act
            $result = \TestResourceData::collection($collection);

            // assert
            expect($result)->toBeArray()
                ->and($result)->toHaveCount(2)
                ->and($result[0])->toBeInstanceOf(\TestResourceData::class)
                ->and($result[0]->name)->toBe('Alice')
                ->and($result[1]->name)->toBe('Bob');
        });
    });

    describe('toResponse()', function(): void {
        it('should return a JsonResponse with 200 status', function(): void {
            // arrange
            $model = \Mockery::mock(Model::class);
            $model->allows('getAttribute')->with('name')->andReturn('Test');
            $model->allows('getAttribute')->with('age')->andReturn(25);

            $resource = \TestResourceData::from($model);

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
            $model = \Mockery::mock(Model::class);
            $model->allows('getAttribute')->with('name')->andReturn('Test');
            $model->allows('getAttribute')->with('age')->andReturn(25);

            $resource = \TestResourceData::from($model);

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
            $model = \Mockery::mock(Model::class);
            $model->allows('getAttribute')->with('name')->andReturn('Test');
            $model->allows('getAttribute')->with('age')->andReturn(25);

            $resource = \TestResourceData::from($model);

            // act & assert
            expect($resource->jsonSerialize())->toBe($resource->toArray());
        });
    });
});
