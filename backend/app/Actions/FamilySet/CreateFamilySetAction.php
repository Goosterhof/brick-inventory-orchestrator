<?php

declare(strict_types = 1);

namespace App\Actions\FamilySet;

use App\Actions\GetSetAction;
use App\DataTransferObjects\Input\FamilySet\CreateFamilySetData;
use App\DataTransferObjects\Input\FamilySet\UpdateFamilySetData;
use App\Models\Family;
use App\Models\FamilySet;
use Illuminate\Database\ConnectionInterface;

final readonly class CreateFamilySetAction
{
    public function __construct(
        private GetSetAction $getSetAction,
        private UpdateFamilySetAction $updateFamilySetAction,
        private FamilySet $familySet,
        private ConnectionInterface $connection,
    ) {}

    public function execute(Family $family, CreateFamilySetData $createFamilySetData): FamilySet
    {
        /** @var FamilySet */
        return $this->connection->transaction(function() use ($family, $createFamilySetData): FamilySet {
            $set = $this->getSetAction->execute($createFamilySetData->setNum);

            /** @var FamilySet $familySet */
            $familySet = $this->familySet->newInstance();
            $familySet->family_id = $family->id;
            $familySet->set_id = $set->id;
            $familySet->save();

            return $this->updateFamilySetAction->execute($familySet, new UpdateFamilySetData(
                quantity: $createFamilySetData->quantity,
                status: $createFamilySetData->status,
                purchaseDateProvided: true,
                purchaseDate: $createFamilySetData->purchaseDate,
                notesProvided: true,
                notes: $createFamilySetData->notes,
            ));
        });
    }
}
