<?php

declare(strict_types = 1);

use App\DataTransferObjects\Result\Family\FamilyMissingPartsData;
use App\Http\Resources\FamilyMissingPartsResourceData;

covers(FamilyMissingPartsResourceData::class);

describe('FamilyMissingPartsResourceData', function(): void {
    it('should construct from FamilyMissingPartsData with shortfalls and unknown ids', function(): void {
        $data = new FamilyMissingPartsData(
            shortfalls: [
                [
                    'part_id' => 12_345,
                    'part_num' => '3001',
                    'color_id' => 4,
                    'part_name' => 'Brick 2 x 4',
                    'color_name' => 'Red',
                    'color_hex' => 'C91A09',
                    'part_image_url' => 'https://example.test/3001.png',
                    'quantity_needed' => 500,
                    'quantity_stored' => 200,
                    'shortfall' => 300,
                    'needed_by_set_nums' => ['75192-1'],
                ],
            ],
            unknownFamilySetIds: ['42', '99'],
        );

        $resource = FamilyMissingPartsResourceData::from($data);

        expect($resource)->toBeInstanceOf(FamilyMissingPartsResourceData::class)
            ->and($resource->shortfalls)->toBe($data->shortfalls)
            ->and($resource->unknown_family_set_ids)->toBe(['42', '99']);
    });

    it('should serialize to array with snake_case keys', function(): void {
        $data = new FamilyMissingPartsData(
            shortfalls: [
                [
                    'part_id' => 67_890,
                    'part_num' => '3024',
                    'color_id' => 1,
                    'part_name' => 'Plate 1 x 1',
                    'color_name' => 'Black',
                    'color_hex' => '05131D',
                    'part_image_url' => null,
                    'quantity_needed' => 12,
                    'quantity_stored' => 5,
                    'shortfall' => 7,
                    'needed_by_set_nums' => ['10294-1', '75192-1'],
                ],
            ],
            unknownFamilySetIds: [],
        );

        $array = FamilyMissingPartsResourceData::from($data)->toArray();

        expect($array)->toBe([
            'shortfalls' => [
                [
                    'part_id' => 67_890,
                    'part_num' => '3024',
                    'color_id' => 1,
                    'part_name' => 'Plate 1 x 1',
                    'color_name' => 'Black',
                    'color_hex' => '05131D',
                    'part_image_url' => null,
                    'quantity_needed' => 12,
                    'quantity_stored' => 5,
                    'shortfall' => 7,
                    'needed_by_set_nums' => ['10294-1', '75192-1'],
                ],
            ],
            'unknown_family_set_ids' => [],
        ]);
    });

    it('should serialize an empty envelope', function(): void {
        $data = new FamilyMissingPartsData(shortfalls: [], unknownFamilySetIds: []);

        $array = FamilyMissingPartsResourceData::from($data)->toArray();

        expect($array)->toBe([
            'shortfalls' => [],
            'unknown_family_set_ids' => [],
        ]);
    });
});
