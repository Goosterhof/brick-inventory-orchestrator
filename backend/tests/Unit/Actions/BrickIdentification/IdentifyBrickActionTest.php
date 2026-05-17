<?php

declare(strict_types = 1);

use App\Actions\BrickIdentification\IdentifyBrickAction;
use App\Actions\Sync\UpsertPartAction;
use App\Contracts\BrickIdentificationServiceInterface;
use App\DataTransferObjects\Input\BrickIdentification\IdentifyBrickData;
use App\DataTransferObjects\Input\Brickognize\BrickognizePredictionData;
use App\DataTransferObjects\Input\Lego\LegoPartData;
use App\Exceptions\BrickognizeApiException;
use App\Models\Part;
use Illuminate\Http\UploadedFile;

covers(IdentifyBrickAction::class);

describe('IdentifyBrickAction', function(): void {
    it('should call UpsertPartAction with correct LegoPartData', function(): void {
        // arrange
        $image = UploadedFile::fake()->create('brick.jpg', 100, 'image/jpeg');
        $data = new IdentifyBrickData(image: $image);

        $predictions = [
            new BrickognizePredictionData(
                id: '3001',
                name: 'Brick 2 x 4',
                type: 'part',
                imageUrl: 'https://example.com/3001.jpg',
                score: 0.95,
            ),
        ];

        $brickIdentificationService = \Mockery::mock(BrickIdentificationServiceInterface::class);
        $brickIdentificationService->shouldReceive('identifyBrick')
            ->with($image)
            ->once()
            ->andReturn($predictions);

        $resultPart = \Mockery::mock(Part::class);
        $resultPart->allows('getAttribute')->with('id')->andReturn(1);
        $resultPart->allows('getAttribute')->with('part_num')->andReturn('3001');
        $resultPart->allows('getAttribute')->with('name')->andReturn('Brick 2 x 4');

        $upsertPartAction = \Mockery::mock(UpsertPartAction::class);
        $upsertPartAction->shouldReceive('execute')
            ->withArgs(fn(LegoPartData $legoPartData): bool => $legoPartData->partNum === '3001'
                && $legoPartData->name === 'Brick 2 x 4'
                && $legoPartData->categoryId === null
                && $legoPartData->imageUrl === 'https://example.com/3001.jpg')
            ->once()
            ->andReturn($resultPart);

        $action = new IdentifyBrickAction($brickIdentificationService, $upsertPartAction);

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($resultPart);
    });

    it('should select highest scoring part prediction', function(): void {
        // arrange
        $image = UploadedFile::fake()->create('brick.jpg', 100, 'image/jpeg');
        $data = new IdentifyBrickData(image: $image);

        $predictions = [
            new BrickognizePredictionData(
                id: '3002',
                name: 'Brick 2 x 3',
                type: 'part',
                imageUrl: null,
                score: 0.72,
            ),
            new BrickognizePredictionData(
                id: '3001',
                name: 'Brick 2 x 4',
                type: 'part',
                imageUrl: null,
                score: 0.95,
            ),
            new BrickognizePredictionData(
                id: '3003',
                name: 'Brick 2 x 2',
                type: 'part',
                imageUrl: null,
                score: 0.81,
            ),
        ];

        $brickIdentificationService = \Mockery::mock(BrickIdentificationServiceInterface::class);
        $brickIdentificationService->shouldReceive('identifyBrick')
            ->with($image)
            ->once()
            ->andReturn($predictions);

        $resultPart = \Mockery::mock(Part::class);
        $resultPart->allows('getAttribute')->with('id')->andReturn(1);
        $resultPart->allows('getAttribute')->with('part_num')->andReturn('3001');

        $upsertPartAction = \Mockery::mock(UpsertPartAction::class);
        $upsertPartAction->shouldReceive('execute')
            ->withArgs(
                // Should use the highest scoring part (3001 with score 0.95)
                fn(LegoPartData $legoPartData): bool => $legoPartData->partNum === '3001'
                && $legoPartData->name === 'Brick 2 x 4',
            )
            ->once()
            ->andReturn($resultPart);

        $action = new IdentifyBrickAction($brickIdentificationService, $upsertPartAction);

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($resultPart);
    });

    it('should filter out non-part predictions', function(): void {
        // arrange
        $image = UploadedFile::fake()->create('brick.jpg', 100, 'image/jpeg');
        $data = new IdentifyBrickData(image: $image);

        $predictions = [
            new BrickognizePredictionData(
                id: 'sw0001',
                name: 'Battle Droid',
                type: 'minifig',
                imageUrl: null,
                score: 0.98, // Higher score but it's a minifig
            ),
            new BrickognizePredictionData(
                id: '3001',
                name: 'Brick 2 x 4',
                type: 'part',
                imageUrl: null,
                score: 0.75,
            ),
        ];

        $brickIdentificationService = \Mockery::mock(BrickIdentificationServiceInterface::class);
        $brickIdentificationService->shouldReceive('identifyBrick')
            ->with($image)
            ->once()
            ->andReturn($predictions);

        $resultPart = \Mockery::mock(Part::class);
        $resultPart->allows('getAttribute')->with('id')->andReturn(1);
        $resultPart->allows('getAttribute')->with('part_num')->andReturn('3001');

        $upsertPartAction = \Mockery::mock(UpsertPartAction::class);
        $upsertPartAction->shouldReceive('execute')
            ->withArgs(
                // Should use the part (3001), not the minifig
                fn(LegoPartData $legoPartData): bool => $legoPartData->partNum === '3001',
            )
            ->once()
            ->andReturn($resultPart);

        $action = new IdentifyBrickAction($brickIdentificationService, $upsertPartAction);

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($resultPart);
    });

    it('should throw BrickognizeApiException when no part predictions found', function(): void {
        // arrange
        $image = UploadedFile::fake()->create('brick.jpg', 100, 'image/jpeg');
        $data = new IdentifyBrickData(image: $image);

        $predictions = [
            new BrickognizePredictionData(
                id: 'sw0001',
                name: 'Battle Droid',
                type: 'minifig',
                imageUrl: null,
                score: 0.98,
            ),
        ];

        $brickIdentificationService = \Mockery::mock(BrickIdentificationServiceInterface::class);
        $brickIdentificationService->shouldReceive('identifyBrick')
            ->with($image)
            ->once()
            ->andReturn($predictions);

        $upsertPartAction = \Mockery::mock(UpsertPartAction::class);
        $upsertPartAction->shouldReceive('execute')->never();

        $action = new IdentifyBrickAction($brickIdentificationService, $upsertPartAction);

        // act & assert
        expect(fn(): Part => $action->execute($data))->toThrow(BrickognizeApiException::class);
    });

    it('should throw BrickognizeApiException when API returns empty predictions', function(): void {
        // arrange
        $image = UploadedFile::fake()->create('brick.jpg', 100, 'image/jpeg');
        $data = new IdentifyBrickData(image: $image);

        $brickIdentificationService = \Mockery::mock(BrickIdentificationServiceInterface::class);
        $brickIdentificationService->shouldReceive('identifyBrick')
            ->with($image)
            ->once()
            ->andReturn([]);

        $upsertPartAction = \Mockery::mock(UpsertPartAction::class);
        $upsertPartAction->shouldReceive('execute')->never();

        $action = new IdentifyBrickAction($brickIdentificationService, $upsertPartAction);

        // act & assert
        expect(fn(): Part => $action->execute($data))->toThrow(BrickognizeApiException::class);
    });

    it('should pass null imageUrl when prediction has no image', function(): void {
        // arrange
        $image = UploadedFile::fake()->create('brick.jpg', 100, 'image/jpeg');
        $data = new IdentifyBrickData(image: $image);

        $predictions = [
            new BrickognizePredictionData(
                id: '3001',
                name: 'Brick 2 x 4',
                type: 'part',
                imageUrl: null,
                score: 0.95,
            ),
        ];

        $brickIdentificationService = \Mockery::mock(BrickIdentificationServiceInterface::class);
        $brickIdentificationService->shouldReceive('identifyBrick')
            ->with($image)
            ->once()
            ->andReturn($predictions);

        $resultPart = \Mockery::mock(Part::class);

        $upsertPartAction = \Mockery::mock(UpsertPartAction::class);
        $upsertPartAction->shouldReceive('execute')
            ->withArgs(fn(LegoPartData $legoPartData): bool => $legoPartData->imageUrl === null)
            ->once()
            ->andReturn($resultPart);

        $action = new IdentifyBrickAction($brickIdentificationService, $upsertPartAction);

        // act
        $result = $action->execute($data);

        // assert
        expect($result)->toBe($resultPart);
    });
});
