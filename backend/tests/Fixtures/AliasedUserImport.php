<?php

declare(strict_types = 1);

namespace Tests\Fixtures;

use App\Models\User as Member;
use Illuminate\Database\Eloquent\Model;

/**
 * WR-2128: the aliased-import bypass of the old regex scan, in a file of its own because a second
 * import of App\Models\User beside the plain one is removed by Pint.
 */
final class AliasedUserImport
{
    /**
     * @param array<string, mixed> $attributes
     */
    public static function create(array $attributes): Member
    {
        return Model::unguarded(fn(): Member => Member::create($attributes));
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public static function insert(array $attributes): bool
    {
        return Member::insert($attributes);
    }
}
