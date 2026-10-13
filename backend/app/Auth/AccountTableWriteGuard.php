<?php

declare(strict_types = 1);

namespace App\Auth;

use Closure;
use Illuminate\Database\Connection;
use Illuminate\Database\MariaDbConnection;
use Illuminate\Database\MySqlConnection;
use Illuminate\Database\PostgresConnection;
use Illuminate\Database\SQLiteConnection;
use Illuminate\Database\SqlServerConnection;
use PDO;
use ReflectionFunction;

/**
 * WR-2128: the invariant is about the users and families TABLES, so the guard sits on the SQL a
 * connection is about to run, not on a model or on source text. A connection resolver per driver
 * attaches it to every connection the factory builds: the default one, one named later, one made
 * by DB::build(), and the one DB::purge() leaves to be rebuilt. reconnect() keeps the object, and
 * with it the callback. UPDATE and DELETE pass: the invariant is admission.
 */
final class AccountTableWriteGuard
{
    private const array DRIVERS = [
        'mysql' => MySqlConnection::class,
        'mariadb' => MariaDbConnection::class,
        'pgsql' => PostgresConnection::class,
        'sqlite' => SQLiteConnection::class,
        'sqlsrv' => SqlServerConnection::class,
    ];

    private const array TABLES = ['users', 'families'];

    public static function install(): void
    {
        foreach (self::DRIVERS as $driver => $class) {
            Connection::resolverFor($driver, static function(Closure|PDO $pdo, string $database, string $prefix, array $config) use ($class): Connection {
                /** @var array<string, mixed> $config */
                return self::attach(new $class($pdo, $database, $prefix, $config));
            });
        }
    }

    public static function isInstalledFor(string $driver): bool
    {
        $resolver = Connection::getResolver($driver);

        return $resolver instanceof Closure && new ReflectionFunction($resolver)->getClosureScopeClass()?->getName() === self::class;
    }

    public static function attach(Connection $connection): Connection
    {
        return $connection->beforeExecuting(static function(string $query, array $bindings, Connection $connection): void {
            if (self::insertsIntoAccountTable($query, $connection->getTablePrefix())) {
                AccountProvisioningPermit::assertOpen('an INSERT into an account table');
            }
        });
    }

    public static function insertsIntoAccountTable(string $sql, string $prefix = ''): bool
    {
        $sql = (string) preg_replace(['#/\*.*?\*/#s', '/--[^\n]*/'], ' ', $sql);
        $tables = implode('|', array_map(fn(string $table): string => preg_quote($prefix . $table, '/'), self::TABLES));
        $identifierPart = '[`"\[]?[\w$]+[`"\]]?';

        return preg_match(
            '/\b(?:insert(?:\s+or\s+\w+)?(?:\s+ignore)?(?:\s+into)?|replace(?:\s+into)?|merge\s+into|copy)\s+'
            . '(?:' . $identifierPart . '\s*\.\s*)*'
            . '[`"\[]?(?:' . $tables . ')[`"\]]?(?![\w$])/i',
            $sql,
        ) === 1;
    }
}
