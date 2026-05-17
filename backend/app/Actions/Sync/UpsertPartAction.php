<?php

declare(strict_types = 1);

namespace App\Actions\Sync;

use App\DataTransferObjects\Input\Lego\LegoPartData;
use App\Models\Part;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\UniqueConstraintViolationException;

final readonly class UpsertPartAction
{
    public function __construct(
        private Part $part,
        private ConnectionInterface $connection,
    ) {}

    public function execute(LegoPartData $legoPartData): Part
    {
        try {
            return $this->connection->transaction(function() use ($legoPartData): Part {
                $part = $this->part->newQuery()->where('part_num', $legoPartData->partNum)->first();

                if (!$part instanceof Part) {
                    /** @var Part $part */
                    $part = $this->part->newInstance();
                    $part->part_num = $legoPartData->partNum;
                }

                $part->name = $legoPartData->name;
                $part->category = $legoPartData->categoryId !== null ? (string) $legoPartData->categoryId : null;
                $part->image_url = $legoPartData->imageUrl;
                $part->save();

                return $part;
            });
        } catch (UniqueConstraintViolationException) {
            return $this->connection->transaction(function() use ($legoPartData): Part {
                /** @var Part */
                $part = $this->part->newQuery()->where('part_num', $legoPartData->partNum)->firstOrFail();

                $part->name = $legoPartData->name;
                $part->category = $legoPartData->categoryId !== null ? (string) $legoPartData->categoryId : null;
                $part->image_url = $legoPartData->imageUrl;
                $part->save();

                return $part;
            });
        }
    }
}
