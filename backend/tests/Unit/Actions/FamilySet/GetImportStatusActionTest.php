<?php

declare(strict_types = 1);

use App\Actions\FamilySet\GetImportStatusAction;
use App\Models\Family;
use App\Models\ImportJob;
use Illuminate\Database\Eloquent\Builder;

covers(GetImportStatusAction::class);

describe('GetImportStatusAction', function(): void {
    it('should return the latest import job for the family', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(42);

        $latestJob = \Mockery::mock(ImportJob::class);

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 42)->andReturnSelf();
        $queryBuilder->shouldReceive('latest')->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn($latestJob);

        $importJobModel = \Mockery::mock(ImportJob::class);
        $importJobModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);

        $action = new GetImportStatusAction($importJobModel);

        // act
        $result = $action->execute($family);

        // assert
        expect($result)->toBe($latestJob);
    });

    it('should return null when no import jobs exist for the family', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(42);

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 42)->andReturnSelf();
        $queryBuilder->shouldReceive('latest')->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturnNull();

        $importJobModel = \Mockery::mock(ImportJob::class);
        $importJobModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);

        $action = new GetImportStatusAction($importJobModel);

        // act
        $result = $action->execute($family);

        // assert
        expect($result)->toBeNull();
    });
});
