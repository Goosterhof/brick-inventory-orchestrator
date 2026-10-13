<?php

declare(strict_types = 1);

use App\Auth\AccountProvisioningPermit;
use App\Auth\CloseAccountProvisioningPermit;
use App\Auth\ProvisioningGuardedBuilder;
use App\Exceptions\AccountProvisioningClosedException;
use App\Models\Family;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Laravel\Octane\Events\RequestTerminated;
use Laravel\Octane\Events\TaskTerminated;
use Tests\Fixtures\AliasedUserImport;

covers(
    AccountProvisioningPermit::class,
    ProvisioningGuardedBuilder::class,
    CloseAccountProvisioningPermit::class,
    User::class,
);

uses(RefreshDatabase::class);

/*
 * WR-2128: the one spec that runs with the provisioning permit CLOSED. Tests\TestCase opens it for
 * every other test, because factories build users as fixtures there and admission is not what
 * those tests measure; this file is where admission is measured.
 */

describe('account provisioning permit', function(): void {
    beforeEach(function(): void {
        $this->family = Family::factory()->create();
        $this->existing = User::factory()->forFamily($this->family)->create(['email' => 'existing@example.com']);

        AccountProvisioningPermit::close();
    });

    afterEach(function(): void {
        expect(AccountProvisioningPermit::isOpen())->toBeFalse('A spec left the provisioning permit open.');
    });

    $attributes = fn(Family $family, string $email): array => [
        'name' => 'Intruder',
        'email' => $email,
        'password' => 'secret-password',
        'family_id' => $family->id,
    ];

    describe('with the permit closed', function() use ($attributes): void {
        it('should refuse a factory create (control: the guard is wired)', function(): void {
            expect(fn() => User::factory()->forFamily($this->family)->create())
                ->toThrow(AccountProvisioningClosedException::class);
        });

        it('should refuse every Eloquent shape that inserts a user', function(\Closure $shape) use ($attributes): void {
            $before = User::query()->count();

            expect(fn() => $shape($this->family, $attributes, $this->existing))
                ->toThrow(AccountProvisioningClosedException::class);

            expect(User::query()->count())->toBe($before);
        })->with([
            // @phpstan-ignore larastan.noModelMake (make() is one of the bypass shapes under test)
            'make()->save()' => [fn(Family $f, \Closure $a): bool => User::make()->forceFill($a($f, 'a@example.com'))->save()],
            'query()->make()->save()' => [fn(Family $f, \Closure $a): bool => User::query()->make()->forceFill($a($f, 'b@example.com'))->save()],
            'where()->create()' => [fn(Family $f, \Closure $a): User => Model::unguarded(fn(): User => User::query()->where('id', '>', 0)->create($a($f, 'c@example.com')))],
            'replicate()->save()' => [fn(Family $f, \Closure $a, User $existing): bool => $existing->replicate()->forceFill(['email' => 'd@example.com'])->save()],
            'app(User::class)->forceFill()->save()' => [fn(Family $f, \Closure $a): bool => app(User::class)->forceFill($a($f, 'e@example.com'))->save()],
            'resolve(User::class)->forceFill()->save()' => [fn(Family $f, \Closure $a): bool => resolve(User::class)->forceFill($a($f, 'f@example.com'))->save()],
            'new $cls()' => [function(Family $f, \Closure $a): bool {
                $cls = 'App\Models\User';

                return new $cls()->forceFill($a($f, 'g@example.com'))->save();
            }],
            'aliased import Member::create()' => [fn(Family $f, \Closure $a): User => AliasedUserImport::create($a($f, 'h@example.com'))],
            'forceCreate()' => [fn(Family $f, \Closure $a): User => User::query()->forceCreate($a($f, 'i@example.com'))],
            // @phpstan-ignore larastan.noModelMake (make() is one of the bypass shapes under test)
            'saveQuietly() (model events off)' => [fn(Family $f, \Closure $a): bool => User::make()->forceFill($a($f, 'j@example.com'))->saveQuietly()],
            'factory createQuietly() (model events off)' => [fn(Family $f): User => User::factory()->forFamily($f)->createQuietly()],
            // @phpstan-ignore larastan.noModelMake (make() is one of the bypass shapes under test)
            'Model::withoutEvents()' => [fn(Family $f, \Closure $a): bool => Model::withoutEvents(fn(): bool => User::make()->forceFill($a($f, 'k@example.com'))->save())],
            // @phpstan-ignore larastan.noModelMake (make() is one of the bypass shapes under test)
            'saveOrIgnore()' => [fn(Family $f, \Closure $a): bool => User::make()->forceFill($a($f, 'l@example.com'))->saveOrIgnore()],
            'User::insert()' => [fn(Family $f, \Closure $a): bool => User::insert($a($f, 'm@example.com'))],
            'aliased Member::insert()' => [fn(Family $f, \Closure $a): bool => AliasedUserImport::insert($a($f, 'n@example.com'))],
            'query()->insertGetId()' => [fn(Family $f, \Closure $a): int => User::query()->insertGetId($a($f, 'o@example.com'))],
            'query()->insertOrIgnore()' => [fn(Family $f, \Closure $a): int => User::query()->insertOrIgnore([$a($f, 'p@example.com')])],
            'query()->fillAndInsert()' => [fn(Family $f, \Closure $a): bool => User::query()->fillAndInsert([$a($f, 'q@example.com')])],
            'query()->upsert()' => [fn(Family $f, \Closure $a): int => User::query()->upsert([$a($f, 'r@example.com')], ['email'])],
            'query()->insertUsing()' => [fn(): int => User::query()->insertUsing(['name', 'email', 'password', 'family_id'], User::query()->select(['name'])->selectRaw("'s@example.com'")->addSelect(['password', 'family_id']))],
            'query()->insertOrIgnoreUsing()' => [fn(): int => User::query()->insertOrIgnoreUsing(['name', 'email', 'password', 'family_id'], User::query()->select(['name'])->selectRaw("'t@example.com'")->addSelect(['password', 'family_id']))],
            'query()->insertOrIgnoreReturning()' => [fn(Family $f, \Closure $a): Collection => User::query()->insertOrIgnoreReturning([$a($f, 'u@example.com')])],
        ]);

        it('should guard every insert the Eloquent builder passes through to the base query', function(): void {
            $passthru = new \ReflectionProperty(Builder::class, 'passthru')->getValue(User::query());
            $inserts = array_values(array_filter($passthru, fn(string $method): bool => str_starts_with($method, 'insert') || str_starts_with($method, 'upsert')));

            $guarded = array_map(
                fn(\ReflectionMethod $method): string => mb_strtolower($method->getName()),
                array_filter(
                    new \ReflectionClass(ProvisioningGuardedBuilder::class)->getMethods(),
                    fn(\ReflectionMethod $method): bool => $method->getDeclaringClass()->getName() === ProvisioningGuardedBuilder::class,
                ),
            );

            expect($inserts)->not->toBeEmpty('No insert methods found in the Eloquent passthru list — the scan is broken.')
                ->and(array_values(array_diff($inserts, $guarded)))->toBe([], 'Laravel passes these inserts to the base query and ProvisioningGuardedBuilder does not override them.');
        });

        it('should leave updates to existing users alone', function(): void {
            $this->existing->name = 'Renamed';
            $this->existing->save();

            expect($this->existing->fresh()?->name)->toBe('Renamed');
        });
    });

    describe('provisioning', function(): void {
        it('should create exactly one user through account:create and close the permit after', function(): void {
            $before = User::query()->count();

            $exitCode = Artisan::call('account:create', ['email' => 'owner@example.com', 'password' => 'secret-password']);

            expect($exitCode)->toBe(0)
                ->and(User::query()->count())->toBe($before + 1)
                ->and(User::query()->where('email', 'owner@example.com')->count())->toBe(1)
                ->and(AccountProvisioningPermit::isOpen())->toBeFalse();
        });

        it('should close the permit when account:create fails mid-create', function(): void {
            expect(fn() => Artisan::call('account:create', ['email' => 'existing@example.com', 'password' => 'secret-password']))
                ->toThrow(QueryException::class);

            expect(AccountProvisioningPermit::isOpen())->toBeFalse()
                ->and(fn() => User::factory()->forFamily($this->family)->create())
                ->toThrow(AccountProvisioningClosedException::class);
        });

        it('should close the permit when the provisioning callback throws', function(): void {
            expect(fn(): mixed => AccountProvisioningPermit::during(function(): never {
                throw new \LogicException('mid-create');
            }))->toThrow(\LogicException::class, 'mid-create');

            expect(fn() => User::factory()->forFamily($this->family)->create())
                ->toThrow(AccountProvisioningClosedException::class);
        });

        it('should admit an insert inside during() and return the callback result', function(): void {
            $user = AccountProvisioningPermit::during(fn(): User => User::factory()->forFamily($this->family)->create());

            expect($user->exists)->toBeTrue()
                ->and(AccountProvisioningPermit::isOpen())->toBeFalse();
        });

        it('should restore an outer opening when a nested during() returns', function(): void {
            AccountProvisioningPermit::open();

            AccountProvisioningPermit::during(fn(): null => null);

            expect(AccountProvisioningPermit::isOpen())->toBeTrue();

            AccountProvisioningPermit::close();
        });
    });

    describe('octane', function(): void {
        it('should close the permit after every request and task', function(string $event): void {
            expect(config('octane.listeners.' . $event))->toContain(CloseAccountProvisioningPermit::class);

            AccountProvisioningPermit::open();
            new CloseAccountProvisioningPermit()->handle();

            expect(AccountProvisioningPermit::isOpen())->toBeFalse();
        })->with([RequestTerminated::class, TaskTerminated::class]);
    });
});
