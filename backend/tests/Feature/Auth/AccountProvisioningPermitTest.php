<?php

declare(strict_types = 1);

use App\Auth\AccountProvisioningPermit;
use App\Auth\AccountTableWriteGuard;
use App\Auth\CloseAccountProvisioningPermit;
use App\Exceptions\AccountProvisioningClosedException;
use App\Models\Family;
use App\Models\User;
use App\Models\Users;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Octane\Events\RequestTerminated;
use Laravel\Octane\Events\TaskTerminated;
use Tests\Fixtures\AliasedUserImport;

covers(
    AccountProvisioningPermit::class,
    AccountTableWriteGuard::class,
    CloseAccountProvisioningPermit::class,
    User::class,
    DatabaseSeeder::class,
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
            $before = [User::query()->count(), Family::query()->count()];

            expect(fn() => $shape($this->family, $attributes, $this->existing))
                ->toThrow(AccountProvisioningClosedException::class);

            expect([User::query()->count(), Family::query()->count()])->toBe($before);
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

        it('should hold the connection resolver for every driver', function(string $driver): void {
            expect(AccountTableWriteGuard::isInstalledFor($driver))->toBeTrue();
        })->with(['mysql', 'mariadb', 'pgsql', 'sqlite', 'sqlsrv']);

        it('should refuse every relation shape that inserts a user', function(\Closure $shape) use ($attributes): void {
            $before = [User::query()->count(), Family::query()->count()];

            expect(fn() => Model::unguarded(fn(): mixed => $shape($this->family, $attributes)))
                ->toThrow(AccountProvisioningClosedException::class);

            expect([User::query()->count(), Family::query()->count()])->toBe($before);
        })->with([
            'users()->create()' => [fn(Family $f, \Closure $a): User => $f->users()->create($a($f, 'r1@example.com'))],
            'users()->forceCreate()' => [fn(Family $f, \Closure $a): User => $f->users()->forceCreate($a($f, 'r2@example.com'))],
            'users()->createMany()' => [fn(Family $f, \Closure $a): mixed => $f->users()->createMany([$a($f, 'r3@example.com')])],
            'users()->firstOrCreate()' => [fn(Family $f, \Closure $a): User => $f->users()->firstOrCreate(['email' => 'r4@example.com'], $a($f, 'r4@example.com'))],
            'users()->updateOrCreate()' => [fn(Family $f, \Closure $a): User => $f->users()->updateOrCreate(['email' => 'r5@example.com'], $a($f, 'r5@example.com'))],
            'users()->createOrFirst()' => [fn(Family $f, \Closure $a): User => $f->users()->createOrFirst(['email' => 'r6@example.com'], $a($f, 'r6@example.com'))],
            'users()->createQuietly()' => [fn(Family $f, \Closure $a): User => $f->users()->createQuietly($a($f, 'r7@example.com'))],
            'users()->insert()' => [fn(Family $f, \Closure $a): bool => $f->users()->insert($a($f, 'r8@example.com'))],
            'users()->save(new User)' => [fn(Family $f, \Closure $a): mixed => $f->users()->save(new User()->forceFill($a($f, 'r9@example.com')))],
        ]);

        it('should refuse every raw spelling of an account-table insert', function(\Closure $shape) use ($attributes): void {
            $before = [User::query()->count(), Family::query()->count()];

            expect(fn() => $shape($attributes($this->family, 'raw@example.com')))
                ->toThrow(AccountProvisioningClosedException::class);

            expect([User::query()->count(), Family::query()->count()])->toBe($before);
        })->with([
            'from(users)' => [fn(array $row): bool => DB::query()->from('users')->insert($row)],
            "table('users', 'u')" => [fn(array $row): bool => DB::table('users', 'u')->insert($row)],
            "table('users as u')" => [fn(array $row): bool => DB::table('users as u')->insert($row)],
            'insert into main.users' => [fn(array $row): bool => DB::insert('insert into main.users (name, email, password, family_id) values (?, ?, ?, ?)', array_values($row))],
            'a table name built at runtime' => [function(array $row): bool {
                $table = 'users';

                return DB::table($table)->insert($row);
            }],
            'unprepared INSERT INTO users' => [fn(array $row): bool => DB::unprepared(\sprintf("INSERT INTO users (name, email, password, family_id) VALUES ('x', 'u@example.com', 'p', %d)", $row['family_id']))],
            'statement on "main"."users"' => [fn(array $row): bool => DB::statement('INSERT INTO "main"."users" ("name", "email", "password", "family_id") VALUES (?, ?, ?, ?)', array_values($row))],
            'statement on "main"."families"' => [fn(): bool => DB::statement('insert into "main"."families" ("name") values (?)', ['f'])],
            'a commented INSERT' => [fn(array $row): bool => DB::insert("/* x */ insert /* y */ into -- z\n users (name, email, password, family_id) values (?, ?, ?, ?)", array_values($row))],
        ]);

        it('should refuse class-derived account models from a migration in production', function(): void {
            $this->app['env'] = 'production';
            $before = [User::query()->count(), Family::query()->count()];

            try {
                expect(fn(): int => Artisan::call('migrate', ['--path' => \dirname(__DIR__, 2) . '/Fixtures/migrations', '--realpath' => true, '--force' => true]))
                    ->toThrow(AccountProvisioningClosedException::class);
            } finally {
                $this->app['env'] = 'testing';
            }

            expect([User::query()->count(), Family::query()->count()])->toBe($before);
        });

        it('should refuse a class-derived App\Models\Users model', function() use ($attributes): void {
            require_once \dirname(__DIR__, 2) . '/Fixtures/AppModelsUsers.php';
            $before = User::query()->count();

            expect(fn(): bool => Users::query()->insert($attributes($this->family, 'users@example.com')))
                ->toThrow(AccountProvisioningClosedException::class);

            expect(User::query()->count())->toBe($before);
        });

        it('should refuse the insert on a connection made after boot, after purge and after reconnect', function(): void {
            // A file, not :memory:, so reconnect() and purge() reach the same database.
            $database = (string) tempnam(sys_get_temp_dir(), 'bio-second-');
            config(['database.connections.second' => ['driver' => 'sqlite', 'database' => $database, 'prefix' => '', 'foreign_key_constraints' => false]]);
            $createUsers = function(): void {
                Schema::connection('second')->create('users', function($table): void {
                    $table->id();
                    $table->string('email');
                });
            };
            $insert = fn(): bool => DB::connection('second')->table('users')->insert(['email' => 'second@example.com']);
            $count = fn(): int => DB::connection('second')->table('users')->count();

            $createUsers();
            expect($insert)->toThrow(AccountProvisioningClosedException::class)
                ->and($count())->toBe(0);

            DB::reconnect('second');
            expect($insert)->toThrow(AccountProvisioningClosedException::class)
                ->and($count())->toBe(0);

            DB::purge('second');
            expect($insert)->toThrow(AccountProvisioningClosedException::class)
                ->and($count())->toBe(0);

            $built = DB::build(['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
            expect(fn(): bool => $built->table('users')->insert(['email' => 'built@example.com']))
                ->toThrow(AccountProvisioningClosedException::class);

            DB::purge('second');
            unlink($database);
        });

        it('should refuse account-table inserts compiled by the PostgreSQL grammar', function(\Closure $shape): void {
            $pgsql = DB::connectUsing('pgsql_pretend', ['driver' => 'pgsql', 'host' => '127.0.0.1', 'database' => 'x', 'username' => 'x', 'password' => '', 'prefix' => '', 'schema' => 'public'], force: true);

            expect(fn(): array => $pgsql->pretend(fn() => $shape($pgsql)))
                ->toThrow(AccountProvisioningClosedException::class);

            DB::purge('pgsql_pretend');
        })->with([
            'insert' => [fn($c): bool => $c->table('users')->insert(['email' => 'x'])],
            'insertGetId' => [fn($c): int => $c->table('users')->insertGetId(['email' => 'x'])],
            'insertOrIgnore' => [fn($c): int => $c->table('users')->insertOrIgnore(['email' => 'x'])],
            'upsert' => [fn($c): int => $c->table('users')->upsert([['email' => 'x']], ['email'])],
            'insertUsing' => [fn($c): int => $c->table('users')->insertUsing(['email'], $c->table('sets')->select('name'))],
            'public.users' => [fn($c): bool => $c->table('public.users')->insert(['email' => 'x'])],
            'families' => [fn($c): bool => $c->table('families')->insert(['name' => 'x'])],
        ]);

        it('should match the compiled SQL of both grammars and nothing else', function(string $sql, bool $refused): void {
            expect(AccountTableWriteGuard::insertsIntoAccountTable($sql))->toBe($refused);
        })->with([
            ['insert into "users" ("name", "email") values (?, ?)', true],
            ['insert or ignore into "users" ("name", "email") values (?, ?)', true],
            ['insert into "users" ("name", "email") values (?, ?) returning "id"', true],
            ['insert into "users" ("name", "email") values (?, ?) on conflict do nothing', true],
            ['insert into "users" ("name", "email") values (?, ?) on conflict do nothing returning *', true],
            ['insert into "users" ("name", "email") values (?, ?) on conflict ("email") do update set "name" = "excluded"."name"', true],
            ['insert into "users" ("email") select "name" from "sets"', true],
            ['insert or ignore into "users" ("email") select "name" from "sets"', true],
            ['insert into "users" ("email") select "name" from "sets" on conflict do nothing', true],
            ['insert into "users" as "u" ("name", "email") values (?, ?)', true],
            ['insert into "main"."users" ("name", "email") values (?, ?)', true],
            ['insert into "public"."users" ("name", "email") values (?, ?)', true],
            ['insert into "families" ("name") values (?)', true],
            ['insert into "families" ("name") values (?) on conflict ("name") do update set "name" = "excluded"."name"', true],
            ['INSERT INTO users VALUES (1)', true],
            ['insert into `users` (`email`) values (?)', true],
            ['replace into users (email) values (?)', true],
            ['copy users from stdin', true],
            ['merge into users using x on true when not matched then insert default values', true],
            ['insert into "sets" ("name") values (?)', false],
            ['insert into "sets" ("name") select "name" from "users"', false],
            ['update "users" set "name" = ? where "id" = ?', false],
            ['delete from "users" where "id" = ?', false],
            ['select * from "users"', false],
            ['insert into "user_tokens" ("name") values (?)', false],
            ['insert into "__temp__users" ("name") values (?)', false],
            ['UPDATE families SET head_id = ( SELECT id FROM users WHERE users.family_id = families.id ORDER BY id LIMIT 1 ) WHERE head_id IS NULL', false],
        ]);

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

    describe('database seeder (WR-2192)', function(): void {
        afterEach(function(): void {
            $this->app['env'] = 'testing';
        });

        it('should refuse to seed its known-password account outside local and testing', function(string $environment): void {
            $this->app['env'] = $environment;
            $before = User::query()->count();

            expect(fn(): int => Artisan::call('db:seed', ['--force' => true]))
                ->toThrow(\RuntimeException::class, \sprintf('refuses to run in the "%s" environment', $environment));

            expect(User::query()->count())->toBe($before)
                ->and(AccountProvisioningPermit::isOpen())->toBeFalse();
        })->with(['production', 'staging', 'e2e']);

        it('should seed its test account in local and testing and close the permit after', function(string $environment): void {
            $this->app['env'] = $environment;

            Artisan::call('db:seed', ['--force' => true]);

            expect(User::query()->where('email', 'test@example.com')->count())->toBe(1)
                ->and(AccountProvisioningPermit::isOpen())->toBeFalse();
        })->with(['local', 'testing']);
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
