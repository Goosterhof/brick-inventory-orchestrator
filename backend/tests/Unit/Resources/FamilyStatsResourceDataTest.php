<?php

declare(strict_types = 1);

use App\DataTransferObjects\Result\Family\FamilyStatsData;
use App\Http\Resources\FamilyStatsResourceData;

covers(FamilyStatsResourceData::class);

describe('FamilyStatsResourceData', function(): void {
    it('should create resource from FamilyStatsData', function(): void {
        // arrange
        $data = new FamilyStatsData(
            totalSets: 5,
            totalSetQuantity: 12,
            setsByStatus: ['built' => 3, 'sealed' => 2],
            totalStorageLocations: 4,
            totalUniqueParts: 150,
            totalPartsQuantity: 1_200,
        );

        // act
        $resource = FamilyStatsResourceData::from($data);

        // assert
        expect($resource)->toBeInstanceOf(FamilyStatsResourceData::class)
            ->and($resource->total_sets)->toBe(5)
            ->and($resource->total_set_quantity)->toBe(12)
            ->and($resource->sets_by_status)->toBe(['built' => 3, 'sealed' => 2])
            ->and($resource->total_storage_locations)->toBe(4)
            ->and($resource->total_unique_parts)->toBe(150)
            ->and($resource->total_parts_quantity)->toBe(1_200);
    });

    it('should serialize to array with snake_case keys', function(): void {
        // arrange
        $data = new FamilyStatsData(
            totalSets: 3,
            totalSetQuantity: 6,
            setsByStatus: ['built' => 2, 'in_progress' => 1],
            totalStorageLocations: 2,
            totalUniqueParts: 50,
            totalPartsQuantity: 300,
        );

        // act
        $array = FamilyStatsResourceData::from($data)->toArray();

        // assert
        expect($array)->toBe([
            'total_sets' => 3,
            'total_set_quantity' => 6,
            'sets_by_status' => ['built' => 2, 'in_progress' => 1],
            'total_storage_locations' => 2,
            'total_unique_parts' => 50,
            'total_parts_quantity' => 300,
        ]);
    });

    it('should handle empty sets_by_status', function(): void {
        // arrange
        $data = new FamilyStatsData(
            totalSets: 0,
            totalSetQuantity: 0,
            setsByStatus: [],
            totalStorageLocations: 0,
            totalUniqueParts: 0,
            totalPartsQuantity: 0,
        );

        // act
        $array = FamilyStatsResourceData::from($data)->toArray();

        // assert
        expect($array['total_sets'])->toBe(0)
            ->and($array['sets_by_status'])->toBe([]);
    });
});
