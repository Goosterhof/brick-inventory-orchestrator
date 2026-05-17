<?php

declare(strict_types = 1);

use App\DataTransferObjects\Result\Family\BrickDnaData;
use App\Http\Resources\BrickDnaResourceData;

covers(BrickDnaResourceData::class);

describe('BrickDnaResourceData', function(): void {
    it('should create resource from BrickDnaData', function(): void {
        // arrange
        $data = new BrickDnaData(
            topColors: [
                ['color_id' => 1, 'name' => 'Red', 'rgb' => 'FF0000', 'is_transparent' => false, 'total_quantity' => 50],
                ['color_id' => 2, 'name' => 'Blue', 'rgb' => '0000FF', 'is_transparent' => false, 'total_quantity' => 30],
            ],
            topPartTypes: [
                ['part_id' => 10, 'part_num' => '3001', 'name' => 'Brick 2x4', 'category' => 'Bricks', 'total_quantity' => 40],
            ],
            rarestParts: [
                ['part_id' => 99, 'part_num' => '9999', 'part_name' => 'Rare Gem', 'color_id' => 1, 'color_name' => 'Red', 'color_rgb' => 'FF0000', 'quantity' => 1],
            ],
            diversityScore: 0.85,
            totalUniqueParts: 150,
            totalPartsQuantity: 1_200,
        );

        // act
        $resource = BrickDnaResourceData::from($data);

        // assert
        expect($resource)->toBeInstanceOf(BrickDnaResourceData::class)
            ->and($resource->top_colors)->toHaveCount(2)
            ->and($resource->top_colors[0]['name'])->toBe('Red')
            ->and($resource->top_part_types)->toHaveCount(1)
            ->and($resource->top_part_types[0]['part_num'])->toBe('3001')
            ->and($resource->rarest_parts)->toHaveCount(1)
            ->and($resource->rarest_parts[0]['part_name'])->toBe('Rare Gem')
            ->and($resource->diversity_score)->toBe(0.85)
            ->and($resource->total_unique_parts)->toBe(150)
            ->and($resource->total_parts_quantity)->toBe(1_200);
    });

    it('should serialize to array with snake_case keys', function(): void {
        // arrange
        $data = new BrickDnaData(
            topColors: [
                ['color_id' => 1, 'name' => 'Red', 'rgb' => 'FF0000', 'is_transparent' => false, 'total_quantity' => 50],
            ],
            topPartTypes: [],
            rarestParts: [],
            diversityScore: 0.42,
            totalUniqueParts: 10,
            totalPartsQuantity: 100,
        );

        // act
        $array = BrickDnaResourceData::from($data)->toArray();

        // assert
        expect($array)->toBe([
            'top_colors' => [
                ['color_id' => 1, 'name' => 'Red', 'rgb' => 'FF0000', 'is_transparent' => false, 'total_quantity' => 50],
            ],
            'top_part_types' => [],
            'rarest_parts' => [],
            'diversity_score' => 0.42,
            'total_unique_parts' => 10,
            'total_parts_quantity' => 100,
        ]);
    });

    it('should handle empty arrays', function(): void {
        // arrange
        $data = new BrickDnaData(
            topColors: [],
            topPartTypes: [],
            rarestParts: [],
            diversityScore: 0.0,
            totalUniqueParts: 0,
            totalPartsQuantity: 0,
        );

        // act
        $array = BrickDnaResourceData::from($data)->toArray();

        // assert
        expect($array['top_colors'])->toBe([])
            ->and($array['top_part_types'])->toBe([])
            ->and($array['rarest_parts'])->toBe([])
            ->and($array['diversity_score'])->toBe(0.0);
    });
});
