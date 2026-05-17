<?php

declare(strict_types = 1);

namespace App\Actions\Family;

use App\DataTransferObjects\Result\FamilyPart\FamilyPartUsageData;
use App\DataTransferObjects\Result\FamilyPart\FamilyPartUsageEntryData;
use App\Enums\FamilySetStatus;
use App\Models\Family;
use App\Models\Part;
use App\Models\SetPart;
use App\Models\StorageOptionPart;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Collection;
use stdClass;

final readonly class GetFamilyPartUsageAction
{
    public function __construct(
        private Part $part,
        private SetPart $setPart,
        private StorageOptionPart $storageOptionPart,
    ) {}

    public function execute(Family $family, string $partNum, int $colorId): FamilyPartUsageData
    {
        // Q1: part + color metadata in a single row. The colors join uses a parameterised
        // ON clause (`? = colors.id`) so the right-hand side stays bound to $colorId
        // without spilling raw expressions across the codebase. Left join so a missing
        // color row (defensive — colors should always exist when used in set_parts) does
        // not nuke the part metadata; the parts row anchors the result, and an unknown
        // part returns null across the board.
        /** @var stdClass|null $metadataRow */
        $metadataRow = $this->part->newQuery()
            ->where('parts.part_num', $partNum)
            ->leftJoin('colors', function(JoinClause $joinClause) use ($colorId): void {
                $joinClause->whereRaw('colors.id = ?', [$colorId]);
            })
            ->select([
                'parts.name as part_name',
                'parts.image_url as part_image_url',
                'colors.name as color_name',
                'colors.rgb as color_hex',
            ])
            ->toBase()
            ->first();

        $partName = $metadataRow !== null ? $this->castNullableString($metadataRow->part_name) : null;
        $partImageUrl = $metadataRow !== null ? $this->castNullableString($metadataRow->part_image_url) : null;
        $colorName = $metadataRow !== null ? $this->castNullableString($metadataRow->color_name) : null;
        $colorHex = $metadataRow !== null ? $this->castNullableString($metadataRow->color_hex) : null;

        // Q2: per-family_set demand for the requested (part_num, color_id). One row per
        // claiming family_set that needs this part+color. Wishlist (not owned) and InStorage
        // (parts pooled into storage_option_parts and shared with other builds) are excluded
        // — they don't claim parts.
        /** @var Collection<int, stdClass> $usageRows */
        $usageRows = $this->setPart->newQuery()
            ->where('set_parts.is_spare', false)
            ->where('set_parts.color_id', $colorId)
            ->join('parts', 'parts.id', '=', 'set_parts.part_id')
            ->join('family_sets', 'family_sets.set_id', '=', 'set_parts.set_id')
            ->join('sets', 'sets.id', '=', 'set_parts.set_id')
            ->where('parts.part_num', $partNum)
            ->where('family_sets.family_id', $family->id)
            ->whereNotIn('family_sets.status', [FamilySetStatus::Wishlist->value, FamilySetStatus::InStorage->value])
            ->select([
                'family_sets.id as family_set_id',
                'family_sets.status as status',
                'sets.set_num as set_num',
                'sets.name as set_name',
            ])
            ->selectRaw('SUM(set_parts.quantity * family_sets.quantity) AS quantity_needed')
            ->groupBy('family_sets.id', 'family_sets.status', 'sets.set_num', 'sets.name')
            ->toBase()
            ->get();

        // Q3: family-wide stored quantity for the requested (part_num, color_id). Single
        // aggregate row regardless of how many storage options the family has, joined
        // through parts to filter by part_num.
        /** @var stdClass|null $storedRow */
        $storedRow = $this->storageOptionPart->newQuery()
            ->join('parts', 'parts.id', '=', 'storage_option_parts.part_id')
            ->join('storage_options', 'storage_options.id', '=', 'storage_option_parts.storage_option_id')
            ->where('parts.part_num', $partNum)
            ->where('storage_option_parts.color_id', $colorId)
            ->where('storage_options.family_id', $family->id)
            ->selectRaw('SUM(storage_option_parts.quantity) AS quantity_stored')
            ->toBase()
            ->first();

        $quantityStored = $storedRow !== null
            ? (int) ($storedRow->quantity_stored ?? 0) // @phpstan-ignore cast.int
            : 0;

        /** @var Collection<int, FamilyPartUsageEntryData> $usages */
        $usages = $usageRows->map(function(stdClass $row) use ($quantityStored): FamilyPartUsageEntryData {
            $familySetId = (int) $row->family_set_id; // @phpstan-ignore cast.int
            $setNum = (string) $row->set_num; // @phpstan-ignore cast.string
            $setName = (string) $row->set_name; // @phpstan-ignore cast.string
            $statusValue = (string) $row->status; // @phpstan-ignore cast.string
            $quantityNeeded = (int) $row->quantity_needed; // @phpstan-ignore cast.int

            return new FamilyPartUsageEntryData(
                familySetId: $familySetId,
                setNum: $setNum,
                setName: $setName,
                status: FamilySetStatus::from($statusValue),
                quantityNeeded: $quantityNeeded,
                quantityStored: $quantityStored,
                shortfall: max(0, $quantityNeeded - $quantityStored),
            );
        })->values();

        return new FamilyPartUsageData(
            partNum: $partNum,
            colorId: $colorId,
            partName: $partName,
            partImageUrl: $partImageUrl,
            colorName: $colorName,
            colorHex: $colorHex,
            usages: $usages,
        );
    }

    private function castNullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return (string) $value; // @phpstan-ignore cast.string
    }
}
