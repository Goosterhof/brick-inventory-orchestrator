<?php

declare(strict_types = 1);

use App\Actions\Family\GetFamilyPartsAction;
use App\Models\Family;
use App\Models\StorageOptionPart;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Pagination\CursorPaginator;

covers(GetFamilyPartsAction::class);

describe('GetFamilyPartsAction', function(): void {
    it('should return cursor paginator for family parts', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('getAttribute')->with('id')->andReturn(1);

        $cursorPaginator = new CursorPaginator(collect(), 25);

        $baseBuilder = \Mockery::mock(QueryBuilder::class);
        $baseBuilder->shouldReceive('cursorPaginate')
            ->once()
            ->andReturn($cursorPaginator);

        $eloquentBuilder = \Mockery::mock(Builder::class);
        $eloquentBuilder->shouldReceive('join')->andReturnSelf();
        $eloquentBuilder->shouldReceive('leftJoin')->andReturnSelf();
        $eloquentBuilder->shouldReceive('where')->with('storage_options.family_id', 1)->andReturnSelf();
        $eloquentBuilder->shouldReceive('select')->andReturnSelf();
        $eloquentBuilder->shouldReceive('selectRaw')->andReturnSelf();
        $eloquentBuilder->shouldReceive('orderBy')->with('storage_option_parts.id')->andReturnSelf();
        $eloquentBuilder->shouldReceive('toBase')->once()->andReturn($baseBuilder);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->once()->andReturn($eloquentBuilder);

        $action = new GetFamilyPartsAction($storageOptionPart);

        // act
        $result = $action->execute($family);

        // assert
        expect($result)->toBe($cursorPaginator);
    });

    it('should cap per_page at 100', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('getAttribute')->with('id')->andReturn(1);

        $cursorPaginator = new CursorPaginator(collect(), 100);

        $baseBuilder = \Mockery::mock(QueryBuilder::class);
        $baseBuilder->shouldReceive('cursorPaginate')
            ->withArgs(fn(int $perPage): bool => $perPage === 100)
            ->once()
            ->andReturn($cursorPaginator);

        $eloquentBuilder = \Mockery::mock(Builder::class);
        $eloquentBuilder->shouldReceive('join')->andReturnSelf();
        $eloquentBuilder->shouldReceive('leftJoin')->andReturnSelf();
        $eloquentBuilder->shouldReceive('where')->andReturnSelf();
        $eloquentBuilder->shouldReceive('select')->andReturnSelf();
        $eloquentBuilder->shouldReceive('selectRaw')->andReturnSelf();
        $eloquentBuilder->shouldReceive('orderBy')->andReturnSelf();
        $eloquentBuilder->shouldReceive('toBase')->andReturn($baseBuilder);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->andReturn($eloquentBuilder);

        $action = new GetFamilyPartsAction($storageOptionPart);

        // act
        $result = $action->execute($family, perPage: 200);

        // assert
        expect($result)->toBe($cursorPaginator);
    });

    it('should use default per_page of 25', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->shouldReceive('getAttribute')->with('id')->andReturn(1);

        $cursorPaginator = new CursorPaginator(collect(), 25);

        $baseBuilder = \Mockery::mock(QueryBuilder::class);
        $baseBuilder->shouldReceive('cursorPaginate')
            ->withArgs(fn(int $perPage): bool => $perPage === 25)
            ->once()
            ->andReturn($cursorPaginator);

        $eloquentBuilder = \Mockery::mock(Builder::class);
        $eloquentBuilder->shouldReceive('join')->andReturnSelf();
        $eloquentBuilder->shouldReceive('leftJoin')->andReturnSelf();
        $eloquentBuilder->shouldReceive('where')->andReturnSelf();
        $eloquentBuilder->shouldReceive('select')->andReturnSelf();
        $eloquentBuilder->shouldReceive('selectRaw')->andReturnSelf();
        $eloquentBuilder->shouldReceive('orderBy')->andReturnSelf();
        $eloquentBuilder->shouldReceive('toBase')->andReturn($baseBuilder);

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('newQuery')->andReturn($eloquentBuilder);

        $action = new GetFamilyPartsAction($storageOptionPart);

        // act
        $action->execute($family);
    });
});
