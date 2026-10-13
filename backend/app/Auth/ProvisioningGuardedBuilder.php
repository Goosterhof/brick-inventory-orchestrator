<?php

declare(strict_types = 1);

namespace App\Auth;

use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Collection;
use Override;

/**
 * WR-2128: the bulk insert paths of an Eloquent query never build a model, so the model's own
 * insert guard cannot see them. This builder refuses them unless the provisioning permit is open.
 *
 * @template TModel of Model
 *
 * @extends Builder<TModel>
 */
final class ProvisioningGuardedBuilder extends Builder
{
    /**
     * @param array<array-key, mixed> $values
     */
    public function insert(array $values): bool
    {
        AccountProvisioningPermit::assertOpen('insert()');

        return $this->toBase()->insert($values);
    }

    /**
     * @param array<string, mixed> $values
     */
    public function insertGetId(array $values, ?string $sequence = null): int
    {
        AccountProvisioningPermit::assertOpen('insertGetId()');

        return $this->toBase()->insertGetId($values, $sequence);
    }

    /**
     * @param array<array-key, mixed> $values
     */
    public function insertOrIgnore(array $values): int
    {
        AccountProvisioningPermit::assertOpen('insertOrIgnore()');

        return $this->toBase()->insertOrIgnore($values);
    }

    /**
     * @param array<array-key, mixed>                                 $values
     * @param non-empty-array<non-empty-string>                       $returning
     * @param non-empty-array<non-empty-string>|non-empty-string|null $uniqueBy
     *
     * @return Collection<int, object>
     */
    public function insertOrIgnoreReturning(array $values, array $returning = ['*'], array|string|null $uniqueBy = null): Collection
    {
        AccountProvisioningPermit::assertOpen('insertOrIgnoreReturning()');

        return $this->toBase()->insertOrIgnoreReturning($values, $returning, $uniqueBy);
    }

    /**
     * @param list<string> $columns
     * @param Builder<*>|Closure|QueryBuilder|string            $query
     */
    public function insertUsing(array $columns, Builder|Closure|QueryBuilder|string $query): int
    {
        AccountProvisioningPermit::assertOpen('insertUsing()');

        return $this->toBase()->insertUsing($columns, $query);
    }

    /**
     * @param list<string> $columns
     * @param Builder<*>|Closure|QueryBuilder|string            $query
     */
    public function insertOrIgnoreUsing(array $columns, Builder|Closure|QueryBuilder|string $query): int
    {
        AccountProvisioningPermit::assertOpen('insertOrIgnoreUsing()');

        return $this->toBase()->insertOrIgnoreUsing($columns, $query);
    }

    /**
     * @param array<array-key, mixed>        $values
     * @param array<array-key, mixed>|string $uniqueBy
     * @param array<array-key, mixed>|null   $update
     */
    #[Override]
    public function upsert(array $values, $uniqueBy, $update = null): int
    {
        AccountProvisioningPermit::assertOpen('upsert()');

        return parent::upsert($values, $uniqueBy, $update);
    }
}
