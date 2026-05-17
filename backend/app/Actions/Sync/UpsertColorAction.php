<?php

declare(strict_types = 1);

namespace App\Actions\Sync;

use App\DataTransferObjects\Input\Lego\LegoColorData;
use App\Models\Color;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\UniqueConstraintViolationException;

final readonly class UpsertColorAction
{
    public function __construct(
        private Color $color,
        private ConnectionInterface $connection,
    ) {}

    public function execute(LegoColorData $legoColorData): Color
    {
        try {
            return $this->connection->transaction(function() use ($legoColorData): Color {
                $color = $this->color->newQuery()->where('rebrickable_id', $legoColorData->id)->first();

                if (!$color instanceof Color) {
                    /** @var Color $color */
                    $color = $this->color->newInstance();
                    $color->rebrickable_id = $legoColorData->id;
                }

                $color->name = $legoColorData->name;
                $color->rgb = $legoColorData->rgb;
                $color->is_transparent = $legoColorData->isTransparent;
                $color->save();

                return $color;
            });
        } catch (UniqueConstraintViolationException) {
            return $this->connection->transaction(function() use ($legoColorData): Color {
                /** @var Color */
                $color = $this->color->newQuery()->where('rebrickable_id', $legoColorData->id)->firstOrFail();

                $color->name = $legoColorData->name;
                $color->rgb = $legoColorData->rgb;
                $color->is_transparent = $legoColorData->isTransparent;
                $color->save();

                return $color;
            });
        }
    }
}
