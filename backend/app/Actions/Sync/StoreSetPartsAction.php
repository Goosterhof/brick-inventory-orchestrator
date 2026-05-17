<?php

declare(strict_types = 1);

namespace App\Actions\Sync;

use App\DataTransferObjects\Input\Lego\LegoSetPartData;
use App\Models\Color;
use App\Models\Part;
use App\Models\Set;
use App\Models\SetPart;
use Carbon\CarbonImmutable;
use Illuminate\Database\ConnectionInterface;

use function sprintf;

final readonly class StoreSetPartsAction
{
    /**
     * Bulk-upsert chunk size for set_parts. Matches PostgreSQL's safe parameter
     * count under our column footprint (~8 cols * 500 rows = 4,000 params, well
     * under PG's 65,535 bound and SQLite's compiled limit).
     */
    private const int CHUNK_SIZE = 500;

    public function __construct(
        private Color $color,
        private Part $part,
        private SetPart $setPart,
        private ConnectionInterface $connection,
    ) {}

    /**
     * Persist a set's part list via bulk upserts.
     *
     * Steps inside a single transaction:
     *   1. Dedupe and bulk-upsert colors keyed by rebrickable_id.
     *   2. Dedupe and bulk-upsert parts keyed by part_num.
     *   3. Reload local primary keys for both natural keys.
     *   4. Build pivot rows for set_parts, dedupe by (set_id, part_id, color_id, is_spare),
     *      bulk-upsert in chunks of {@see self::CHUNK_SIZE}.
     *
     * @param list<LegoSetPartData> $partsData
     */
    public function execute(Set $set, array $partsData): void
    {
        if ($partsData === []) {
            return;
        }

        $this->connection->transaction(function() use ($set, $partsData): void {
            $now = CarbonImmutable::now();

            // 1. Colors — dedupe by rebrickable_id, bulk upsert.
            /** @var array<int, array{rebrickable_id: int, name: string, rgb: string, is_transparent: bool, created_at: CarbonImmutable, updated_at: CarbonImmutable}> $colorPayload */
            $colorPayload = [];
            foreach ($partsData as $partData) {
                $colorPayload[$partData->color->id] = [
                    'rebrickable_id' => $partData->color->id,
                    'name' => $partData->color->name,
                    'rgb' => $partData->color->rgb,
                    'is_transparent' => $partData->color->isTransparent,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            $this->color->newQuery()->upsert(
                array_values($colorPayload),
                ['rebrickable_id'],
                ['name', 'rgb', 'is_transparent', 'updated_at'],
            );

            // 2. Parts — dedupe by part_num, bulk upsert.
            /** @var array<string, array{part_num: string, name: string, category: string|null, image_url: string|null, created_at: CarbonImmutable, updated_at: CarbonImmutable}> $partPayload */
            $partPayload = [];
            foreach ($partsData as $partData) {
                $partPayload[$partData->part->partNum] = [
                    'part_num' => $partData->part->partNum,
                    'name' => $partData->part->name,
                    'category' => $partData->part->categoryId !== null ? (string) $partData->part->categoryId : null,
                    'image_url' => $partData->part->imageUrl,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            $this->part->newQuery()->upsert(
                array_values($partPayload),
                ['part_num'],
                ['name', 'category', 'image_url', 'updated_at'],
            );

            // 3. Reload local IDs by natural key.
            /** @var array<int, int> $colorIdsByRebrickableId */
            $colorIdsByRebrickableId = $this->color->newQuery()
                ->whereIn('rebrickable_id', array_keys($colorPayload))
                ->pluck('id', 'rebrickable_id')
                ->all();

            /** @var array<string, int> $partIdsByPartNum */
            $partIdsByPartNum = $this->part->newQuery()
                ->whereIn('part_num', array_keys($partPayload))
                ->pluck('id', 'part_num')
                ->all();

            // 4. Pivot rows — dedupe by (set_id, part_id, color_id, is_spare), bulk upsert in chunks.
            /** @var array<string, array{set_id: int, part_id: int, color_id: int, quantity: int, is_spare: bool, element_id: string|null, created_at: CarbonImmutable, updated_at: CarbonImmutable}> $setPartPayload */
            $setPartPayload = [];
            foreach ($partsData as $partData) {
                $partId = $partIdsByPartNum[$partData->part->partNum];
                $colorId = $colorIdsByRebrickableId[$partData->color->id];
                $key = sprintf(
                    '%d-%d-%d-%d',
                    $set->id,
                    $partId,
                    $colorId,
                    (int) $partData->isSpare,
                );

                $setPartPayload[$key] = [
                    'set_id' => $set->id,
                    'part_id' => $partId,
                    'color_id' => $colorId,
                    'quantity' => $partData->quantity,
                    'is_spare' => $partData->isSpare,
                    'element_id' => $partData->elementId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach (array_chunk(array_values($setPartPayload), self::CHUNK_SIZE) as $chunk) {
                $this->setPart->newQuery()->upsert(
                    $chunk,
                    ['set_id', 'part_id', 'color_id', 'is_spare'],
                    ['quantity', 'element_id', 'updated_at'],
                );
            }
        });
    }
}
