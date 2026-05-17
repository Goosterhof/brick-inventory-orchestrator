<?php

declare(strict_types = 1);

namespace App\Actions\FamilySet;

use App\Actions\Sync\UpsertSetAction;
use App\Contracts\LegoDataServiceInterface;
use App\DataTransferObjects\Input\Lego\RebrickableUserSetData;
use App\DataTransferObjects\Result\FamilySet\ImportOwnedSetsResultData;
use App\Enums\FamilySetStatus;
use App\Exceptions\InvalidApiResponseException;
use App\Exceptions\MissingRebrickableTokenException;
use App\Exceptions\RebrickableApiException;
use App\Models\Family;
use App\Models\FamilySet;
use App\Models\Set;
use Illuminate\Database\ConnectionInterface;

use function count;
use function sprintf;

final readonly class ImportOwnedSetsAction
{
    public function __construct(
        private LegoDataServiceInterface $legoDataService,
        private UpsertSetAction $upsertSetAction,
        private FamilySet $familySet,
        private ConnectionInterface $connection,
    ) {}

    /**
     * @throws MissingRebrickableTokenException
     * @throws RebrickableApiException
     * @throws InvalidApiResponseException
     */
    public function execute(Family $family): ImportOwnedSetsResultData
    {
        if ($family->rebrickable_user_token === null) {
            throw MissingRebrickableTokenException::forFamily($family->id);
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;
        /** @var list<string> $skippedSetNums */
        $skippedSetNums = [];
        $complete = true;
        $error = null;
        $pagesProcessed = 0;

        try {
            foreach ($this->legoDataService->fetchUserSets($family->rebrickable_user_token) as $pageUserSets) {
                $this->connection->transaction(function() use (
                    $pageUserSets,
                    $family,
                    &$created,
                    &$updated,
                    &$skipped,
                    &$skippedSetNums,
                ): void {
                    $this->processPage($pageUserSets, $family, $created, $updated, $skipped, $skippedSetNums);
                });

                $pagesProcessed++;
            }
        } catch (InvalidApiResponseException|RebrickableApiException $e) {
            if ($pagesProcessed === 0) {
                throw $e;
            }

            $complete = false;
            $error = sprintf(
                'Import incomplete: %s. %d sets were imported successfully. Retry to fetch remaining sets.',
                $e->getMessage(),
                $created + $updated,
            );
        }

        return new ImportOwnedSetsResultData(
            created: $created,
            updated: $updated,
            skipped: $skipped,
            total: $created + $updated,
            complete: $complete,
            skippedSetNums: $skippedSetNums,
            error: $error,
        );
    }

    /**
     * @param list<RebrickableUserSetData> $pageUserSets
     * @param list<string>                 $skippedSetNums
     */
    private function processPage(
        array $pageUserSets,
        Family $family,
        int &$created,
        int &$updated,
        int &$skipped,
        array &$skippedSetNums,
    ): void {
        if ($pageUserSets === []) {
            return;
        }

        $setsByNum = $this->upsertSetsFromUserData($pageUserSets);
        $familySetsBySetId = $this->loadExistingFamilySetsGroupedBySetId($family, $setsByNum);

        foreach ($pageUserSets as $pageUserSet) {
            $set = $setsByNum[$pageUserSet->set->setNum];
            $existingForSet = $familySetsBySetId[$set->id] ?? [];

            $this->syncFamilySet($family, $set, $existingForSet, $pageUserSet, $created, $updated, $skipped, $skippedSetNums);
        }
    }

    /**
     * @param list<FamilySet> $existingForSet
     * @param list<string>    $skippedSetNums
     */
    private function syncFamilySet(
        Family $family,
        Set $set,
        array $existingForSet,
        RebrickableUserSetData $rebrickableUserSetData,
        int &$created,
        int &$updated,
        int &$skipped,
        array &$skippedSetNums,
    ): void {
        $existingCount = count($existingForSet);

        if ($existingCount > 1) {
            $skipped++;
            $skippedSetNums[] = $rebrickableUserSetData->set->setNum;
        } elseif ($existingCount === 1) {
            $this->updateExistingFamilySet($existingForSet[0], $rebrickableUserSetData->quantity);
            $updated++;
        } else {
            $this->createFamilySet($family, $set, $rebrickableUserSetData->quantity);
            $created++;
        }
    }

    /**
     * @param list<RebrickableUserSetData> $userSets
     *
     * @return array<string, Set>
     */
    private function upsertSetsFromUserData(array $userSets): array
    {
        $setsByNum = [];

        foreach ($userSets as $userSet) {
            $setsByNum[$userSet->set->setNum] = $this->upsertSetAction->execute($userSet->set);
        }

        return $setsByNum;
    }

    /**
     * @param array<string, Set> $setsByNum
     *
     * @return array<int, list<FamilySet>>
     */
    private function loadExistingFamilySetsGroupedBySetId(Family $family, array $setsByNum): array
    {
        $setIds = array_values(array_map(fn(Set $set) => $set->id, $setsByNum));

        $existingFamilySets = $this->familySet->newQuery()
            ->where('family_id', $family->id)
            ->whereIn('set_id', $setIds)
            ->get();

        $familySetsBySetId = [];

        foreach ($existingFamilySets as $existingFamilySet) {
            $familySetsBySetId[$existingFamilySet->set_id][] = $existingFamilySet;
        }

        return $familySetsBySetId;
    }

    private function updateExistingFamilySet(FamilySet $familySet, int $quantity): void
    {
        $familySet->quantity = $quantity;
        $familySet->save();
    }

    private function createFamilySet(Family $family, Set $set, int $quantity): void
    {
        /** @var FamilySet $familySet */
        $familySet = $this->familySet->newInstance();
        $familySet->family_id = $family->id;
        $familySet->set_id = $set->id;
        $familySet->quantity = $quantity;
        $familySet->status = FamilySetStatus::Sealed;
        $familySet->save();
    }
}
