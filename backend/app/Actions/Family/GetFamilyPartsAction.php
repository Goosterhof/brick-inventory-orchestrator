<?php

declare(strict_types = 1);

namespace App\Actions\Family;

use App\Models\Family;
use App\Models\StorageOptionPart;
use Illuminate\Contracts\Pagination\CursorPaginator;
use stdClass;

final readonly class GetFamilyPartsAction
{
    private const int DEFAULT_PER_PAGE = 25;

    private const int MAX_PER_PAGE = 100;

    public function __construct(
        private StorageOptionPart $storageOptionPart,
    ) {}

    /**
     * Get all parts stored across all storage locations for a family.
     *
     * @return CursorPaginator<int, stdClass>
     */
    public function execute(Family $family, int $perPage = self::DEFAULT_PER_PAGE, ?string $cursor = null): CursorPaginator
    {
        return $this->storageOptionPart->newQuery()
            ->join('storage_options', 'storage_option_parts.storage_option_id', '=', 'storage_options.id')
            ->join('parts', 'storage_option_parts.part_id', '=', 'parts.id')
            ->leftJoin('colors', 'storage_option_parts.color_id', '=', 'colors.id')
            ->where('storage_options.family_id', $family->id)
            ->select([
                'storage_option_parts.id',
                'storage_option_parts.part_id',
                'parts.part_num',
                'parts.name as part_name',
                'parts.image_url as part_image_url',
                'storage_option_parts.color_id',
                'colors.name as color_name',
                'colors.rgb as color_rgb',
                'storage_option_parts.storage_option_id',
                'storage_options.name as storage_option_name',
                'storage_option_parts.quantity',
            ])
            ->selectRaw(
                '(SELECT family_sets.id FROM family_sets'
                . ' INNER JOIN set_parts ON set_parts.set_id = family_sets.set_id'
                . ' WHERE set_parts.part_id = storage_option_parts.part_id'
                . ' AND set_parts.color_id = storage_option_parts.color_id'
                . ' AND family_sets.family_id = ?'
                . ' LIMIT 1) as family_set_id',
                [$family->id],
            )
            ->orderBy('storage_option_parts.id')
            ->toBase()
            ->cursorPaginate(
                perPage: min($perPage, self::MAX_PER_PAGE),
                cursorName: 'cursor',
                cursor: $cursor,
            );
    }
}
