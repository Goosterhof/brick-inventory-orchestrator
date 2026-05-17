<?php

declare(strict_types = 1);

namespace App\Actions\Sync;

use App\DataTransferObjects\Input\Lego\LegoSetData;
use App\Models\Set;
use App\Models\Theme;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\UniqueConstraintViolationException;

final readonly class UpsertSetAction
{
    public function __construct(
        private Set $set,
        private Theme $theme,
        private ConnectionInterface $connection,
    ) {}

    public function execute(LegoSetData $legoSetData): Set
    {
        $themeId = $this->resolveLocalThemeId($legoSetData->themeId);

        try {
            return $this->connection->transaction(function() use ($legoSetData, $themeId): Set {
                $set = $this->set->newQuery()->where('set_num', $legoSetData->setNum)->first();

                if (!$set instanceof Set) {
                    /** @var Set $set */
                    $set = $this->set->newInstance();
                    $set->set_num = $legoSetData->setNum;
                }

                $set->name = $legoSetData->name;
                $set->year = $legoSetData->year;
                $set->theme_id = $themeId;
                $set->num_parts = $legoSetData->numParts;
                $set->image_url = $legoSetData->imageUrl;
                $set->save();

                return $set;
            });
        } catch (UniqueConstraintViolationException) {
            return $this->connection->transaction(function() use ($legoSetData, $themeId): Set {
                /** @var Set */
                $set = $this->set->newQuery()->where('set_num', $legoSetData->setNum)->firstOrFail();

                $set->name = $legoSetData->name;
                $set->year = $legoSetData->year;
                $set->theme_id = $themeId;
                $set->num_parts = $legoSetData->numParts;
                $set->image_url = $legoSetData->imageUrl;
                $set->save();

                return $set;
            });
        }
    }

    /**
     * Resolve the local themes.id for a given rebrickable_id.
     *
     * Returns null when the rebrickable theme is not yet in our catalog —
     * the next `themes:sync` repopulates the catalog. We do not auto-create
     * (that's the sync command's responsibility).
     */
    private function resolveLocalThemeId(?int $rebrickableThemeId): ?int
    {
        if ($rebrickableThemeId === null) {
            return null;
        }

        /** @var int|null $localId */
        $localId = $this->theme->newQuery()
            ->where('rebrickable_id', $rebrickableThemeId)
            ->value('id');

        return $localId;
    }
}
