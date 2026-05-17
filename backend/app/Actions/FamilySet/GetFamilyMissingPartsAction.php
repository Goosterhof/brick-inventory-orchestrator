<?php

declare(strict_types = 1);

namespace App\Actions\FamilySet;

use App\DataTransferObjects\Result\Family\FamilyMissingPartsData;
use App\Enums\FamilySetStatus;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\SetPart;
use App\Models\StorageOption;
use App\Models\StorageOptionPart;
use Illuminate\Support\Collection;
use stdClass;

use function in_array;

final readonly class GetFamilyMissingPartsAction
{
    public function __construct(
        private FamilySet $familySet,
        private SetPart $setPart,
        private StorageOption $storageOption,
        private StorageOptionPart $storageOptionPart,
    ) {}

    public function execute(Family $family): FamilyMissingPartsData
    {
        // Q1: Claiming family_sets — id + set_id. Wishlist is excluded (not owned). InStorage is excluded
        // because its parts are pooled in storage_option_parts and are treated as available for other
        // builds; counting them as "needed" would double-book against the same storage rows.
        /** @var Collection<int, stdClass> $familySets */
        $familySets = $this->familySet->newQuery()
            ->where('family_sets.family_id', $family->id)
            ->whereNotIn('family_sets.status', [FamilySetStatus::Wishlist->value, FamilySetStatus::InStorage->value])
            ->select([
                'family_sets.id as family_set_id',
                'family_sets.set_id',
            ])
            ->toBase()
            ->get();

        if ($familySets->isEmpty()) {
            return new FamilyMissingPartsData(shortfalls: [], unknownFamilySetIds: []);
        }

        /** @var list<int> $setIds */
        $setIds = $familySets->pluck('set_id')->unique()->values()->all();

        // Q2: Aggregated NEEDED — one row per (part_num, color_id) with
        // SUM(set_parts.quantity × family_sets.quantity). Joining family_sets applies multiplicity in SQL.
        /** @var Collection<int, stdClass> $neededRows */
        $neededRows = $this->setPart->newQuery()
            ->where('set_parts.is_spare', false)
            ->join('family_sets', 'family_sets.set_id', '=', 'set_parts.set_id')
            ->join('parts', 'parts.id', '=', 'set_parts.part_id')
            ->join('colors', 'colors.id', '=', 'set_parts.color_id')
            ->where('family_sets.family_id', $family->id)
            ->whereNotIn('family_sets.status', [FamilySetStatus::Wishlist->value, FamilySetStatus::InStorage->value])
            ->groupBy('parts.id', 'parts.part_num', 'set_parts.color_id', 'parts.name', 'colors.name', 'colors.rgb', 'parts.image_url')
            ->selectRaw('parts.id AS part_id, parts.part_num AS part_num, set_parts.color_id AS color_id, parts.name AS part_name, colors.name AS color_name, colors.rgb AS color_hex, parts.image_url AS part_image_url, SUM(set_parts.quantity * family_sets.quantity) AS quantity_needed')
            ->toBase()
            ->get();

        // Q3: Aggregated STORED per (part_num, color_id) across this family's storage options.
        // NULL color_id stored rows cannot satisfy a colored need, so we filter them out — matches the
        // strict part+color equality used by GetFamilySetCompletionAction.
        /** @var list<int> $storageOptionIds */
        $storageOptionIds = $this->storageOption->newQuery()
            ->where('family_id', $family->id)
            ->pluck('id')
            ->all();

        /** @var Collection<string, stdClass> $storedByKey */
        $storedByKey = collect();

        if ($storageOptionIds !== []) {
            /** @var Collection<int, stdClass> $storedRows */
            $storedRows = $this->storageOptionPart->newQuery()
                ->whereIn('storage_option_parts.storage_option_id', $storageOptionIds)
                ->whereNotNull('storage_option_parts.color_id')
                ->join('parts', 'parts.id', '=', 'storage_option_parts.part_id')
                ->groupBy('parts.part_num', 'storage_option_parts.color_id')
                ->selectRaw('parts.part_num AS part_num, storage_option_parts.color_id AS color_id, SUM(storage_option_parts.quantity) AS quantity_stored')
                ->toBase()
                ->get();

            /** @var Collection<string, stdClass> $storedByKey */
            $storedByKey = $storedRows->keyBy(function(stdClass $row): string {
                $partNum = (string) $row->part_num; // @phpstan-ignore cast.string
                $colorId = (int) $row->color_id; // @phpstan-ignore cast.int

                return $this->key($partNum, $colorId);
            });
        }

        // Q4: needed-by-set lookup. Distinct (part_num, color_id, set_num) rows — one bounded
        // query regardless of set count, because rows are de-duplicated by DISTINCT in SQL.
        /** @var Collection<int, stdClass> $neededBySetRows */
        $neededBySetRows = $this->setPart->newQuery()
            ->where('set_parts.is_spare', false)
            ->join('family_sets', 'family_sets.set_id', '=', 'set_parts.set_id')
            ->join('sets', 'sets.id', '=', 'set_parts.set_id')
            ->join('parts', 'parts.id', '=', 'set_parts.part_id')
            ->where('family_sets.family_id', $family->id)
            ->whereNotIn('family_sets.status', [FamilySetStatus::Wishlist->value, FamilySetStatus::InStorage->value])
            ->distinct()
            ->select(['parts.part_num as part_num', 'set_parts.color_id as color_id', 'sets.set_num as set_num'])
            ->toBase()
            ->get();

        /** @var array<string, list<string>> $setNumsByKey */
        $setNumsByKey = [];
        foreach ($neededBySetRows as $needed) {
            $partNum = (string) $needed->part_num; // @phpstan-ignore cast.string
            $setNum = (string) $needed->set_num; // @phpstan-ignore cast.string
            $colorId = (int) $needed->color_id; // @phpstan-ignore cast.int
            $key = $this->key($partNum, $colorId);
            $setNumsByKey[$key] ??= [];

            if (!in_array($setNum, $setNumsByKey[$key], strict: true)) {
                $setNumsByKey[$key][] = $setNum;
            }
        }

        $shortfalls = [];
        foreach ($neededRows as $neededRow) {
            $partNum = (string) $neededRow->part_num; // @phpstan-ignore cast.string
            $colorId = (int) $neededRow->color_id; // @phpstan-ignore cast.int
            $quantityNeeded = (int) $neededRow->quantity_needed; // @phpstan-ignore cast.int
            $key = $this->key($partNum, $colorId);

            $storedRow = $storedByKey->get($key);
            $quantityStored = $storedRow !== null ? (int) $storedRow->quantity_stored : 0; // @phpstan-ignore cast.int

            $shortfall = max(0, $quantityNeeded - $quantityStored);

            if ($shortfall === 0) {
                continue;
            }

            $partId = (int) $neededRow->part_id; // @phpstan-ignore cast.int
            $partName = (string) $neededRow->part_name; // @phpstan-ignore cast.string
            $colorName = (string) $neededRow->color_name; // @phpstan-ignore cast.string
            $colorHex = (string) $neededRow->color_hex; // @phpstan-ignore cast.string
            /** @var string|null $partImageUrl */
            $partImageUrl = $neededRow->part_image_url;

            $shortfalls[] = [
                'part_id' => $partId,
                'part_num' => $partNum,
                'color_id' => $colorId,
                'part_name' => $partName,
                'color_name' => $colorName,
                'color_hex' => $colorHex,
                'part_image_url' => $partImageUrl,
                'quantity_needed' => $quantityNeeded,
                'quantity_stored' => $quantityStored,
                'shortfall' => $shortfall,
                'needed_by_set_nums' => $setNumsByKey[$key] ?? [],
            ];
        }

        // Q5: Unknown family_sets — non-wishlist sets whose set_id has no rows in set_parts yet.
        // "Known" = any set_id that produced at least one non-spare set_parts row.
        /** @var list<int> $knownSetIdList */
        $knownSetIdList = $this->setPart->newQuery()
            ->where('is_spare', false)
            ->whereIn('set_id', $setIds)
            ->distinct()
            ->pluck('set_id')
            ->all();

        $knownSetIdMap = array_flip($knownSetIdList);

        $unknownFamilySetIds = [];
        foreach ($familySets as $familySet) {
            $setId = (int) $familySet->set_id; // @phpstan-ignore cast.int
            if (!isset($knownSetIdMap[$setId])) {
                $unknownFamilySetIds[] = (string) $familySet->family_set_id; // @phpstan-ignore cast.string
            }
        }

        return new FamilyMissingPartsData(
            shortfalls: $shortfalls,
            unknownFamilySetIds: $unknownFamilySetIds,
        );
    }

    private function key(string $partNum, int $colorId): string
    {
        return $partNum . ':' . $colorId;
    }
}
