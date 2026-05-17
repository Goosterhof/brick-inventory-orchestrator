<?php

declare(strict_types = 1);

use App\Actions\FamilySet\GetFamilySetsAction;
use App\Models\Family;
use App\Models\FamilySet;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

covers(GetFamilySetsAction::class);

describe('GetFamilySetsAction', function(): void {
    it('should query family sets by family id', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(5);

        $collection = new Collection;

        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('where')
            ->with('family_id', 5)
            ->once()
            ->andReturnSelf();
        $builder->shouldReceive('latest')->andReturnSelf();
        $builder->shouldReceive('get')->andReturn($collection);

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->shouldReceive('newQuery')
            ->once()
            ->andReturn($builder);

        $action = new GetFamilySetsAction($familySet);

        // act
        $result = $action->execute($family);

        // assert
        expect($result)->toBe($collection);
    });

    it('should order by latest (created_at descending)', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(1);

        $collection = new Collection;

        $builder = \Mockery::mock(Builder::class);
        $builder->shouldReceive('where')->andReturnSelf();
        $builder->shouldReceive('latest')
            ->once()
            ->andReturnSelf();
        $builder->shouldReceive('get')->andReturn($collection);

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->shouldReceive('newQuery')->andReturn($builder);

        $action = new GetFamilySetsAction($familySet);

        // act
        $action->execute($family);

        // assert - Mockery expectations verify the interactions
    });
});
