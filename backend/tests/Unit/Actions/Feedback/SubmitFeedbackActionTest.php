<?php

declare(strict_types = 1);

use App\Actions\Feedback\SubmitFeedbackAction;
use App\DataTransferObjects\Input\Feedback\SubmitFeedbackData;
use Illuminate\Config\Repository as ConfigRepository;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use ScriptDevelopment\KendoReportTool\Exceptions\ReportSubmissionException;
use ScriptDevelopment\KendoReportTool\KendoReports;

covers(SubmitFeedbackAction::class);

/*
 * KendoReports is a final vendor class (unmockable by Mockery), so the Action
 * is exercised through a real KendoReports instance wired to an instance-level
 * HTTP fake — nothing hits a live Kendo host.
 */
function makeSubmitFeedbackAction(HttpFactory $httpFactory, bool $swallow = false): SubmitFeedbackAction
{
    $configRepository = new ConfigRepository([
        'report-tool' => [
            'kendo_url' => 'https://kendo.test',
            'project' => 3,
            'token' => 'secret-token',
            'connect_timeout' => 2,
            'timeout' => 5,
            'swallow' => $swallow,
        ],
    ]);

    return new SubmitFeedbackAction(new KendoReports($httpFactory, $configRepository));
}

describe('SubmitFeedbackAction', function(): void {
    it('should submit title, description, author and screenshots to the kendo reports endpoint', function(): void {
        // arrange
        $reportBody = ['id' => 42, 'title' => 'Broken drawer', 'description' => 'It broke', 'author_name' => 'Ada'];
        $httpFactory = new HttpFactory;
        $httpFactory->fake(['kendo.test/*' => HttpFactory::response($reportBody, 201)]);

        $submitFeedbackData = new SubmitFeedbackData(
            title: 'Broken drawer',
            description: 'It broke',
            screenshots: [
                UploadedFile::fake()->image('one.png'),
                UploadedFile::fake()->image('two.jpg'),
            ],
        );

        $action = makeSubmitFeedbackAction($httpFactory);

        // act
        $result = $action->execute($submitFeedbackData, 'Ada');

        // assert
        expect($result)->toBe($reportBody);

        $httpFactory->assertSent(function(Request $request): bool {
            expect($request->url())->toBe('https://kendo.test/api/projects/3/reports')
                ->and($request->hasHeader('Authorization', 'Bearer secret-token'))->toBeTrue()
                ->and($request->isMultipart())->toBeTrue();

            $fields = collect($request->data())->keyBy('name');

            expect($fields['title']['contents'])->toBe('Broken drawer')
                ->and($fields['description']['contents'])->toBe('It broke')
                ->and($fields['author_name']['contents'])->toBe('Ada');

            $fileParts = collect($request->data())->where('name', 'files[]')->values();

            expect($fileParts)->toHaveCount(2)
                ->and($fileParts[0]['filename'])->toBe('one.png')
                ->and($fileParts[1]['filename'])->toBe('two.jpg');

            return true;
        });
    });

    it('should submit without file parts when no screenshots are provided', function(): void {
        // arrange
        $httpFactory = new HttpFactory;
        $httpFactory->fake(['kendo.test/*' => HttpFactory::response(['id' => 7], 201)]);

        $submitFeedbackData = new SubmitFeedbackData(
            title: 'Missing piece',
            description: 'The 2x4 brick count is off by one',
            screenshots: [],
        );

        $action = makeSubmitFeedbackAction($httpFactory);

        // act
        $result = $action->execute($submitFeedbackData, 'Grace');

        // assert
        expect($result)->toBe(['id' => 7]);

        $httpFactory->assertSent(function(Request $request): bool {
            $names = collect($request->data())->pluck('name');

            expect($names)->not->toContain('files[]');

            return true;
        });
    });

    it('should let ReportSubmissionException bubble when the submission is rejected', function(): void {
        // arrange
        $httpFactory = new HttpFactory;
        $httpFactory->fake(['kendo.test/*' => HttpFactory::response(['message' => 'nope'], 422)]);

        $submitFeedbackData = new SubmitFeedbackData(
            title: 'Broken drawer',
            description: 'It broke',
            screenshots: [],
        );

        $action = makeSubmitFeedbackAction($httpFactory);

        // act & assert — no try-catch in the Action; the failure surfaces to the caller
        expect(fn(): array => $action->execute($submitFeedbackData, 'Ada'))
            ->toThrow(ReportSubmissionException::class);
    });

    it('should normalize a swallowed failure to an empty report body', function(): void {
        // arrange — swallow mode is the only path where submit() returns null
        $httpFactory = new HttpFactory;
        $httpFactory->fake(['kendo.test/*' => HttpFactory::response(['message' => 'nope'], 500)]);

        $submitFeedbackData = new SubmitFeedbackData(
            title: 'Broken drawer',
            description: 'It broke',
            screenshots: [],
        );

        $action = makeSubmitFeedbackAction($httpFactory, swallow: true);

        // act
        $result = $action->execute($submitFeedbackData, 'Ada');

        // assert
        expect($result)->toBe([]);
    });
});
