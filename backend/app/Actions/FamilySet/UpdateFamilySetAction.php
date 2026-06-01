<?php

declare(strict_types = 1);

namespace App\Actions\FamilySet;

use App\DataTransferObjects\Input\FamilySet\UpdateFamilySetData;
use App\Enums\FamilySetStatus;
use App\Models\FamilySet;
use DateTimeInterface;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\DateFactory;

final readonly class UpdateFamilySetAction
{
    public function __construct(
        private DateFactory $dateFactory,
        private ConnectionInterface $connection,
    ) {}

    public function execute(FamilySet $familySet, UpdateFamilySetData $updateFamilySetData): FamilySet
    {
        return $this->connection->transaction(function() use ($familySet, $updateFamilySetData): FamilySet {
            if ($updateFamilySetData->quantity !== null) {
                $familySet->quantity = $updateFamilySetData->quantity;
            }

            if ($updateFamilySetData->status instanceof FamilySetStatus) {
                $familySet->status = $updateFamilySetData->status;

                if (
                    $updateFamilySetData->status === FamilySetStatus::InProgress
                    && $familySet->build_started_at === null
                ) {
                    $familySet->build_started_at = $this->dateFactory->now();
                }

                if (
                    $updateFamilySetData->status === FamilySetStatus::Built
                    && $familySet->built_at === null
                ) {
                    $familySet->built_at = $this->dateFactory->now();
                }
            }

            if ($updateFamilySetData->purchaseDateProvided) {
                $familySet->purchase_date = $updateFamilySetData->purchaseDate instanceof DateTimeInterface
                    ? $this->dateFactory->instance($updateFamilySetData->purchaseDate)
                    : null;
            }

            if ($updateFamilySetData->notesProvided) {
                $familySet->notes = $updateFamilySetData->notes;
            }

            $familySet->save();

            return $familySet;
        });
    }
}
