<?php

declare(strict_types = 1);

namespace App\Actions\Sync;

use App\Contracts\LegoDataServiceInterface;
use App\DataTransferObjects\Result\Sync\ThemeSyncResultData;
use App\Models\Theme;

/**
 * Syncs the LEGO theme catalog from Rebrickable.
 *
 * Two-pass strategy:
 *   1. First pass: upsert each theme by rebrickable_id, parent_id left null.
 *      A child can appear in the Rebrickable stream before its parent (themes
 *      can be added later upstream), so we cannot resolve FKs in a single pass.
 *   2. Second pass: walk the in-memory map (rebrickable_id → local id) and
 *      assign parent_id where the parent exists locally. Missing parents
 *      stay null — this is rare and self-heals on the next sync.
 *
 * O(N) on ~600 rows; cheap.
 */
final readonly class SyncThemesAction
{
    public function __construct(
        private LegoDataServiceInterface $legoDataService,
        private UpsertThemeAction $upsertThemeAction,
        private Theme $theme,
    ) {}

    public function execute(): ThemeSyncResultData
    {
        $fetched = 0;
        $upserted = 0;

        /** @var array<int, int> $rebrickableIdToLocalId Map of rebrickable_id → local id */
        $rebrickableIdToLocalId = [];

        /** @var array<int, int|null> $rebrickableIdToParentRebrickableId Map of rebrickable_id → parent_rebrickable_id */
        $rebrickableIdToParentRebrickableId = [];

        // Pass 1: upsert all themes (parent_id stays null)
        foreach ($this->legoDataService->fetchThemes() as $page) {
            foreach ($page as $legoThemeData) {
                $fetched++;
                $theme = $this->upsertThemeAction->execute($legoThemeData);
                $upserted++;

                $rebrickableIdToLocalId[$legoThemeData->id] = $theme->id;
                $rebrickableIdToParentRebrickableId[$legoThemeData->id] = $legoThemeData->parentId;
            }
        }

        // Pass 2: resolve parent_id FK using the in-memory mapping
        $parentsLinked = 0;

        foreach ($rebrickableIdToParentRebrickableId as $rebrickableId => $parentRebrickableId) {
            if ($parentRebrickableId === null) {
                continue;
            }

            if (!isset($rebrickableIdToLocalId[$parentRebrickableId])) {
                continue;
            }

            $localId = $rebrickableIdToLocalId[$rebrickableId];
            $parentLocalId = $rebrickableIdToLocalId[$parentRebrickableId];

            $this->theme->newQuery()
                ->where('id', $localId)
                ->update(['parent_id' => $parentLocalId]);

            $parentsLinked++;
        }

        return new ThemeSyncResultData(
            fetched: $fetched,
            upserted: $upserted,
            parentsLinked: $parentsLinked,
        );
    }
}
