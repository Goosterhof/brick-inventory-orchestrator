<?php

declare(strict_types = 1);

namespace App\Actions\Sync;

use App\DataTransferObjects\Input\Lego\LegoThemeData;
use App\Models\Theme;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\UniqueConstraintViolationException;

/**
 * Upserts a single Theme catalog row by its Rebrickable id.
 *
 * Note: parent_id FK is intentionally NOT set here. SyncThemesAction does a
 * second pass once all themes are persisted, since a child can arrive before
 * its parent in the Rebrickable result stream.
 */
final readonly class UpsertThemeAction
{
    public function __construct(
        private Theme $theme,
        private ConnectionInterface $connection,
    ) {}

    public function execute(LegoThemeData $legoThemeData): Theme
    {
        try {
            return $this->connection->transaction(function() use ($legoThemeData): Theme {
                $theme = $this->theme->newQuery()->where('rebrickable_id', $legoThemeData->id)->first();

                if (!$theme instanceof Theme) {
                    /** @var Theme $theme */
                    $theme = $this->theme->newInstance();
                    $theme->rebrickable_id = $legoThemeData->id;
                }

                $theme->name = $legoThemeData->name;
                $theme->save();

                return $theme;
            });
        } catch (UniqueConstraintViolationException) {
            return $this->connection->transaction(function() use ($legoThemeData): Theme {
                /** @var Theme */
                $theme = $this->theme->newQuery()->where('rebrickable_id', $legoThemeData->id)->firstOrFail();

                $theme->name = $legoThemeData->name;
                $theme->save();

                return $theme;
            });
        }
    }
}
