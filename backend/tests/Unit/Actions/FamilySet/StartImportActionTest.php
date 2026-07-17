<?php

declare(strict_types = 1);

use App\Actions\FamilySet\StartImportAction;
use App\Enums\ImportJobStatus;
use App\Exceptions\ImportAlreadyInProgressException;
use App\Jobs\ImportOwnedSetsJob;
use App\Models\Family;
use App\Models\ImportJob;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;

covers(StartImportAction::class);

describe('StartImportAction', function(): void {
    it('should create a pending import job and dispatch the queue job', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(42);

        $savedValues = ['id' => 99];
        $newImportJob = \Mockery::mock(ImportJob::class);
        $newImportJob->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $newImportJob->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $newImportJob->shouldReceive('save')->once();

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 42)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('status', [ImportJobStatus::Pending, ImportJobStatus::InProgress])->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturnNull();

        $importJobModel = \Mockery::mock(ImportJob::class);
        $importJobModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $importJobModel->shouldReceive('newInstance')->once()->andReturn($newImportJob);

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldReceive('dispatch')->once()->withArgs(fn(ImportOwnedSetsJob $importOwnedSetsJob): bool => $importOwnedSetsJob->familyId === 42);

        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $action = new StartImportAction($importJobModel, $dispatcher, $connection, 1_200);

        // act
        $result = $action->execute($family);

        // assert
        expect($result)->toBe($newImportJob);
        expect($savedValues['family_id'])->toBe(42);
        expect($savedValues['status'])->toBe(ImportJobStatus::Pending);
        expect($savedValues['total_sets'])->toBe(0);
        expect($savedValues['processed_sets'])->toBe(0);
        expect($savedValues['failed_sets'])->toBe(0);
    });

    it('should throw ImportAlreadyInProgressException when pending import exists', function(): void {
        // arrange
        $this->freezeTime();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(42);

        $existingJob = \Mockery::mock(ImportJob::class);
        $existingJob->allows('getAttribute')->with('created_at')->andReturn(now());

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 42)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('status', [ImportJobStatus::Pending, ImportJobStatus::InProgress])->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn($existingJob);

        $importJobModel = \Mockery::mock(ImportJob::class);
        $importJobModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldNotReceive('dispatch');

        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldNotReceive('transaction');

        $action = new StartImportAction($importJobModel, $dispatcher, $connection, 1_200);

        // act & assert
        expect(fn(): ImportJob => $action->execute($family))
            ->toThrow(ImportAlreadyInProgressException::class);
    });

    it('should throw ImportAlreadyInProgressException when in-progress import exists', function(): void {
        // arrange
        $this->freezeTime();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(42);

        $existingJob = \Mockery::mock(ImportJob::class);
        $existingJob->allows('getAttribute')->with('created_at')->andReturn(now());

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 42)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('status', [ImportJobStatus::Pending, ImportJobStatus::InProgress])->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn($existingJob);

        $importJobModel = \Mockery::mock(ImportJob::class);
        $importJobModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldNotReceive('dispatch');

        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldNotReceive('transaction');

        $action = new StartImportAction($importJobModel, $dispatcher, $connection, 1_200);

        // act & assert
        expect(fn(): ImportJob => $action->execute($family))
            ->toThrow(ImportAlreadyInProgressException::class);
    });

    it('should throw ImportAlreadyInProgressException when database unique constraint catches race condition', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(42);

        $newImportJob = \Mockery::mock(ImportJob::class);
        $newImportJob->allows('setAttribute');
        $newImportJob->allows('getAttribute')->andReturnNull();
        $newImportJob->shouldReceive('save')->once()->andThrow(
            new UniqueConstraintViolationException('default', 'INSERT', [], new \Exception('dup')),
        );

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 42)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('status', [ImportJobStatus::Pending, ImportJobStatus::InProgress])->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturnNull();

        $importJobModel = \Mockery::mock(ImportJob::class);
        $importJobModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $importJobModel->shouldReceive('newInstance')->once()->andReturn($newImportJob);

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldNotReceive('dispatch');

        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $action = new StartImportAction($importJobModel, $dispatcher, $connection, 1_200);

        // act & assert
        expect(fn(): ImportJob => $action->execute($family))
            ->toThrow(ImportAlreadyInProgressException::class);
    });

    it('should reclaim a stale active job (older than the threshold) and start a new import', function(): void {
        // arrange
        $this->freezeTime();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(42);

        // Stale active job: created 2000s ago, well beyond the 1200s threshold.
        $existingStatus = ImportJobStatus::InProgress;
        $existingJob = \Mockery::mock(ImportJob::class);
        $existingJob->allows('getAttribute')->with('created_at')->andReturn(now()->subSeconds(2_000));
        $existingJob->allows('setAttribute')->with('status', \Mockery::type(ImportJobStatus::class))
            ->andReturnUsing(function($key, $value) use (&$existingStatus): void {
                $existingStatus = $value;
            });
        // Global ordering proves the stale row is retired BEFORE the replacement is
        // inserted — the partial unique index never sees two active rows at once.
        $existingJob->shouldReceive('save')->once()->globally()->ordered();

        $savedValues = ['id' => 99];
        $newImportJob = \Mockery::mock(ImportJob::class);
        $newImportJob->allows('setAttribute')->andReturnUsing(function($key, $value) use (&$savedValues): void {
            $savedValues[$key] = $value;
        });
        $newImportJob->allows('getAttribute')->andReturnUsing(function($key) use (&$savedValues): mixed {
            return $savedValues[$key] ?? null;
        });
        $newImportJob->shouldReceive('save')->once()->globally()->ordered();

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 42)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('status', [ImportJobStatus::Pending, ImportJobStatus::InProgress])->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn($existingJob);

        $importJobModel = \Mockery::mock(ImportJob::class);
        $importJobModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $importJobModel->shouldReceive('newInstance')->once()->andReturn($newImportJob);

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldReceive('dispatch')->once()->withArgs(fn(ImportOwnedSetsJob $importOwnedSetsJob): bool => $importOwnedSetsJob->familyId === 42);

        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $action = new StartImportAction($importJobModel, $dispatcher, $connection, 1_200);

        // act
        $result = $action->execute($family);

        // assert
        expect($result)->toBe($newImportJob);
        expect($existingStatus)->toBe(ImportJobStatus::Failed);
        expect($savedValues['family_id'])->toBe(42);
        expect($savedValues['status'])->toBe(ImportJobStatus::Pending);
        expect($savedValues['total_sets'])->toBe(0);
        expect($savedValues['processed_sets'])->toBe(0);
        expect($savedValues['failed_sets'])->toBe(0);
    });

    it('should still throw ImportAlreadyInProgressException for a fresh active job below the threshold', function(): void {
        // arrange
        $this->freezeTime();

        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(42);

        // Fresh active job: created 100s ago, comfortably within the 1200s threshold.
        $existingJob = \Mockery::mock(ImportJob::class);
        $existingJob->allows('getAttribute')->with('created_at')->andReturn(now()->subSeconds(100));

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 42)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('status', [ImportJobStatus::Pending, ImportJobStatus::InProgress])->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn($existingJob);

        $importJobModel = \Mockery::mock(ImportJob::class);
        $importJobModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $importJobModel->shouldNotReceive('newInstance');

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldNotReceive('dispatch');

        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldNotReceive('transaction');

        $action = new StartImportAction($importJobModel, $dispatcher, $connection, 1_200);

        // act & assert
        expect(fn(): ImportJob => $action->execute($family))
            ->toThrow(ImportAlreadyInProgressException::class);
    });

    it('should treat an active job with no created_at as fresh and throw (fail-safe)', function(): void {
        // arrange
        $family = \Mockery::mock(Family::class);
        $family->allows('getAttribute')->with('id')->andReturn(42);

        $existingJob = \Mockery::mock(ImportJob::class);
        $existingJob->allows('getAttribute')->with('created_at')->andReturnNull();

        $queryBuilder = \Mockery::mock(Builder::class);
        $queryBuilder->shouldReceive('where')->with('family_id', 42)->andReturnSelf();
        $queryBuilder->shouldReceive('whereIn')->with('status', [ImportJobStatus::Pending, ImportJobStatus::InProgress])->andReturnSelf();
        $queryBuilder->shouldReceive('first')->andReturn($existingJob);

        $importJobModel = \Mockery::mock(ImportJob::class);
        $importJobModel->shouldReceive('newQuery')->once()->andReturn($queryBuilder);
        $importJobModel->shouldNotReceive('newInstance');

        $dispatcher = \Mockery::mock(Dispatcher::class);
        $dispatcher->shouldNotReceive('dispatch');

        $connection = \Mockery::mock(ConnectionInterface::class);
        $connection->shouldNotReceive('transaction');

        $action = new StartImportAction($importJobModel, $dispatcher, $connection, 1_200);

        // act & assert
        expect(fn(): ImportJob => $action->execute($family))
            ->toThrow(ImportAlreadyInProgressException::class);
    });
});
