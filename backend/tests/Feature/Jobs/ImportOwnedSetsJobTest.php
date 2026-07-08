<?php

declare(strict_types = 1);

use App\Actions\FamilySet\ImportOwnedSetsAction;
use App\DataTransferObjects\Result\FamilySet\ImportOwnedSetsResultData;
use App\Enums\ImportJobStatus;
use App\Jobs\ImportOwnedSetsJob;
use App\Models\Family;
use App\Models\ImportJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Queue\Attributes\FailOnTimeout;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Support\Facades\Log;

covers(ImportOwnedSetsJob::class);

uses(RefreshDatabase::class);

describe('ImportOwnedSetsJob', function(): void {
    it('should update import job to completed on successful import', function(): void {
        // arrange
        $family = Family::factory()->create(['rebrickable_user_token' => 'test-token']);

        /** @var ImportJob $importJob */
        $importJob = ImportJob::factory()->forFamily($family)->create();

        $result = new ImportOwnedSetsResultData(
            created: 5,
            updated: 3,
            skipped: 0,
            total: 8,
            complete: true,
        );

        $importOwnedSetsAction = \Mockery::mock(ImportOwnedSetsAction::class);
        $importOwnedSetsAction->shouldReceive('execute')
            ->once()
            ->andReturn($result);

        $job = new ImportOwnedSetsJob(importJobId: $importJob->id, familyId: $family->id);

        // act
        $job->handle($importOwnedSetsAction, new ImportJob, new Family);

        // assert
        $importJob->refresh();
        expect($importJob->status)->toBe(ImportJobStatus::Completed);
        expect($importJob->total_sets)->toBe(8);
        expect($importJob->processed_sets)->toBe(8);
        expect($importJob->failed_sets)->toBe(0);
        expect($importJob->started_at)->not->toBeNull();
        expect($importJob->completed_at)->not->toBeNull();
    });

    it('should record skipped sets as failed set details', function(): void {
        // arrange
        $family = Family::factory()->create(['rebrickable_user_token' => 'test-token']);

        /** @var ImportJob $importJob */
        $importJob = ImportJob::factory()->forFamily($family)->create();

        $result = new ImportOwnedSetsResultData(
            created: 2,
            updated: 1,
            skipped: 2,
            total: 3,
            complete: true,
            skippedSetNums: ['75192-1', '10281-1'],
        );

        $importOwnedSetsAction = \Mockery::mock(ImportOwnedSetsAction::class);
        $importOwnedSetsAction->shouldReceive('execute')
            ->once()
            ->andReturn($result);

        $job = new ImportOwnedSetsJob(importJobId: $importJob->id, familyId: $family->id);

        // act
        $job->handle($importOwnedSetsAction, new ImportJob, new Family);

        // assert
        $importJob->refresh();
        expect($importJob->status)->toBe(ImportJobStatus::Completed);
        expect($importJob->failed_sets)->toBe(2);
        \assert($importJob->failed_set_details !== null);
        expect($importJob->failed_set_details)->toHaveCount(2);
        expect($importJob->failed_set_details[0]['set_num'])->toBe('75192-1');
        expect($importJob->failed_set_details[1]['set_num'])->toBe('10281-1');
    });

    it('should mark import as failed when result is incomplete', function(): void {
        // arrange
        $family = Family::factory()->create(['rebrickable_user_token' => 'test-token']);

        /** @var ImportJob $importJob */
        $importJob = ImportJob::factory()->forFamily($family)->create();

        $result = new ImportOwnedSetsResultData(
            created: 3,
            updated: 0,
            skipped: 0,
            total: 3,
            complete: false,
            error: 'Import incomplete: API error. 3 sets were imported successfully. Retry to fetch remaining sets.',
        );

        $importOwnedSetsAction = \Mockery::mock(ImportOwnedSetsAction::class);
        $importOwnedSetsAction->shouldReceive('execute')
            ->once()
            ->andReturn($result);

        $job = new ImportOwnedSetsJob(importJobId: $importJob->id, familyId: $family->id);

        // act
        $job->handle($importOwnedSetsAction, new ImportJob, new Family);

        // assert
        $importJob->refresh();
        expect($importJob->status)->toBe(ImportJobStatus::Failed);
        \assert($importJob->failed_set_details !== null);
        expect($importJob->failed_set_details)->toHaveCount(1);
        expect($importJob->failed_set_details[0]['error'])->toContain('Import incomplete');
    });

    it('should mark import as failed with generic message when job fails with exception', function(): void {
        // arrange
        $family = Family::factory()->create();

        /** @var ImportJob $importJob */
        $importJob = ImportJob::factory()->forFamily($family)->create();

        $job = new ImportOwnedSetsJob(importJobId: $importJob->id, familyId: $family->id);

        Log::shouldReceive('error')
            ->once()
            ->withArgs(fn(string $message, array $context): bool => $message === 'ImportOwnedSetsJob failed'
                && $context['exception'] === 'Connection timeout: pgsql://user:pass@host/db'
                && \array_key_exists('trace', $context));

        // act
        $job->failed(new \RuntimeException('Connection timeout: pgsql://user:pass@host/db'));

        // assert
        $importJob->refresh();
        expect($importJob->status)->toBe(ImportJobStatus::Failed);
        expect($importJob->completed_at)->not->toBeNull();
        \assert($importJob->failed_set_details !== null);
        expect($importJob->failed_set_details)->toHaveCount(1);
        expect($importJob->failed_set_details[0]['error'])->toBe('Import failed due to an unexpected error');
    });

    it('should not log when job fails with null throwable', function(): void {
        // arrange
        $family = Family::factory()->create();

        /** @var ImportJob $importJob */
        $importJob = ImportJob::factory()->forFamily($family)->create();

        $job = new ImportOwnedSetsJob(importJobId: $importJob->id, familyId: $family->id);

        Log::shouldReceive('error')->never();

        // act
        $job->failed(null);

        // assert
        $importJob->refresh();
        expect($importJob->status)->toBe(ImportJobStatus::Failed);
        expect($importJob->completed_at)->not->toBeNull();
        \assert($importJob->failed_set_details !== null);
        expect($importJob->failed_set_details)->toHaveCount(1);
        expect($importJob->failed_set_details[0]['error'])->toBe('Import failed due to an unexpected error');
    });

    it('should handle failed() gracefully when import job does not exist', function(): void {
        // arrange
        $job = new ImportOwnedSetsJob(importJobId: 999_999, familyId: 1);

        // act - should not throw
        $job->failed(new \RuntimeException('Some error'));

        // assert - no import job was created or modified
        expect(ImportJob::query()->where('id', 999_999)->exists())->toBeFalse();
    });

    it('should declare a 600 second timeout', function(): void {
        // act + assert — the queue worker reads the #[Timeout] class attribute
        $attributes = new \ReflectionClass(ImportOwnedSetsJob::class)->getAttributes(Timeout::class);

        expect($attributes)->toHaveCount(1)
            ->and($attributes[0]->newInstance()->timeout)->toBe(600);
    });

    it('should declare failOnTimeout so the failed() hook fires when the worker kills the import', function(): void {
        // act + assert — presence of the #[FailOnTimeout] class attribute signals fail-on-timeout
        $attributes = new \ReflectionClass(ImportOwnedSetsJob::class)->getAttributes(FailOnTimeout::class);

        expect($attributes)->toHaveCount(1);
    });

    it('should set status to in_progress before executing import', function(): void {
        // arrange
        $family = Family::factory()->create(['rebrickable_user_token' => 'test-token']);

        /** @var ImportJob $importJob */
        $importJob = ImportJob::factory()->forFamily($family)->create();

        $statusDuringExecution = null;
        $importOwnedSetsAction = \Mockery::mock(ImportOwnedSetsAction::class);
        $importOwnedSetsAction->shouldReceive('execute')
            ->once()
            ->andReturnUsing(function() use ($importJob, &$statusDuringExecution): ImportOwnedSetsResultData {
                $importJob->refresh();
                $statusDuringExecution = $importJob->status;

                return new ImportOwnedSetsResultData(
                    created: 0,
                    updated: 0,
                    skipped: 0,
                    total: 0,
                    complete: true,
                );
            });

        $job = new ImportOwnedSetsJob(importJobId: $importJob->id, familyId: $family->id);

        // act
        $job->handle($importOwnedSetsAction, new ImportJob, new Family);

        // assert
        expect($statusDuringExecution)->toBe(ImportJobStatus::InProgress);
    });
});
