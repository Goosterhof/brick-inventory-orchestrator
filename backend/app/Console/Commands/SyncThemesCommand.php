<?php

declare(strict_types = 1);

namespace App\Console\Commands;

use App\Actions\Sync\SyncThemesAction;
use Illuminate\Console\Command;

use function sprintf;

/**
 * Artisan command: `themes:sync`.
 *
 * Pulls the LEGO theme catalog from Rebrickable and resolves the
 * self-referencing `parent_id` tree. Scheduled weekly in `routes/console.php`.
 */
final class SyncThemesCommand extends Command
{
    protected $signature = 'themes:sync';

    protected $description = 'Sync the LEGO theme catalog from Rebrickable';

    public function handle(SyncThemesAction $syncThemesAction): int
    {
        $themeSyncResultData = $syncThemesAction->execute();

        $this->info(sprintf(
            'Themes sync complete: fetched=%d upserted=%d parentsLinked=%d',
            $themeSyncResultData->fetched,
            $themeSyncResultData->upserted,
            $themeSyncResultData->parentsLinked,
        ));

        return self::SUCCESS;
    }
}
